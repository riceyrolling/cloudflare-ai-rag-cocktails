import { Ai } from '@cloudflare/ai';

async function getEmbeddings(text, env) {
    const ai = new Ai(env.AI);
    const { data } = await ai.run('@cf/baai/bge-base-en-v1.5', { text });

    if (!data[0]) throw new Error('Failed to generate embeddings');
    return data[0];
}

async function storeEmbeddings(id, embeddings, env) {
    const inserted = await env.VECTOR_INDEX.upsert([
        {
            id: id.toString(),
            values: embeddings,
        }
    ]);
    return {
        id: id.toString(),
        inserted
    }
}

async function searchEmbeddings(query, env) {
    try {
        const queryEmbeddings = await getEmbeddings(query, env);
        const SIMILARITY_THRESHOLD = 0.2; // Only documents greater than 20% similarity

        const vectorQuery = await env.VECTOR_INDEX.query(queryEmbeddings, { topK: 2});
        // Only return top 3 results.
        const vecIds = vectorQuery.matches
            .filter(vec => vec.score > SIMILARITY_THRESHOLD)
            .map(vec => vec.vectorId);
        
        if (vecIds.length) {
          const query = `SELECT * FROM documents WHERE id IN (${vecIds.join(", ")})`;
          const { results } = await env.DB.prepare(query).bind().all()
          return results.map(vec => vec.text)
        }
        
        return [];
        
    } catch (error) {
        console.error("An error occurred:", error);
        return [];
    }
}

export async function generateResponse(query, env) {
    const ai = new Ai(env.AI);

    console.log(query)

    // Get supporting documents
    const documents = await searchEmbeddings(query, env);

    const contextMessage = documents.length
        ? `Context:\n${documents.map(doc => `${doc}`).join("--------------------------------\n")}`
        : ""

    const systemPrompt = `You are a cocktail expert. Your role is to provide cocktails recipes based on the users query.
    Respond with one of the recipes from the context message.
    EXAMPLE RESPONSE:
    {Name of cocktail}
    * {Summary of ingredients and instructions}
    `

    console.log(systemPrompt)
    console.log(contextMessage)

    return await ai.run(
        '@cf/meta/llama-2-7b-chat-int8',
        {
            messages: [
                { role: 'system', content: systemPrompt },
                ...(documents.length ? [{ role: 'system', content: contextMessage }] : []),
                { role: 'user', content: query }
            ]
        }
    )

}

export async function processDocument(document, env) {
    // Store the document in D1 database
    const { results } = await env.DB.prepare("INSERT INTO documents (text) VALUES (?) RETURNING *")
        .bind(document)
        .run()
        
    const record = results.length ? results[0] : null

    console.log("Record stored with ID", record.id)

    if (!record) throw new Error('Failed to store document');

    // Generate embeddings
    const embeddings = await getEmbeddings(document, env);

    // Store embeddings in Vector Index
    const { id, inserted } = await storeEmbeddings(record.id, embeddings, env);

    return { id, document, inserted };

}