# Cloudflare RAG Chatbot API with Workers AI

This repository contains a Cloudflare Worker implementation for a RAG (Retrieval Augmented Generation) Chatbot API, which leverages Cloudflare's D1 Database for document storage, Vectorize for vector indexing and Workers AI for modelling.

[See the full Medium article here!](https://medium.com/@calebrocca/llama-2-rag-chatbot-with-cloudflare-workers-ai-3a2b39f8e4e1)

## Setup Guide

### Prerequisites

- Ensure you have `wrangler` CLI installed and configured for your Cloudflare account.

### Dependencies
You can install the required dependencies with:
```
npm install
```

### D1 Database Configuration

1. **Create the D1 Database:**
   Use the `wrangler` CLI to create a new D1 database named "recipe-store".

   ```bash
   wrangler d1 create "recipe-store"
   ```
2. **Add Database Binding:**
   In `wrangler.toml` add the following:
   ```
   [[d1_databases]]
   binding = "DB"
   database_name = "document-store"
   database_id = "abc-def-geh"
   ```
3. **Initialize Database Schema:**
   Add `--local` to execute on local database which `wrangler dev` will use.
   ```
   wrangler d1 execute document-store --file=./schema.sql
   ```

### Vectorize Configuration
1. **Create a Vector Index:**
   With `wrangler`, create a vector index that will store the IDs of D1 documents along with their embedding values.
   ```
   wrangler vectorize create vector-index --dimensions=768 --metric=cosine
   ```
2. **Add Vectorize Binding:**
   After creating the vector index, add the returned configuration block to your `wrangler.toml`:
   ```
   [[vectorize]]
   binding = "VECTOR_INDEX"
   index_name = "vector-index"
   ```

## Deploy The Worker
To test the worker locally, run:
```
wrangler dev
```
And to run the Worker in Cloudflare, use:
```
wrangler deploy
```

## Adding Documents
The `cocktail-recipes.py` script uploads content from a Hugging Face dataset to the API. To enable the document add endpoint, modify the lines in `index.js` as below:
```
   if (action === "add" && request.method === "POST") {
      // POST /doc/add
	  /* return new Response("I have disabled adding documents.", {
        status: 400 
      })*/
      return handleAddDocument(request, env);
   }
```

## Usage
To generate a response based on the query, use the HTTP API endpoint:
```
GET https://ai-assistant.beefie.xyz/api/chat?query=Name some cocktails with a salted rim on the glass
----------
Certainly! Here are some cocktails that typically have a salted rim on the glass:
1. Old Fashioned: This classic cocktail is made with bourbon or rye whiskey, sugar, bitters, and a twist of citrus peel. A salted rim adds a savory element to the drink.
2. Margarita: A classic cocktail made with tequila, lime juice, and triple sec, served in a salt-rimmed glass. The salt helps to balance the acidity of the lime juice.
3. Daiquiri: A simple cocktail made with rum, lime juice, and simple syrup, served in a salt-rimmed glass. The salt helps to balance the sweetness of the simple syrup.
4. Mojito: A refreshing cocktail made with rum, lime juice, mint leaves, and a splash of soda water. A salted rim adds a savory element to the drink.
5. Cosmopolitan: A fruity cocktail made with vodka, triple sec, cranberry juice, and
```

The chat interface can be accessed at /index.html.

![Chat interface](https://cdn-images-1.medium.com/max/800/1*Pqlmp_7q1vmhpC79ZxDWyg.gif)