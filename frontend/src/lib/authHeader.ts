import { supabase } from './supabaseClient';

/**
 * Retrieves the current user's Supabase access token and returns an Authorization header object.
 * Returns { Authorization: 'Bearer <token>' } or empty header object if no active session exists.
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch (err) {
    console.warn('Error reading Supabase session token for auth header:', err);
  }
  return {};
}
