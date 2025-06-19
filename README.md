# Supabase Book Bot

A project demonstrating how to use Supabase Edge Functions with Docker and the Supabase CLI.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/)
- [Supabase CLI](https://supabase.com/docs/guides/cli):
    - Install the Supabase CLI globally: `npm install -g supabase`


## Usage

- You need to initialize a Supabase project: `npx supabase init`
- Clone the repository within the initialized directory: `git clone ...`
- Create new function: `npx supabase functions new hello-world`
- Or Download already created function: `npx supabase functions download hello-world`
- Set secrets (if needed): `npx supabase secrets set MY_SECRET=secret_value` (for local use .env file)
- Run the function locally: `npx supabase functions serve hello-world`
- Call the function:
```bash
curl -L -X POST 'https://dzyhipociidwlkboqvay.supabase.co/functions/v1/hello-world' -H 'Authorization: Bearer ...' -H 'Content-Type: application/json' --data '{"name":"Functions"}'
```
- Deploy a new version: `npx supabase functions deploy hello-world`
- Delete the function: `npx supabase functions delete hello-world`