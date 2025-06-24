const botToken = Deno.env.get("BOT_TOKEN")
if (!botToken) {
  throw new Error("BOT_TOKEN environment variable is not set");
}

const TELEGRAM_API_URL = `https://api.telegram.org/bot${botToken}`;


export async function sendTelegramMessage(chatId: number, text: string): Promise<number> {
  const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram sendMessage failed: ${data.description}`);
  return data.result.message_id;
}

export async function editTelegramMessage(chatId: number, messageId: number, text: string) {
  const res = await fetch(`${TELEGRAM_API_URL}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      chat_id: chatId,
      message_id: messageId,
      text, parse_mode: "Markdown"
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram editMessageText failed: ${data.description}`);
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

export async function sendTelegramAnimation(chatId: number, animationUrl: string) {
  await fetch(`${TELEGRAM_API_URL}/sendAnimation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      animation: animationUrl,
    }),
  });
}