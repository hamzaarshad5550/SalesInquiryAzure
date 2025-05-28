var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createClient } from "@supabase/supabase-js";
// Use project URL from Supabase.txt - hardcoded since it's not sensitive
const supabaseUrl = "https://mvmbtxwdovdubcojrwjz.supabase.co";
// Public API key from Supabase.txt - hardcoded since it's not sensitive
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bWJ0eHdkb3ZkdWJjb2pyd2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTQ1NDMsImV4cCI6MjA2MjA5MDU0M30.YXjE1qf7vDbgSzijgj-7HxxMFAXv0X6xn3PRL4WViMg";
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase configuration");
}
console.log("Connecting to Supabase at:", supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseKey);
// Server-side auth functions
export function verifyToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, error } = yield supabase.auth.getUser(token);
        if (error) {
            throw error;
        }
        return data.user;
    });
}
// Function to get user by ID
export function getUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, error } = yield supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            throw error;
        }
        return data;
    });
}
// Function to check if user exists
export function userExists(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, error } = yield supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is the error code when no rows returned
            throw error;
        }
        return !!data;
    });
}
// Example function to access RLS-protected tables
export function fetchWithRLS(table, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, error } = yield supabase
            .from(table)
            .select('*')
            .eq('user_id', userId);
        if (error) {
            throw error;
        }
        return data;
    });
}
// Function to insert data with admin privileges
export function adminInsert(table, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data: result, error } = yield supabase
            .from(table)
            .insert(data)
            .select();
        if (error) {
            throw error;
        }
        return result;
    });
}
// Function to update data with admin privileges
export function adminUpdate(table, id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data: result, error } = yield supabase
            .from(table)
            .update(data)
            .eq('id', id)
            .select();
        if (error) {
            throw error;
        }
        return result;
    });
}
// Function to delete data with admin privileges
export function adminDelete(table, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = yield supabase
            .from(table)
            .delete()
            .eq('id', id);
        if (error) {
            throw error;
        }
        return true;
    });
}
// Function to execute raw SQL (for complex queries)
export function executeRawQuery(query_1) {
    return __awaiter(this, arguments, void 0, function* (query, params = []) {
        const { data, error } = yield supabase.rpc('execute_sql', {
            query_text: query,
            params: params
        });
        if (error) {
            throw error;
        }
        return data;
    });
}
