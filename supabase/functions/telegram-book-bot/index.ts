import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { sendTelegramMessage } from "./telegramUtils.ts";
import { searchAnnasArchive, formatBooksMarkdown } from "./annasArchiveUtils.ts";

Deno.serve(async (req) => {
  const body = await req.json();

  const chatId = body.message?.chat?.id;
  const message = body.message?.text;

  console.log(`Received message from chat ${chatId}: ${message}`);

  if(message.startsWith("download")) {
    console.log("Download request received");
  } else {
    console.log("Searching for books...");

    await sendTelegramMessage(chatId, "Will give you a few book options in a moment...");

    const bookList = await searchAnnasArchive(message);

    for (const book of bookList.books) {
      const bookInfoMarkdown = formatBooksMarkdown(book);
      console.log("bookInfoMarkdown: ", bookInfoMarkdown)
      await sendTelegramMessage(chatId, bookInfoMarkdown);
    }

    await sendTelegramMessage(chatId, "To download a book, reply with 'Book ID: 904c6689b58c08a4eb1c8f2f0432826b'");
  }
  return new Response("OK");
});
