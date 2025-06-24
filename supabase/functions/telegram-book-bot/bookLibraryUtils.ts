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


function formatDownloadProgress(percent: number, offset: number, total: number): string {
  const downloadedMB = (offset / (1024 * 1024)).toFixed(2);
  const totalMB = (total / (1024 * 1024)).toFixed(2);
  return `Download progress: *${(percent * 100).toFixed(0)}%* (${downloadedMB} / ${totalMB} MB)`;
}

export async function downloadBookFileWithProgress(chatId: number, url: string): Promise<Uint8Array> {
  const initialMessageId = await sendTelegramMessage(chatId, "Starting download...");

  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) throw new Error("Failed to download");

  const contentLength = response.headers.get('content-length');
  if (!contentLength) {
    await sendTelegramMessage(chatId, "Unknown file size — downloading without progress...");
    const data = new Uint8Array(await response.arrayBuffer());
    await editTelegramMessage(chatId, initialMessageId, "Download complete ✅");
    return data;
  }

  const total = parseInt(contentLength, 10);
  if (total > 50_000_000) {
    await sendTelegramMessage(chatId, "File too large (>50MB) to download.");
    throw new Error("File too large");
  }

  const reader = response.body.getReader();
  const result = new Uint8Array(total);
  let offset = 0;

  let lastUpdate = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    result.set(value, offset);
    offset += value.length;

    const now = Date.now();
    if (now - lastUpdate >= 1200) {
      lastUpdate = now;
      const percent = offset / total;
      const msg = formatDownloadProgress(percent, offset, total);
      editTelegramMessage(chatId, initialMessageId, msg); // don't await this to avoid blocking
    }
  }

  await editTelegramMessage(chatId, initialMessageId, "Download complete ✅");
  return result;
}
