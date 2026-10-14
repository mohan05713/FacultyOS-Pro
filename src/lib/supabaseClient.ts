import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Default to the user's specific Supabase project URL
export const DEFAULT_SUPABASE_URL = 'https://rqxaagvluakuoykuyswa.supabase.co';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  try {
    const stored = localStorage.getItem('facultyos_supabase_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        url: parsed.url || envUrl || DEFAULT_SUPABASE_URL,
        anonKey: (parsed.anonKey && parsed.anonKey !== 'MY_SUPABASE_ANON_KEY' && parsed.anonKey.trim() !== '') ? parsed.anonKey : envKey,
      };
    }
  } catch (e) {
    console.error('Error reading stored Supabase config:', e);
  }
  return {
    url: envUrl || DEFAULT_SUPABASE_URL,
    anonKey: envKey,
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(
    'facultyos_supabase_config',
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
  // Reset cached client
  cachedClient = null;
  lastUrl = '';
  lastKey = '';
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey || url === 'MY_SUPABASE_URL' || anonKey === 'MY_SUPABASE_ANON_KEY') {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    return null;
  }
}

export interface SupabaseVerificationResult {
  isConfigured: boolean;
  isConnected: boolean;
  projectUrl: string;
  hasAnonKey: boolean;
  authUser: User | null;
  queriedTables: {
    name: string;
    accessible: boolean;
    rowCount?: number;
    error?: string;
  }[];
  errorMessage?: string;
}

export async function verifySupabaseConnection(): Promise<SupabaseVerificationResult> {
  const { url, anonKey } = getStoredSupabaseConfig();
  const result: SupabaseVerificationResult = {
    isConfigured: Boolean(url && anonKey),
    isConnected: false,
    projectUrl: url || DEFAULT_SUPABASE_URL,
    hasAnonKey: Boolean(anonKey && anonKey !== 'MY_SUPABASE_ANON_KEY'),
    authUser: null,
    queriedTables: [],
  };

  if (!result.hasAnonKey) {
    result.errorMessage =
      'Supabase Anon / Public API Key is missing. Please configure your public key to connect to your live project.';
    return result;
  }

  const client = getSupabaseClient();
  if (!client) {
    result.errorMessage = 'Failed to create Supabase client instance.';
    return result;
  }

  // 1. Check active Supabase Auth session
  try {
    const { data: authData, error: authErr } = await client.auth.getUser();
    if (authErr) {
      console.warn('Supabase auth.getUser() notice:', authErr.message);
      result.authUser = null;
    } else {
      result.authUser = authData.user || null;
    }
  } catch (err: any) {
    console.warn('Auth session check notice:', err.message);
  }

  // 2. Test core existing tables using active session
  const tablesToTest = [
    'faculty_profiles',
    'timetable_entries',
    'subjects',
    'departments',
    'students',
    'college_class_groups',
  ];

  let anyTableSuccess = false;

  for (const tableName of tablesToTest) {
    try {
      let query = client.from(tableName).select('*', { count: 'exact', head: false });

      // If testing faculty_profiles and user is authenticated, check auth_user_id
      if (tableName === 'faculty_profiles' && result.authUser) {
        query = query.eq('auth_user_id', result.authUser.id);
      }

      const { data, error, count } = await query.limit(5);

      if (error) {
        result.queriedTables.push({
          name: tableName,
          accessible: false,
          error: `${error.code ? `[${error.code}] ` : ''}${error.message}`,
        });
      } else {
        anyTableSuccess = true;
        result.queriedTables.push({
          name: tableName,
          accessible: true,
          rowCount: count ?? data?.length ?? 0,
        });
      }
    } catch (err: any) {
      result.queriedTables.push({
        name: tableName,
        accessible: false,
        error: err.message || 'Unknown network error',
      });
    }
  }

  result.isConnected = anyTableSuccess;
  if (!anyTableSuccess && result.queriedTables.length > 0) {
    const denied = result.queriedTables.find((t) => t.error?.includes('permission denied') || t.error?.includes('42501'));
    if (denied) {
      result.errorMessage = `Permission denied on table '${denied.name}'. The 'authenticated' or 'anon' role is missing table SELECT privileges in PostgreSQL. Run migration 003 in Supabase SQL Editor.`;
    } else {
      result.errorMessage = result.queriedTables[0].error || 'Could not query Supabase tables.';
    }
  }

  return result;
}
