// Minimal Bun server to assist localhost FHE operations by shelling out to Hardhat tasks
import type { Serve } from "bun";
import path from "node:path";

function corsHeaders(origin?: string) {
	return {
		"Access-Control-Allow-Origin": origin || "*",
		"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type,Authorization",
	} as Record<string, string>;
}

async function readJson<T>(req: Request): Promise<T> {
	const ct = req.headers.get("content-type") || "";
	if (!ct.includes("application/json"))
		throw new Error("Expected application/json body");
	return (await req.json()) as T;
}

async function runHH(args: string[]) {
	const root = path.resolve(process.cwd(), "..");
	const proc = Bun.spawn(["npx", "hardhat", ...args], {
		cwd: root,
		stdout: "pipe",
		stderr: "pipe",
		env: { ...process.env },
	});
	const out = await new Response(proc.stdout).text();
	const err = await new Response(proc.stderr).text();
	console.log(err);
	const code = await proc.exited;
	if (code !== 0) throw new Error(err || out || `hardhat exited with ${code}`);
	return out.trim();
}

export default {
	port: Number(process.env.PORT || 8787),
	development: true,
	async fetch(req) {
		const url = new URL(req.url);
		const origin = req.headers.get("origin") || undefined;
		if (req.method === "OPTIONS")
			return new Response(null, { headers: corsHeaders(origin) });

		try {
			if (url.pathname === "/api/status" && req.method === "GET") {
				return Response.json(
					{ ok: true, network: process.env.HARDHAT_NETWORK || "localhost" },
					{ headers: corsHeaders(origin) },
				);
			}

			if (url.pathname === "/api/encrypt-input" && req.method === "POST") {
				const body = await readJson<{
					contractAddress: string;
					userAddress: string;
					amount: string | number | bigint;
				}>(req);
				const amount = BigInt(body.amount as any);
				if (!body.contractAddress || !body.userAddress)
					throw new Error("Missing contractAddress or userAddress");
				const out = await runHH([
					"onlyfhen:encrypt-input-json",
					"--network",
					process.env.HARDHAT_NETWORK || "localhost",
					"--address",
					body.contractAddress,
					"--user",
					body.userAddress,
					"--amount",
					amount.toString(),
				]);
				const data = JSON.parse(out);
				console.log("json parsed", data);
				return Response.json(data, { headers: corsHeaders(origin) });
			}

			if (url.pathname === "/api/user-decrypt" && req.method === "POST") {
				const body = await readJson<{
					handle: string;
					contractAddress: string;
					signerAddress?: string;
				}>(req);
				console.log("body", body);
				if (!body.handle || !body.contractAddress)
					throw new Error("Missing handle or contractAddress");
				const args = [
					"onlyfhen:user-decrypt-json",
					"--network",
					process.env.HARDHAT_NETWORK || "localhost",
					"--address",
					body.contractAddress,
					"--handle",
					body.handle,
				];
				if (body.signerAddress) args.push("--creator", body.signerAddress);
				const out = await runHH(args);
				const data = JSON.parse(out);
				return Response.json(data, { headers: corsHeaders(origin) });
			}

			return new Response("Not Found", {
				status: 404,
				headers: corsHeaders(origin),
			});
		} catch (error: any) {
			console.error(error);
			return Response.json(
				{ error: error?.message || String(error) },
				{ status: 400, headers: corsHeaders(origin) },
			);
		}
	},
	error(error) {
		console.error(error);
		return new Response(`Internal Error: ${error?.message || String(error)}`, {
			status: 500,
		});
	},
} satisfies Serve;
