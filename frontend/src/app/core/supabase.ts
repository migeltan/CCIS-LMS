import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from './models/database.types';

export const supabase = createClient<Database>(
  environment.supabaseUrl,
  environment.supabaseAnonKey,
);

/** Turns a Supabase response into data, or throws a normal Error with the message. */
export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}