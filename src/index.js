//
// index.js
//
import { getAssetFromKV, NotFoundError, MethodNotAllowedError } from '@cloudflare/kv-asset-handler'
import { processDocument, generateResponse } from './ai';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

// Router
export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const [, rootPath, action] = url.pathname.split('/');

		switch (rootPath) {
			case "doc":
				if (action === "add" && request.method === "POST") {
					// POST /doc/add
					return new Response("I have disabled adding documents for this demo.", { status: 400 })
					//return handleAddDocument(request, env);
				}
				break;
			case "api":
				if (action === "chat" && request.method === "GET") {
					// GET /api/chat?query=What drinks can I make with vodka.

					return handleChatQuery(url, env);
				}
				break;
			default:
				return handlePublic(request, env, ctx);
		}
	}
};

// Route handlers
async function handleAddDocument(request, env) {
	const { data } = await request.json();
	const { id, inserted } = await processDocument(data, env);
	return new Response(JSON.stringify({ id, inserted }), {
		headers: { "Content-Type": "application/json" },
		status: 200
	});
}

async function handleChatQuery(url, env) {
	const query = url.searchParams.get("query");
	const response = await generateResponse(query, env);
	return new Response(JSON.stringify(response), {
		headers: { "Content-Type": "application/json" },
		status: 200
	});
}

async function handlePublic(request, env, ctx) {
	try {
		return await getAssetFromKV(
			{
				request,
				waitUntil: ctx.waitUntil.bind(ctx),
			},
			{
				ASSET_NAMESPACE: env.__STATIC_CONTENT,
				ASSET_MANIFEST: assetManifest,
			}
		);
	} catch (e) {
		if (e instanceof NotFoundError) {
			return new Response('The page was not found.', { status: 404 })
		} else if (e instanceof MethodNotAllowedError) {
			return new Response('The method was not allowed.', { status: 405 })
		} else {
			console.error(e)
			return new Response('An unexpected error occurred', { status: 500 })
		}
	}
}