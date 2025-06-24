import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { sendTelegramMessage, sendTelegramDocument } from "./telegramUtils.ts";
import { searchAnnasArchive, formatBooksMarkdown, getLibgenDownloadUrl, downloadBookFile } from "./bookLibraryUtils.ts";
import { sendEmail } from "./emailUtils.ts";

Deno.serve(async (req) => {
  const body = await req.json();
  const chatId = body.message?.chat?.id;
  const message = body.message?.text;

  console.log(`Received message from chat ${chatId}: ${message}`);
  
  try {
    if (message.toLowerCase().startsWith("id:")) { // STEP 2 - download book
      await handleDownloadRequest(chatId, message);
    } else { // STEP 1 - search for books
      await handleSearchRequest(chatId, message);
    }
  
    return new Response("OK");
  } catch (error) {
    await sendTelegramMessage(chatId, `An error occured. Try again later.`);
    console.error("Error handling request:", error);
    return new Response("OK"); // Return OK to avoid Telegram retries
  }
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

  await sendTelegramMessage(chatId, `Downloading book...\nThis may take a few minutes`); // TODO: maybe add progress msges

  const filename = `${bookId}.epub`;
  const bookData = await downloadBookFile(downloadLink);

  await sendTelegramMessage(chatId, `Book downloaded. Uploading to Telegram...`);
  await sendTelegramDocument(chatId, filename, bookData);
  // await sendTelegramMessage(chatId, `Enjoy your book! 📚`);

  await sendTelegramMessage(chatId, `Uploading book to Pocketbook via "send to Pocketbook" feature... 📤`);
  try {
    await sendEmail("rolands.kungs@pbsync.com", "Title of email", filename, bookData);  // TODO: Need to use my actual email address here
    await sendTelegramMessage(chatId, `Book successfully sent to Pocketbook! ✉️\nTap "Sync" on your Pocketbook to access it.`);
  } catch (_error) {
    await sendTelegramMessage(chatId, "⚠️ Uh-oh! It looks like the bot can't send the book to Pocketbook. \nPlease check your email and allow the bot to send to Pocketbook. ⚠️");
  }
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