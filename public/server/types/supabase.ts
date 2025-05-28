import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export type SupabaseResponse<T> = PostgrestResponse<T>;
export type SupabaseSingleResponse<T> = PostgrestSingleResponse<T>;

export type SuccessResponse<T> = {
  data: T;
  error: null;
  count: number | null;
  status: number;
  statusText: string;
};

export type ErrorResponse = {
  data: null;
  error: any;
  count: null;
  status: number;
  statusText: string;
};

export function isSuccessResponse<T>(response: SupabaseResponse<T> | SupabaseSingleResponse<T>): response is SuccessResponse<T> {
  return response.error === null && response.data !== null;
}

export function isErrorResponse<T>(response: SupabaseResponse<T> | SupabaseSingleResponse<T>): response is ErrorResponse {
  return response.error !== null;
}

export function isArrayResponse<T>(response: SuccessResponse<unknown>): response is SuccessResponse<T[]> {
  return Array.isArray(response.data);
}

export function getResponseData<T>(response: SupabaseResponse<T> | SupabaseSingleResponse<T>): T | null {
  if (isErrorResponse(response)) {
    throw response.error;
  }
  
  if (!isSuccessResponse(response)) {
    return null;
  }
  
  return response.data;
} 