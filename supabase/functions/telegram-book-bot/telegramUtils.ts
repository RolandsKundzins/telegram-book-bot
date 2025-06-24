const botToken = Deno.env.get("BOT_TOKEN")
if (!botToken) {
  throw new Error("BOT_TOKEN environment variable is not set");
}

const TELEGRAM_API_URL = `https://api.telegram.org/bot${botToken}`;

const DOWNLOAD_GIFS= [
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNnJxZTN2cW81NGVjM3I4NTBkY3ZodjNkMW02Y2R3cmJqeGNxYWJ0bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/FgiHOQyKUJmwg/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2hhNnkwMWI5bWgxc2pyZ25hanVkbnUwM2ViMnVxZnc4a3NqamJkcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IRFQYGCokErS0/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExd203aGgyc3F0cG05djhmMnF6enduNTV5aWphOXRnczhsdTZxZjhtMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hL9q5k9dk9l0wGd4e0/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXM4YTZyZ3ZkcTM0cjNyMDdxMjJlajRmbTRrenU4d3hpOGpoNjdsbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/eEZIzmlT7OAOk/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3lzM2psNHVtcmF4MWkxbDl1ZmtxY2FjMzNnM2FjZGp5NzZoaGQ3MiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZH5o2lacOA8Te/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmlyamU3dHcyZW5mcjVkNmVuYnJsZ2xsZGg2aGhseXJpcHg0am90NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dAOgYHH87bQks0PkBO/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjI5bnpvOHd4NHFkb3oxaG9hcjR1OGw4aDc4NGNzb3pua2g4cjN3OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/v2JqIt9EQKMFb1bGUh/giphy.gif",
]


export async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown"
    }),
  });
}

export async function sendTelegramDocument(chatId: number, filename: string, fileData: Uint8Array) {
  const formData = new FormData();
  formData.append("chat_id", chatId.toString());
  formData.append("document", new Blob([fileData]), filename);

  await fetch(`${TELEGRAM_API_URL}/sendDocument`, {
    method: "POST",
    body: formData,
  });
}

export async function sendTelegramDownloadAnimation(chatId: number) {
  await fetch(`${TELEGRAM_API_URL}/sendAnimation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      animation: DOWNLOAD_GIFS[Math.floor(Math.random() * DOWNLOAD_GIFS.length)],
    }),
  });
}