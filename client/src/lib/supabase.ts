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

// Fetch all pipeline stages
export async function fetchPipelineStages() {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('"order"', { ascending: true });
  
  if (error) throw error;
  return data;
}

// Fetch all deals
export async function fetchDeals(filters = {}) {
  let query = supabase
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
export async function createDeal(dealData: Record<string, any>) {
  // Make sure we're using the correct column name 'stage' instead of 'stage'
  const { data, error } = await supabase
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
export async function updateDeal(dealId: number, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', dealId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating deal:", error);
    throw error;
  }
  return data;
}

// Move a deal to a new stage
export async function moveDealToStage(dealId: number, stageId: number) {
  return updateDeal(dealId, { stage: stageId });
}

// Fetch all campaigns
export async function fetchCampaigns(filters = {}) {
  console.log("[DEBUG] Starting fetchCampaigns with filters:", filters);
  console.log("[DEBUG] Supabase client initialized:", !!supabase);
  
  let query = supabase
    .from('campaigns')
    .select('*');
  
  // Apply any filters
  if ('status' in filters && filters.status) {
    console.log("[DEBUG] Applying status filter:", filters.status);
    query = query.eq('status', filters.status);
  }
  
  if ('ownerId' in filters && filters.ownerId) {
    console.log("[DEBUG] Applying ownerId filter:", filters.ownerId);
    query = query.eq('owner_id', filters.ownerId);
  }
  
  // Sort by updated_at by default
  console.log("[DEBUG] Executing query...");
  const { data, error } = await query.order('updated_at', { ascending: false });
  
  if (error) {
    console.error("[ERROR] Error fetching campaigns:", error);
    console.error("[ERROR] Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }

  console.log("[DEBUG] Raw campaign data from database:", data);
  console.log("[DEBUG] Number of campaigns fetched:", data?.length || 0);

  // Transform the data to match the frontend interface
  const transformedData = data?.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    status: campaign.status,
    startDate: campaign.start_date,
    endDate: campaign.end_date,
    budget: campaign.budget,
    ownerId: campaign.owner_id,
    createdAt: campaign.created_at,
    updatedAt: campaign.updated_at,
    campaign_type: campaign.campaign_type,
    target_audience: campaign.target_audience,
    products: campaign.products,
    locations: campaign.locations,
    marketing_channels: campaign.marketing_channels,
    success_metrics: campaign.success_metrics,
    media_assets: campaign.media_assets,
    compliance_notes: campaign.compliance_notes,
    approval_status: campaign.approval_status,
    approved_by: campaign.approved_by,
    approval_date: campaign.approval_date,
    actual_spend: campaign.actual_spend,
    performance_metrics: campaign.performance_metrics,
    thumbnail_url: campaign.thumbnail_url,
    tags: campaign.tags,
    rich_description: campaign.rich_description,
    audience_criteria: campaign.audience_criteria,
    status_automation: campaign.status_automation,
    last_status_update: campaign.last_status_update,
  })) || [];

  console.log("[DEBUG] Transformed campaign data:", transformedData);
  return transformedData;
}

// Create a new campaign
export async function createCampaign(campaignData: Record<string, any>) {
  // Transform the data to match the database schema
  const dbData = {
    name: campaignData.name,
    description: campaignData.description,
    status: campaignData.status || 'draft',
    start_date: campaignData.startDate,
    end_date: campaignData.endDate,
    budget: campaignData.budget,
    owner_id: campaignData.ownerId || 1, // Default to user ID 1 if not provided
    campaign_type: campaignData.campaign_type,
    target_audience: campaignData.target_audience,
    products: campaignData.products,
    locations: campaignData.locations,
    marketing_channels: campaignData.marketing_channels,
    success_metrics: campaignData.success_metrics,
    media_assets: campaignData.media_assets,
    compliance_notes: campaignData.compliance_notes,
    approval_status: campaignData.approval_status,
    approved_by: campaignData.approved_by,
    approval_date: campaignData.approval_date,
    actual_spend: campaignData.actual_spend,
    performance_metrics: campaignData.performance_metrics,
    thumbnail_url: campaignData.thumbnail_url,
    tags: campaignData.tags,
    rich_description: campaignData.rich_description,
    audience_criteria: campaignData.audience_criteria,
    status_automation: campaignData.status_automation,
    last_status_update: campaignData.last_status_update,
  };

  const { data, error } = await supabase
    .from('campaigns')
    .insert(dbData)
    .select()
    .single();
  
  if (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }

  // Transform the response to match the frontend interface
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    status: data.status,
    startDate: data.start_date,
    endDate: data.end_date,
    budget: data.budget,
    ownerId: data.owner_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// Update a campaign
export async function updateCampaign(campaignId: number, updates: Record<string, any>) {
  // Transform the data to match the database schema
  const dbUpdates = {
    name: updates.name,
    description: updates.description,
    status: updates.status,
    start_date: updates.startDate,
    end_date: updates.endDate,
    budget: updates.budget,
    campaign_type: updates.campaign_type,
    target_audience: updates.target_audience,
    products: updates.products,
    locations: updates.locations,
    marketing_channels: updates.marketing_channels,
    success_metrics: updates.success_metrics,
    media_assets: updates.media_assets,
    compliance_notes: updates.compliance_notes,
    approval_status: updates.approval_status,
    approved_by: updates.approved_by,
    approval_date: updates.approval_date,
    actual_spend: updates.actual_spend,
    performance_metrics: updates.performance_metrics,
    thumbnail_url: updates.thumbnail_url,
    tags: updates.tags,
    rich_description: updates.rich_description,
    audience_criteria: updates.audience_criteria,
    status_automation: updates.status_automation,
    last_status_update: updates.last_status_update,
  };

  const { data, error } = await supabase
    .from('campaigns')
    .update(dbUpdates)
    .eq('id', campaignId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating campaign:", error);
    throw error;
  }

  // Transform the response to match the frontend interface
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    status: data.status,
    startDate: data.start_date,
    endDate: data.end_date,
    budget: data.budget,
    ownerId: data.owner_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    campaign_type: data.campaign_type,
    target_audience: data.target_audience,
    products: data.products,
    locations: data.locations,
    marketing_channels: data.marketing_channels,
    success_metrics: data.success_metrics,
    media_assets: data.media_assets,
    compliance_notes: data.compliance_notes,
    approval_status: data.approval_status,
    approved_by: data.approved_by,
    approval_date: data.approval_date,
    actual_spend: data.actual_spend,
    performance_metrics: data.performance_metrics,
    thumbnail_url: data.thumbnail_url,
    tags: data.tags,
    rich_description: data.rich_description,
    audience_criteria: data.audience_criteria,
    status_automation: data.status_automation,
    last_status_update: data.last_status_update,
  };
}

// Delete a campaign
export async function deleteCampaign(campaignId: number) {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId);
  
  if (error) {
    console.error("Error deleting campaign:", error);
    throw error;
  }
  return true;
}
