"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.signIn = signIn;
exports.signOut = signOut;
exports.signUp = signUp;
exports.getCurrentUser = getCurrentUser;
exports.isAuthenticated = isAuthenticated;
exports.fetchData = fetchData;
exports.insertData = insertData;
exports.updateData = updateData;
exports.deleteData = deleteData;
exports.uploadFile = uploadFile;
exports.getFileUrl = getFileUrl;
exports.deleteFile = deleteFile;
exports.fetchPipelineStages = fetchPipelineStages;
exports.fetchDeals = fetchDeals;
exports.createDeal = createDeal;
exports.updateDeal = updateDeal;
exports.moveDealToStage = moveDealToStage;
const supabase_js_1 = require("@supabase/supabase-js");
// Use project URL from Supabase.txt - hardcoded since it's not sensitive
const supabaseUrl = "https://mvmbtxwdovdubcojrwjz.supabase.co";
// Public API key from Supabase.txt - hardcoded since it's not sensitive
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bWJ0eHdkb3ZkdWJjb2pyd2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTQ1NDMsImV4cCI6MjA2MjA5MDU0M30.YXjE1qf7vDbgSzijgj-7HxxMFAXv0X6xn3PRL4WViMg";
console.log("Connecting to Supabase at:", supabaseUrl);
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Authentication functions
async function signIn(email, password) {
    const { data, error } = await exports.supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error)
        throw error;
    return data;
}
async function signOut() {
    const { error } = await exports.supabase.auth.signOut();
    if (error)
        throw error;
}
async function signUp(email, password, metadata) {
    const { data, error } = await exports.supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata,
        },
    });
    if (error)
        throw error;
    return data;
}
// Get the currently logged-in user
async function getCurrentUser() {
    const { data: { user }, error } = await exports.supabase.auth.getUser();
    if (error)
        throw error;
    return user;
}
// Check if user is authenticated
async function isAuthenticated() {
    const { data: { session }, error } = await exports.supabase.auth.getSession();
    if (error)
        throw error;
    return !!session;
}
// Database access functions
async function fetchData(table, query = {}) {
    let supabaseQuery = exports.supabase.from(table).select('*');
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
    if (error)
        throw error;
    return data;
}
async function insertData(table, data) {
    const { data: result, error } = await exports.supabase
        .from(table)
        .insert(data)
        .select();
    if (error)
        throw error;
    return result;
}
async function updateData(table, id, data) {
    const { data: result, error } = await exports.supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select();
    if (error)
        throw error;
    return result;
}
async function deleteData(table, id) {
    const { error } = await exports.supabase
        .from(table)
        .delete()
        .eq('id', id);
    if (error)
        throw error;
    return true;
}
// File storage functions
async function uploadFile(bucket, path, file) {
    const { data, error } = await exports.supabase.storage
        .from(bucket)
        .upload(path, file, {
        cacheControl: '3600',
        upsert: false
    });
    if (error)
        throw error;
    return data;
}
async function getFileUrl(bucket, path) {
    const { data } = await exports.supabase.storage
        .from(bucket)
        .getPublicUrl(path);
    return data.publicUrl;
}
async function deleteFile(bucket, path) {
    const { error } = await exports.supabase.storage
        .from(bucket)
        .remove([path]);
    if (error)
        throw error;
    return true;
}
// Fetch all pipeline stages
async function fetchPipelineStages() {
    const { data, error } = await exports.supabase
        .from('pipeline_stages')
        .select('*')
        .order('"order"', { ascending: true });
    if (error)
        throw error;
    return data;
}
// Fetch all deals
async function fetchDeals(filters = {}) {
    let query = exports.supabase
        .from('deals')
        .select('*');
    // Apply any filters
    if ('stageId' in filters && filters.stageId) {
        query = query.eq('stage', filters.stageId); // Using 'stage' instead of 'stage_id'
    }
    if ('ownerId' in filters && filters.ownerId) {
        query = query.eq('owner_id', filters.ownerId);
    }
    // Sort by updated_at by default
    const { data, error } = await query.order('updated_at', { ascending: false });
    if (error) {
        console.error("Error fetching deals:", error);
        throw error;
    }
    return data;
}
// Create a new deal
async function createDeal(dealData) {
    // Make sure we're using the correct column name 'stage' instead of 'stage'
    const { data, error } = await exports.supabase
        .from('deals')
        .insert(dealData)
        .select()
        .single();
    if (error) {
        console.error("Error creating deal:", error);
        throw error;
    }
    return data;
}
// Update a deal
async function updateDeal(dealId, updates) {
    const { data, error } = await exports.supabase
        .from('deals')
        .update({
        ...updates,
        updated_at: new Date().toISOString()
    })
        .eq('id', dealId)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
// Move a deal to a different stage
async function moveDealToStage(dealId, stageId) {
    // Use 'stage' instead of 'stage_id'
    return updateDeal(dealId, { stage: stageId });
}
