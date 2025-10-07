import { db, setJSON } from "~/lib/db";
import { getSupabase } from "~/lib/supabase";
import type { NetworkType } from "~/utils/getNetwork";

export type CreatorProfile = {
	address: string;
	name: string;
	x?: string;
	instagram?: string;
	createdAt: number;
	updatedAt?: number;
};

const STORAGE_KEY_PREFIX = "onlyfhen:creators:v2";

function getStorageKey(network: NetworkType): string {
	return `${STORAGE_KEY_PREFIX}:${network}`;
}

export async function getCreators(
	network: NetworkType,
): Promise<CreatorProfile[]> {
	const supabase = getSupabase();
	if (supabase) {
		const { data, error } = await supabase
			.from("creators")
			.select("address,name,x,instagram,created_at,updated_at")
			.eq("network", network)
			.order("created_at", { ascending: true });

		if (error) {
			return getCreatorsFromLocal(network);
		}

		return (data ?? []).map((row) => ({
			address: String((row as any).address ?? ""),
			name: String((row as any).name ?? ""),
			x: (row as any).x ?? undefined,
			instagram: (row as any).instagram ?? undefined,
			createdAt: (row as any).created_at
				? new Date((row as any).created_at as string).getTime()
				: Date.now(),
			updatedAt: (row as any).updated_at
				? new Date((row as any).updated_at as string).getTime()
				: undefined,
		}));
	}

	return getCreatorsFromLocal(network);
}

async function getCreatorsFromLocal(
	network: NetworkType,
): Promise<CreatorProfile[]> {
	if (!db.isAvailable()) return [];
	try {
		const raw = await db.getItem(getStorageKey(network));
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((it) => it && typeof it.address === "string")
			.map((it) => ({
				address: String(it.address),
				name: typeof it.name === "string" ? it.name : "",
				x: typeof it.x === "string" ? it.x : undefined,
				instagram: typeof it.instagram === "string" ? it.instagram : undefined,
				createdAt: typeof it.createdAt === "number" ? it.createdAt : Date.now(),
				updatedAt: typeof it.updatedAt === "number" ? it.updatedAt : undefined,
			}));
	} catch {
		return [];
	}
}

async function saveCreators(network: NetworkType, list: CreatorProfile[]) {
	if (!db.isAvailable()) return;
	await setJSON(getStorageKey(network), list);
}

export async function upsertCreator(
	network: NetworkType,
	input: {
		address: string;
		name: string;
		x?: string;
		instagram?: string;
	},
): Promise<CreatorProfile> {
	const addr = (input.address || "").toLowerCase();
	const supabase = getSupabase();

	if (supabase) {
		const nowISO = new Date().toISOString();
		const { data, error } = await supabase
			.from("creators")
			.upsert(
				[
					{
						network,
						address: addr,
						name: input.name,
						x: input.x ?? null,
						instagram: input.instagram ?? null,
						updated_at: nowISO,
					},
				],
				{ onConflict: "network,address" },
			)
			.select("address,name,x,instagram,created_at,updated_at")
			.single();

		if (error) {
			return upsertCreatorLocal(network, { ...input, address: addr });
		}

		return {
			address: String((data as any).address),
			name: String((data as any).name ?? ""),
			x: (data as any).x ?? undefined,
			instagram: (data as any).instagram ?? undefined,
			createdAt: (data as any).created_at
				? new Date((data as any).created_at as string).getTime()
				: Date.now(),
			updatedAt: (data as any).updated_at
				? new Date((data as any).updated_at as string).getTime()
				: undefined,
		};
	}

	return upsertCreatorLocal(network, { ...input, address: addr });
}

async function upsertCreatorLocal(
	network: NetworkType,
	input: { address: string; name: string; x?: string; instagram?: string },
): Promise<CreatorProfile> {
	const addr = (input.address || "").toLowerCase();
	const now = Date.now();
	const list = await getCreatorsFromLocal(network);
	const idx = list.findIndex((c) => c.address.toLowerCase() === addr);
	if (idx >= 0) {
		const updated: CreatorProfile = {
			...list[idx],
			name: input.name ?? list[idx].name,
			x: input.x ?? list[idx].x,
			instagram: input.instagram ?? list[idx].instagram,
			updatedAt: now,
		};
		list[idx] = updated;
		await saveCreators(network, list);
		return updated;
	}

	const created: CreatorProfile = {
		address: addr,
		name: input.name,
		x: input.x,
		instagram: input.instagram,
		createdAt: now,
	};
	list.push(created);
	await saveCreators(network, list);
	return created;
}

export async function getCreator(
	network: NetworkType,
	address: string,
): Promise<CreatorProfile | undefined> {
	const addr = (address || "").toLowerCase();
	const supabase = getSupabase();
	if (supabase) {
		const { data, error } = await supabase
			.from("creators")
			.select("address,name,x,instagram,created_at,updated_at")
			.eq("network", network)
			.eq("address", addr)
			.maybeSingle();

		if (error) {
			const list = await getCreatorsFromLocal(network);
			return list.find((c) => c.address.toLowerCase() === addr);
		}

		if (!data) return undefined;
		return {
			address: String((data as any).address),
			name: String((data as any).name ?? ""),
			x: (data as any).x ?? undefined,
			instagram: (data as any).instagram ?? undefined,
			createdAt: (data as any).created_at
				? new Date((data as any).created_at as string).getTime()
				: Date.now(),
			updatedAt: (data as any).updated_at
				? new Date((data as any).updated_at as string).getTime()
				: undefined,
		};
	}

	const list = await getCreatorsFromLocal(network);
	return list.find((c) => c.address.toLowerCase() === addr);
}
