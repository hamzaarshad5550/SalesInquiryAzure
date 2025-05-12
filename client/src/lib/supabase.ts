import { createClient } from "@supabase/supabase-js";

// Use project URL from Supabase.txt - hardcoded since it's not sensitive
const supabaseUrl = "https://mvmbtxwdovdubcojrwjz.supabase.co";
// Public API key from Supabase.txt - hardcoded since it's not sensitive
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bWJ0eHdkb3ZkdWJjb2pyd2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTQ1NDMsImV4cCI6MjA2MjA5MDU0M30.YXjE1qf7vDbgSzijgj-7HxxMFAXv0X6xn3PRL4WViMg";

console.log("Connecting to Supabase at:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication functions
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) throw error;
  return data;
}

// Get the currently logged-in user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) throw error;
  return user;
}

// Check if user is authenticated
export async function isAuthenticated() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) throw error;
  return !!session;
}

// Database access functions
export async function fetchData(table: string, query: any = {}) {
  let supabaseQuery = supabase.from(table).select('*');
  
  // Apply filters if provided
  if (query.filters) {
    for (const [key, value] of Object.entries(query.filters)) {
      supabaseQuery = supabaseQuery.eq(key, value);
    }
  }
  
  // Apply pagination
  if (query.page && query.pageSize) {
    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;
    supabaseQuery = supabaseQuery.range(from, to);
  }
  
  // Execute query
  const { data, error } = await supabaseQuery;
  
  if (error) throw error;
  return data;
}

export async function insertData(table: string, data: any) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
}

export async function updateData(table: string, id: number, data: any) {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return result;
}

export async function deleteData(table: string, id: number) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// File storage functions
export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  return data;
}

export async function getFileUrl(bucket: string, path: string) {
  const { data } = await supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) throw error;
  return true;
}