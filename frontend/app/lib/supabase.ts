import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
	if (cached) return cached;

	const url = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string | undefined;
	const anonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as
		| string
		| undefined;

	if (!url || !anonKey) {
		return null;
	}

	cached = createClient(url, anonKey, {
		auth: { persistSession: false },
	});
	return cached;
}
