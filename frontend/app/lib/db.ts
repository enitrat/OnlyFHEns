import { getNetwork } from "@/utils/getNetwork";
import { getSupabase } from "~/lib/supabase";

type StorageValue = string | null;

type StorageAdapter = {
	isAvailable: () => boolean;
	getItem: (key: string) => Promise<StorageValue>;
	setItem: (key: string, value: string) => Promise<void>;
	removeItem: (key: string) => Promise<void>;
	getItemSync: (key: string) => StorageValue;
};

function hasLocalStorage() {
	try {
		return typeof window !== "undefined" && !!window.localStorage;
	} catch {
		return false;
	}
}

const localStorageAdapter: StorageAdapter = {
	isAvailable: () => hasLocalStorage(),
	async getItem(key: string) {
		if (!hasLocalStorage()) return null;
		try {
			return window.localStorage.getItem(key);
		} catch {
			return null;
		}
	},
	async setItem(key: string, value: string) {
		if (!hasLocalStorage()) return;
		try {
			window.localStorage.setItem(key, value);
		} catch {
			// ignore quota or serialization errors
		}
	},
	async removeItem(key: string) {
		if (!hasLocalStorage()) return;
		try {
			window.localStorage.removeItem(key);
		} catch {
			// ignore removal errors
		}
	},
	getItemSync(key: string) {
		if (!hasLocalStorage()) return null;
		try {
			return window.localStorage.getItem(key);
		} catch {
			return null;
		}
	},
};

// Supabase-backed key/value adapter (table: kv_store)
const supabaseAdapter: StorageAdapter = {
	isAvailable: () => !!getSupabase(),
	async getItem(key: string) {
		const supabase = getSupabase();
		if (!supabase) return null;
		const { data, error } = await supabase
			.from("kv_store")
			.select("value")
			.eq("key", key)
			.maybeSingle();
		if (error) return null;
		const val = (data as any)?.value ?? null;
		// best-effort hydrate local cache for faster sync reads
		if (typeof val === "string" && hasLocalStorage()) {
			try {
				window.localStorage.setItem(key, val);
			} catch {}
		}
		return typeof val === "string" ? val : null;
	},
	async setItem(key: string, value: string) {
		const supabase = getSupabase();
		if (!supabase) return;
		await supabase
			.from("kv_store")
			.upsert([{ key, value, updated_at: new Date().toISOString() }], {
				onConflict: "key",
			});
		// keep a local cache to support getItemSync
		if (hasLocalStorage()) {
			try {
				window.localStorage.setItem(key, value);
			} catch {}
		}
	},
	async removeItem(key: string) {
		const supabase = getSupabase();
		if (!supabase) return;
		await supabase.from("kv_store").delete().eq("key", key);
		if (hasLocalStorage()) {
			try {
				window.localStorage.removeItem(key);
			} catch {}
		}
	},
	getItemSync(key: string) {
		// remote cannot be read synchronously; serve from local cache if any
		return localStorageAdapter.getItemSync(key);
	},
};

async function getAdapter(): Promise<StorageAdapter> {
	const network = await getNetwork();
	if (network === "localhost") {
		return localStorageAdapter;
	}
	return supabaseAdapter.isAvailable() ? supabaseAdapter : localStorageAdapter;
}

export const db = {
	isAvailable: () => getAdapter().then((it) => it.isAvailable()),
	getItem: (key: string) => getAdapter().then((it) => it.getItem(key)),
	setItem: (key: string, value: string) =>
		getAdapter().then((it) => it.setItem(key, value)),
	removeItem: (key: string) => getAdapter().then((it) => it.removeItem(key)),
	getItemSync: (key: string) => getAdapter().then((it) => it.getItemSync(key)),
};

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
	const raw = await db.getItem(key);
	if (!raw) return fallback;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export async function setJSON(key: string, value: unknown): Promise<void> {
	try {
		await db.setItem(key, JSON.stringify(value));
	} catch {
		// ignore serialization errors
	}
}
