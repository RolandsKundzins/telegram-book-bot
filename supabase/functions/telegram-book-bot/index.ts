import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const body = await req.json();

  const chatId = body.message?.chat?.id;
  const text = body.message?.text;

  const reply = `You said: ${text}`;

  console.log(`Received message from chat ${chatId}: ${text}`);

//   Send message back to Telegram
  await fetch(`https://api.telegram.org/bot${Deno.env.get("BOT_TOKEN")}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: reply,
    }),
  });

  return new Response("OK");
});
