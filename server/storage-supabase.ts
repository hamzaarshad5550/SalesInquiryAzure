import { 
  type InsertContact,
  type InsertDeal,
  type InsertTask,
  type InsertActivity
} from "@shared/schema";
import { format, formatISO, subMonths, startOfMonth, endOfMonth, subYears, startOfDay, endOfDay } from "date-fns";
import { supabase } from "./supabase";

// Helper functions for common query patterns
const handleError = (error: any, operation: string) => {
  console.error(`Error in ${operation}:`, error);
  throw new Error(`Failed to execute ${operation}`);
};

export const storage = {
  /**
   * Gets the current authenticated user (placeholder for auth)
   */
  async getCurrentUser() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', 1) // Default to first user for demo
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'getCurrentUser');
    }
  },

  /**
   * Gets all teams
   */
  async getAllTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'getAllTeams');
      return [];
    }
  },

  /**
   * Gets all users
   */
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'getAllUsers');
      return [];
    }
  },

  /**
   * Gets dashboard metrics
   */
  async getDashboardMetrics() {
    try {
      // Get deals for metrics
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*');
      
      if (dealsError) throw dealsError;
      
      // Get contacts for metrics
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*');
      
      if (contactsError) throw contactsError;
      
      // Calculate metrics manually
      const now = new Date();
      const oneMonthAgo = subMonths(now, 1);
      
      const totalDeals = deals?.length || 0;
      const pipelineValue = deals
        ?.filter(deal => new Date(deal.expected_close_date) >= now)
        .reduce((sum, deal) => sum + Number(deal.value), 0) || 0;
      const wonDeals = deals?.filter(deal => deal.stage_id === 5).length || 0;
      const wonValue = deals
        ?.filter(deal => deal.stage_id === 5)
        .reduce((sum, deal) => sum + Number(deal.value), 0) || 0;
      
      const totalContacts = contacts?.length || 0;
      const newContacts = contacts
        ?.filter(contact => new Date(contact.created_at) >= oneMonthAgo)
        .length || 0;
      
      return {
        totalDeals,
        pipelineValue,
        wonDeals,
        wonValue,
        totalContacts,
        newContacts
      };
    } catch (error) {
      handleError(error, 'getDashboardMetrics');
      // Return default metrics to prevent UI errors
      return {
        totalDeals: 0,
        pipelineValue: 0,
        wonDeals: 0,
        wonValue: 0,
        totalContacts: 0,
        newContacts: 0
      };
    }
  },

  /**
   * Gets sales performance data for charts
   */
  async getSalesPerformanceData(period: string) {
    try {
      // Get all the deals data at once to avoid multiple API calls
      const { data: allDeals, error } = await supabase
        .from('deals')
        .select('*')
        .eq('stage_id', 5); // Closed Won
      
      if (error) throw error;
      
      const now = new Date();
      let salesData = [];
      
      if (!allDeals || allDeals.length === 0) {
        // Return empty dataset with period structure for UI
        if (period === 'monthly') {
          return Array(8).fill(0).map((_, i) => ({
            name: format(subMonths(now, 7 - i), 'MMM'),
            value: 0
          }));
        } else if (period === 'quarterly') {
          return Array(4).fill(0).map((_, i) => ({
            name: `Q${i + 1}`,
            value: 0
          }));
        } else if (period === 'yearly') {
          return Array(5).fill(0).map((_, i) => ({
            name: format(subYears(now, 4 - i), 'yyyy'),
            value: 0
          }));
        }
        return [];
      }
      
      if (period === 'monthly') {
        // Get last 8 months of data
        for (let i = 7; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          
          // Filter deals closed in this month
          const monthDeals = allDeals.filter(deal => {
            const updateDate = new Date(deal.updated_at);
            return updateDate >= monthStart && updateDate <= monthEnd;
          });
          
          // Calculate total value
          const monthValue = monthDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
          
          salesData.push({
            name: format(monthDate, 'MMM'),
            value: monthValue
          });
        }
      } else if (period === 'quarterly') {
        // Get last 4 quarters
        for (let i = 3; i >= 0; i--) {
          const quarterStartMonth = i * 3;
          const startDate = subMonths(now, quarterStartMonth + 2);
          const endDate = subMonths(now, quarterStartMonth);
          
          const quarterStart = startOfMonth(startDate);
          const quarterEnd = endOfMonth(endDate);
          
          // Filter deals closed in this quarter
          const quarterDeals = allDeals.filter(deal => {
            const updateDate = new Date(deal.updated_at);
            return updateDate >= quarterStart && updateDate <= quarterEnd;
          });
          
          // Calculate total value
          const quarterValue = quarterDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
          
          salesData.push({
            name: `Q${4 - i}`,
            value: quarterValue
          });
        }
      } else if (period === 'yearly') {
        // Get last 5 years of data
        for (let i = 4; i >= 0; i--) {
          const yearDate = subYears(now, i);
          const yearStart = new Date(yearDate.getFullYear(), 0, 1);
          const yearEnd = new Date(yearDate.getFullYear(), 11, 31, 23, 59, 59);
          
          // Filter deals closed in this year
          const yearDeals = allDeals.filter(deal => {
            const updateDate = new Date(deal.updated_at);
            return updateDate >= yearStart && updateDate <= yearEnd;
          });
          
          // Calculate total value
          const yearValue = yearDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
          
          salesData.push({
            name: format(yearDate, 'yyyy'),
            value: yearValue
          });
        }
      }
      
      return salesData;
    } catch (error) {
      handleError(error, 'getSalesPerformanceData');
      // Return empty array as fallback
      return [];
    }
  },

  /**
   * Gets pipeline overview data for dashboard
   */
  async getPipelineOverview() {
    try {
      // Get all pipeline stages
      const { data: stages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('order', { ascending: true });
      
      if (stagesError) throw stagesError;
      
      // Get all deals
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*, owner:users!owner_id(*)');
      
      if (dealsError) throw dealsError;
      
      // Process and format the data similar to what Drizzle provides
      const result = stages?.map(stage => {
        // Find deals for this stage
        const stageDeals = deals
          ?.filter(deal => deal.stage_id === stage.id)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5); // Limit to 5 deals
          
        return {
          ...stage,
          deals: stageDeals || []
        };
      }) || [];
      
      return result;
    } catch (error) {
      handleError(error, 'getPipelineOverview');
      return [];
    }
  },

  /**
   * Gets full pipeline with filtering options
   */
  async getPipeline(filterUserId?: number, sortBy: string = 'updated') {
    try {
      // Get all pipeline stages
      const { data: stages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('order', { ascending: true });
      
      if (stagesError) throw stagesError;
      
      // Get deals with filter if provided
      let dealsQuery = supabase
        .from('deals')
        .select('*, contact:contacts!contact_id(*), owner:users!owner_id(*)');
      
      if (filterUserId) {
        dealsQuery = dealsQuery.eq('owner_id', filterUserId);
      }
      
      const { data: deals, error: dealsError } = await dealsQuery;
      
      if (dealsError) throw dealsError;
      
      // Sort deals based on sortBy parameter
      const sortedDeals = deals?.sort((a, b) => {
        if (sortBy === 'value') {
          return Number(b.value) - Number(a.value);
        } else if (sortBy === 'closing') {
          return new Date(a.expected_close_date || '2099-12-31').getTime() - 
                 new Date(b.expected_close_date || '2099-12-31').getTime();
        } else {
          // Default to 'updated'
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
      });
      
      // Process and format the data similar to what Drizzle provides
      const result = stages?.map(stage => {
        // Find deals for this stage
        const stageDeals = sortedDeals?.filter(deal => deal.stage_id === stage.id) || [];
          
        return {
          ...stage,
          deals: stageDeals
        };
      }) || [];
      
      return result;
    } catch (error) {
      handleError(error, 'getPipeline');
      return [];
    }
  },

  /**
   * Gets today's tasks for the current user
   */
  async getTodaysTasks() {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      // Note: Since we can't use complex date filtering with Supabase REST API,
      // we'll fetch all tasks and filter client-side
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*, assignedUser:users!assigned_to(*)')
        .eq('assigned_to', 1); // Default to first user for demo
      
      if (error) throw error;
      
      // Filter for today's tasks
      const todaysTasks = tasks?.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        return taskDate >= startOfToday && taskDate <= endOfToday;
      }) || [];
      
      return todaysTasks;
    } catch (error) {
      handleError(error, 'getTodaysTasks');
      return [];
    }
  },

  /**
   * Toggles a task's completion status
   */
  async toggleTaskCompletion(taskId: number) {
    try {
      // First get the current task
      const { data: task, error: getError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (getError) throw getError;
      
      // Toggle the completion status
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return updatedTask;
    } catch (error) {
      handleError(error, 'toggleTaskCompletion');
      return null;
    }
  },

  /**
   * Gets recent contacts (last added or updated)
   */
  async getRecentContacts() {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*, assignedUser:users!assigned_to(*)')
        .order('updated_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return contacts || [];
    } catch (error) {
      handleError(error, 'getRecentContacts');
      return [];
    }
  },

  /**
   * Gets all contacts with optional search
   */
  async getContacts(search?: string) {
    try {
      let query = supabase
        .from('contacts')
        .select('*, assignedUser:users!assigned_to(*)');
      
      if (search) {
        // Note: This is a basic implementation of search
        // Supabase doesn't support full text search as easily as SQL,
        // so we're using a contains filter on the name field
        query = query.ilike('name', `%${search}%`);
      }
      
      const { data: contacts, error } = await query.order('name', { ascending: true });
      
      if (error) throw error;
      
      return contacts || [];
    } catch (error) {
      handleError(error, 'getContacts');
      return [];
    }
  },

  /**
   * Gets recent activities
   */
  async getRecentActivities() {
    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*, user:users!user_id(*)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      return activities || [];
    } catch (error) {
      handleError(error, 'getRecentActivities');
      return [];
    }
  },

  /**
   * Gets a single contact by ID
   */
  async getContactById(contactId: number) {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*, assignedUser:users!assigned_to(*)')
        .eq('id', contactId)
        .single();
      
      if (error) throw error;
      
      // Get deals for this contact
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*, stage:pipeline_stages!stage_id(*), owner:users!owner_id(*)')
        .eq('contact_id', contactId)
        .order('updated_at', { ascending: false });
      
      if (dealsError) throw dealsError;
      
      // Get activities for this contact
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*, user:users!user_id(*)')
        .eq('related_to_type', 'contact')
        .eq('related_to_id', contactId)
        .order('created_at', { ascending: false });
      
      if (activitiesError) throw activitiesError;
      
      // Get tasks for this contact
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*, assignedUser:users!assigned_to(*)')
        .eq('related_to_type', 'contact')
        .eq('related_to_id', contactId)
        .order('due_date', { ascending: true });
      
      if (tasksError) throw tasksError;
      
      return {
        ...contact,
        deals: deals || [],
        activities: activities || [],
        tasks: tasks || []
      };
    } catch (error) {
      handleError(error, 'getContactById');
      return null;
    }
  },

  /**
   * Creates a new contact
   */
  async createContact(contactData: InsertContact) {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          ...contactData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return contact;
    } catch (error) {
      handleError(error, 'createContact');
      return null;
    }
  },

  /**
   * Updates an existing contact
   */
  async updateContact(contactId: number, contactData: Partial<InsertContact>) {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .update({
          ...contactData,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId)
        .select()
        .single();
      
      if (error) throw error;
      
      return contact;
    } catch (error) {
      handleError(error, 'updateContact');
      return null;
    }
  },

  /**
   * Deletes a contact
   */
  async deleteContact(contactId: number) {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      handleError(error, 'deleteContact');
      return false;
    }
  },

  /**
   * Creates a new deal
   */
  async createDeal(dealData: InsertDeal) {
    try {
      const { data: deal, error } = await supabase
        .from('deals')
        .insert({
          ...dealData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return deal;
    } catch (error) {
      handleError(error, 'createDeal');
      return null;
    }
  },

  /**
   * Updates a deal's stage
   */
  async updateDealStage(dealId: number, stageId: number) {
    try {
      const { data: deal, error } = await supabase
        .from('deals')
        .update({
          stage_id: stageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId)
        .select()
        .single();
      
      if (error) throw error;
      
      return deal;
    } catch (error) {
      handleError(error, 'updateDealStage');
      return null;
    }
  },

  /**
   * Creates a new task
   */
  async createTask(taskData: InsertTask) {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return task;
    } catch (error) {
      handleError(error, 'createTask');
      return null;
    }
  },

  /**
   * Creates a new activity
   */
  async createActivity(activityData: InsertActivity) {
    try {
      const { data: activity, error } = await supabase
        .from('activities')
        .insert({
          ...activityData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return activity;
    } catch (error) {
      handleError(error, 'createActivity');
      return null;
    }
  }
};