import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export type SupabaseResponse<T> = PostgrestResponse<T>;
export type SupabaseSingleResponse<T> = PostgrestSingleResponse<T>;

export function isSuccessResponse<T>(response: SupabaseResponse<T> | SupabaseSingleResponse<T>): response is { data: T; error: null; count: number | null; status: number; statusText: string } {
  return response.error === null && response.data !== null;
}

export function isErrorResponse<T>(response: SupabaseResponse<T> | SupabaseSingleResponse<T>): response is { data: null; error: any; count: null; status: number; statusText: string } {
  return response.error !== null;
} 