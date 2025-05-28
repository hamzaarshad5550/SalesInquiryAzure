import { createClient } from "@supabase/supabase-js";

// Use project URL from Supabase.txt - hardcoded since it's not sensitive
const supabaseUrl = "https://mvmbtxwdovdubcojrwjz.supabase.co";
// Public API key from Supabase.txt - hardcoded since it's not sensitive
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bWJ0eHdkb3ZkdWJjb2pyd2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTQ1NDMsImV4cCI6MjA2MjA5MDU0M30.YXjE1qf7vDbgSzijgj-7HxxMFAXv0X6xn3PRL4WViMg";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase configuration");
}

console.log("Connecting to Supabase at:", supabaseUrl);

// Create Supabase client with additional options for Azure
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'sales-inquiry-app-azure'
    },
  },
  realtime: {
    timeout: 60000
  }
});

// Server-side auth functions
export async function verifyToken(token) {
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error) {
    console.error("Auth error:", error);
    throw error;
  }
  
  return data.user;
}

// Function to get user by ID with error logging
export async function getUserById(id) {
  console.log("Getting user by ID:", id);
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Supabase error getting user:", error);
      throw error;
    }
    
    console.log("User data retrieved:", data ? "success" : "not found");
    return data;
  } catch (err) {
    console.error("Exception in getUserById:", err);
    throw err;
  }
}

// Test function to verify Supabase connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error("Supabase connection test failed:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error("Exception in testSupabaseConnection:", err);
    return { success: false, error: err.message };
  }
}