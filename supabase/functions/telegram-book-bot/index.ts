import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { sendTelegramMessage} from "./telegramUtils.ts";

Deno.serve(async (req) => {
  const body = await req.json();

  const chatId = body.message?.chat?.id;
  const text = body.message?.text;

  const reply = `You definetly said: ${text}`;

  console.log(`Received message from chat ${chatId}: ${text}`);

  await sendTelegramMessage(chatId, reply, Deno.env.get("BOT_TOKEN")!);

  return new Response("OK");
});
