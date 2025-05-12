import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Server-side auth functions
export async function verifyToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error) {
    throw error;
  }
  
  return data.user;
}

// Function to get user by ID
export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

// Function to check if user exists
export async function userExists(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is the error code when no rows returned
    throw error;
  }
  
  return !!data;
}

// Example function to access RLS-protected tables
export async function fetchWithRLS(table: string, userId: string) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    throw error;
  }
  
  return data;
}

// Function to insert data with admin privileges
export async function adminInsert(table: string, data: any) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select();
    
  if (error) {
    throw error;
  }
  
  return result;
}

// Function to update data with admin privileges
export async function adminUpdate(table: string, id: number, data: any) {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select();
    
  if (error) {
    throw error;
  }
  
  return result;
}

// Function to delete data with admin privileges
export async function adminDelete(table: string, id: number) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
    
  if (error) {
    throw error;
  }
  
  return true;
}

// Function to execute raw SQL (for complex queries)
export async function executeRawQuery(query: string, params: any[] = []) {
  const { data, error } = await supabase.rpc('execute_sql', {
    query_text: query,
    params: params
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}