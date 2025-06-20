Vajadzētu saprast kā to key var dabūt.
Šķiet, ka viņu varētu extractot no URL, bet varbūt arī kā citādi.
Vai var bez viņa iztikt?

curl -L -o book.epub "libgen.li/get.php?md5=f29b82e6bb143bdc55defd4980567e81&key=QTHX4MKZJ0EK2I1U"


# Telegram Book Bot on Supabase Edge Functions

A Telegram bot that querries a book library API. 
The user can pick a book to automatically be added to pocketbook cloud.

A project demonstrating how to use Supabase Edge Functions with Docker and the Supabase CLI.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/)
- [Supabase CLI](https://supabase.com/docs/guides/cli):
    - Install the Supabase CLI globally: `npm install -g supabase`


## First time repository setup

- Clone the repository within the initialized directory: `git clone ...`
- You need to initialize a Supabase project: `npx supabase init`
- Setup environment variables - Copy `.env.example` to `.env` and fill in the required values.
- Serving functions locally `npx supabase functions serve`:
    - This will most likely fail because telegram cannot access your local machine. For testing you can also just deploy the function to Supabase
    - But you can test with Curl/Postman
- Set secrets in Supabase remote from you local .env: `npx supabase secrets set --env-file .env`
- Deploy the function to Supabase: `npx supabase functions deploy telegram-book-bot --no-verify-jwt`

## Extra commands

- Create new function: `npx supabase functions new hello-world`
- Or Download already created function: `npx supabase functions download hello-world`
- Delete the function: `npx supabase functions delete hello-world`
- Set secrets in remote (if needed): `npx supabase secrets set MY_SECRET=secret_value` (for local use .env file)

## Install extensions

- Supabase vscode extension
- DENO vscode extension:
  - You need to install DENO CLI first. To check if installed: `deno --version`
