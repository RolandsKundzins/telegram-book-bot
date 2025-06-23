const examplePayload = {
  "total": 10,
  "books": [
    {
      "title": "Never finished : unshackle your mind and win the war within",
      "author": "David Goggins",
      "md5": "904c6689b58c08a4eb1c8f2f0432826b",
      "imgUrl": "https://s3proxy.cdn-zlib.sk//covers299/collections/userbooks/6ffabb65f5f2d480be489286548fe0b2ed1fa3023375d9a097254435e4ed6eba.jpg",
      "size": "17.3MB",
      "genre": "Unknown",
      "format": "pdf",
      "year": "2022",
      "imgFallbackColor": null,
      "sources": [
        "zlib"
      ]
    },
    {
      "title": "Never Finished: Unshackle Your Mind and Win the War Within",
      "author": "David Goggins",
      "md5": "1f3e3b56f3ee5d8dfab242ce25e28007",
      "imgUrl": "https://s3proxy.cdn-zlib.sk//covers299/collections/userbooks/e7c7daf5417db9c66b68d4d03d82372372f311c4940d06da124ece4a431e2a6f.jpg",
      "size": "4.5MB",
      "genre": "Unknown",
      "format": "azw3",
      "year": "2022",
      "imgFallbackColor": null,
      "sources": [
        "zlib"
      ]
    },
    {
      "title": "Never Finished: A small town opposites attract romance",
      "author": "Ana Rhodes",
      "md5": "1ad689f4c1d6585f845dbb30a00c6ec1",
      "imgUrl": "https://s3proxy.cdn-zlib.sk//covers299/collections/userbooks/40ed419f392e310e7e6467a5a1e7ddce79a57c108fb7be275e77ca6a5c6d8962.jpg",
      "size": "0.7MB",
      "genre": "Unknown",
      "format": "pdf",
      "year": "2024",
      "imgFallbackColor": null,
      "sources": [
        "zlib"
      ]
    },
  ]
}


// find Book
export async function searchAnnasArchive(
  query: string, // eg title, author, isbn.
  // options: {  }  // you could allow user to set them
) {  
  if(query == "test") {
    return examplePayload;
  }

  const rapidApiKey = Deno.env.get("RAPID_API_KEY");
  if (!rapidApiKey) {
    throw new Error("RAPID_API_KEY environment variable is not set");
  }

  const params = new URLSearchParams({
    q: query,
    limit: String(3),
    ext: "epub", // FileType also: mobi, azw3
    sort: "mostRelevant", // [newest, largest, oldest, smallest, mostRelevant]
    lang: "en",
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

  return await res.json();
}


export function formatBooksMarkdown(book: any ): string {
  if (!book) {
    return 'error occured';
  }

  return [
    `*${book.title}*`,
    `_Author:_ ${book.author}`,
    `_Book ID:_ \`${book.md5}\``,
    `_Format:_ ${book.format} | _Year:_ ${book.year}`,
    `_Sources:_ ${book.sources.join(", ")}`,
    `[Cover Image](${book.imgUrl})`
  ].join('\n');
}


export async function getLibgenDownloadUrl(md5: string): Promise<string | null> {
  const url = `https://libgen.li/get.php?md5=${md5}`;

  const response = await fetch(url);
  const html = await response.text();

  // Find the first link that contains "get.php"
  console.log("HTML response from libgen:", html);
  const match = html.match(/href="(get\.php\?[^"]+)"/i);

  if (match) {
    return `https://libgen.li/${match[1]}`;
  }

  return null;
}


export async function downloadBookFile(url: string): Promise<Uint8Array> {
  const response = await fetch(url, {
    redirect: "follow" // follow HTTP 3xx redirects, default is 'follow' but explicit here
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download book: ${response.status} ${response.statusText}`);
  }

  const data = new Uint8Array(await response.arrayBuffer());
  return data;
}