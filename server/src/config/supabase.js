import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured) {
    console.warn('⚠️  SUPABASE_URL or SUPABASE_ANON_KEY not set. Auth will not work.');
}

/**
 * Shared Supabase client instance
 * Used for auth operations (signup, login, token verification)
 * 
 * Uses placeholder values when not configured so the app can still boot.
 * Auth endpoints will fail gracefully with clear error messages.
 */
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export const isSupabaseConfigured = isConfigured;
