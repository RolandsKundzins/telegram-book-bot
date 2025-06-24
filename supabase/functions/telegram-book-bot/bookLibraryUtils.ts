import { sendTelegramMessage, editTelegramMessage } from "./telegramUtils.ts";
import { ANNAS_ARCHIVE_TEST_RESPONSE } from "./constants.ts";


function parseSizeMB(sizeStr: string): number {
  // Supports "MB", "GB", "KB"
  const match = sizeStr.match(/^([\d.]+)\s*(KB|MB|GB)$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "GB") return value * 1024;
  if (unit === "MB") return value;
  if (unit === "KB") return value / 1024;
  return 0;
}

function filterBooksBySize(books: any[], maxMB: number) {
  books.forEach(book => {
    const bookSizeMB = parseSizeMB(book.size)
    if(bookSizeMB > maxMB) {
      console.warn(`Book "${book.title}" exceeds size limit: ${bookSizeMB}`);
      book.size = "Book size exceeds limit";
      book.md5 = "Cannot download";
    }
  })
}

// find Book
export async function searchAnnasArchive(
  query: string, // eg title, author, isbn.
) {  
  if(query == "test") {
    return ANNAS_ARCHIVE_TEST_RESPONSE;
  }

  const rapidApiKey = Deno.env.get("RAPID_API_KEY");
  if (!rapidApiKey) {
    throw new Error("RAPID_API_KEY environment variable is not set");
  }

  const params = new URLSearchParams({
    q: query,
    limit: String(4),
    ext: "epub", // FileType also: mobi, azw3
    sort: "mostRelevant", // [newest, largest, oldest, smallest, mostRelevant]
    // lang: "en",
    source: "lgli" // (libgen, libgenLi, zlib etc.)
    // You can also set: cat (category), skip 
  });

  const res = await fetch(`https://annas-archive-api.p.rapidapi.com/search?${params.toString()}`, {
    method: "GET",
    headers: {
      "x-rapidapi-host": "annas-archive-api.p.rapidapi.com",
      "x-rapidapi-key": rapidApiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Annas Archive API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  filterBooksBySize(data.books, 30);
  return data;
}


export function formatBooksMarkdown(book: any ): string {
  if (!book) return 'error occured';

  return [
    `*${book.title}*`,
    `_Author:_ ${book.author}`,
    `_Format:_ ${book.format} | _Year:_ ${book.year}`,
    `_Size:_ ${book.size}`,
    `_Book ID:_ \`${book.md5}\``,
    `[img](${book.imgUrl})`
  ].join('\n');
}


export async function getLibgenDownloadUrl(md5: string): Promise<string | null> {
  const url = `https://libgen.li/get.php?md5=${md5}`;

  const response = await fetch(url);
  const html = await response.text();

  // Find the first link that contains "get.php"
  console.log("Getting LibGen page HTML to retrieve download url:", html);
  const match = html.match(/href="(get\.php\?[^"]+)"/i);

  if (match) {
    return `https://libgen.li/${match[1]}`;
  }

  return null;
}



function calculateDownloadProgress(loaded: number, total: number) {
  const percent = Math.floor((loaded / total) * 100);
  const loadedMB = (loaded / (1024 * 1024)).toFixed(2);
  const totalMB = (total / (1024 * 1024)).toFixed(2);
  return { percent, loadedMB, totalMB };
}

function concatChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const data = new Uint8Array(totalLength);
  let position = 0;
  for (const chunk of chunks) {
    data.set(chunk, position);
    position += chunk.length;
  }
  return data;
}

export async function downloadBookFileWithTelegramProgress(chatId: number, url: string) {
  const initialMessageId = await sendTelegramMessage(chatId, "Starting download...");

  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) throw new Error("Failed to download");

  const contentLength = response.headers.get('content-length')!;
  const total = parseInt(contentLength, 10);
  let loaded = 0;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];

  let lastUpdate = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    loaded += value.length;

    const now = Date.now();
    if (now - lastUpdate <= 500) {
      continue; // Update progress every 500ms
    }
    lastUpdate = now;

    const { percent, loadedMB, totalMB } = calculateDownloadProgress(loaded, total);
    await editTelegramMessage(chatId, initialMessageId, `Download progress: *${percent}%* (${loadedMB} / ${totalMB} MB)`);
  }

  const data = concatChunks(chunks, loaded);
  await editTelegramMessage(chatId, initialMessageId, "Download complete ✅");
  return data;
}
