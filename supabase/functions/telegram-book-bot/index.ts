import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { sendTelegramMessage, sendTelegramDocument, sendTelegramAnimation } from "./telegramUtils.ts";
import { searchAnnasArchive, formatBooksMarkdown, getLibgenDownloadUrl, downloadBookFileWithTelegramProgress } from "./bookLibraryUtils.ts";
import { sendEmail } from "./emailUtils.ts";
import { GIFS_OF_DOWNLOAD } from "./constants.ts";


Deno.serve(async (req) => {
  const body = await req.json();
  const chatId = body.message.chat.id;
  const message = body.message.text;

  console.log(`Received message from chat ${chatId}: ${message}`);
  
  (async () => {
    try {
      if (message.toLowerCase().startsWith("id:")) { // STEP 2 - download book
        await handleDownloadRequest(chatId, message);
      } else { // STEP 1 - search for books
        await handleSearchRequest(chatId, message);
      }
    } catch (error) {
      await sendTelegramMessage(chatId, `An error occured. Try again later.`);
      console.error("Error handling request:", error);
    }
  })(); // IIFE - Immediately Invoked Function Expression to handle async operations

  // Early return to Telegram to avoid timeout issues
  return new Response("OK"); // Always OK to avoid Telegram retries
});


async function handleDownloadRequest(chatId: number, message: string) {
  console.log("handleDownloadRequest");

  await sendTelegramMessage(chatId, `Download request received. \nLooking for download link...`);
  const bookId = message.slice(3).trim();
  const downloadLink = await getLibgenDownloadUrl(bookId);

  if (!downloadLink) {
    await sendTelegramMessage(chatId, "Sorry, I couldn't find a download link for that book.");
    console.error(`No download link found for book ID: ${bookId}`);
    return;
  }

  await sendTelegramAnimation(chatId, GIFS_OF_DOWNLOAD[Math.floor(Math.random() * GIFS_OF_DOWNLOAD.length)]);
  const bookData = await downloadBookFileWithTelegramProgress(chatId, downloadLink);

  await sendTelegramMessage(chatId, `Uploading to Telegram...`);
  const filename = `${bookId}.epub`;
  await sendTelegramDocument(chatId, filename, bookData);

  await sendTelegramMessage(chatId, `Uploading book to Pocketbook via "send to Pocketbook" feature... 📤`);
  await sendEmail("rolands.kungs@pbsync.com", filename, bookData);
  await sendTelegramMessage(chatId, `Book sent to pocketbook via email.\n⚠️On first time⚠️ - please check your email for message from "no-reply@pbsync.com" and accept pb@fulfily.eu as trusted sender.\n\nTap sync on your Pocketbook to retrieve the book!\nHappy reading 📖`);
}


async function handleSearchRequest(chatId: number, message: string) {
  console.log("handleSearchRequest");

  await sendTelegramMessage(chatId, "Will give you a few book options in a moment...");

  const bookList = await searchAnnasArchive(message);

  if(bookList.books.length === 0) {
    await sendTelegramMessage(chatId, "No books found for your search query. Please try again with a different query.");
    return;
  }

  for (const book of bookList.books) {
    const bookInfoMarkdown = formatBooksMarkdown(book);
    await sendTelegramMessage(chatId, `${bookInfoMarkdown}`);
  }

  await sendTelegramMessage(chatId, "To download a book, reply with 'id: <book id>'");
}