import "@testing-library/jest-dom";

const env = import.meta.env as Record<string, string | undefined>;
if (!env.VITE_SUPABASE_URL) env.VITE_SUPABASE_URL = "https://example.supabase.co";
if (!env.VITE_SUPABASE_ANON_KEY) env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
