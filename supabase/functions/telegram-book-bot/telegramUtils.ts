const botToken = Deno.env.get("BOT_TOKEN")
if (!botToken) {
  throw new Error("BOT_TOKEN environment variable is not set");
}


export async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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

  await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: "POST",
    body: formData,
  });
}
