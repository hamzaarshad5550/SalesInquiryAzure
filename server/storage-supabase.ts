import { 
  type InsertContact,
  type InsertDeal,
  type InsertTask,
  type InsertActivity,
  type PipelineStage,
  type Deal,
  type Contact,
  type Activity,
  type User, // Assuming User type is in shared schema or needs definition
  type Task // Assuming Task type is in shared schema
} from "@shared/schema";
import { format, subMonths, startOfMonth, endOfMonth, subYears, startOfDay, endOfDay } from "date-fns";
import { supabase } from "./supabase";

// Define interfaces for data types if not fully defined in @shared/schema
// (Ensure these match your database schema and the types used in the rest of the application)
// Example: If User and Task are not fully defined in @shared/schema, define them here:
// interface User { /* ... */ }
// interface Task { /* ... */ }

// Helper function to handle Supabase errors consistently
const handleError = (error: any, operation: string) => {
  console.error(`Error in ${operation}:`, error);

  // Log more details if it's a Supabase error
  if (error.code && error.message) {
    console.error(`Supabase error (${error.code}): ${error.message}`);
    if (error.details) console.error(`Details: ${error.details}`);
    if (error.hint) console.error(`Hint: ${error.hint}`);
  }

  // Throw a new error to be caught by the route handler
  throw new Error(`Failed to execute ${operation}: ${error.message || error}`);
};

export const storage = {
  /**
   * Gets the current authenticated user (placeholder for auth)
   */
  async getCurrentUser(): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', 1) // Default to first user for demo if no auth
        .single();

      if (error) throw error;
      // Assuming the data structure matches the User type
      return data as User;
    } catch (error) {
      // Return a default user and log the error, instead of re-throwing
      console.error("Error fetching current user, returning default:", error);
      // Fallback for development if users table is empty or user 1 doesn't exist
      return { id: 1, name: "Default User" } as User;
    }
  },

  /**
   * Gets all teams
   */
  async getAllTeams(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'getAllTeams');
      return []; // Return empty array on error
    }
  },

  /**
   * Gets all users
   */
  async getUsers(): Promise<User[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        console.error("Error fetching users:", error);
        // Return a default user for development if fetching users fails
        return [{ id: 1, name: "Default User" }] as User[];
      }

      if (!users || users.length === 0) {
        console.log("No users found, returning default user");
        // Return a default user if no users are found
        return [{ id: 1, name: "Default User" }] as User[];
      }

      // Format users to ensure they have a name property and match the User type
      const formattedUsers: User[] = users.map((user: any) => ({
        id: user.id,
        username: user.username || `user${user.id}`,
        password: user.password || '',
        name: user.name || user.full_name || user.username || `User ${user.id}`,
        full_name: user.full_name || user.name || user.username || `User ${user.id}`,
        email: user.email || '',
        avatarUrl: user.avatar_url || null,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
      }));

      return formattedUsers;
    } catch (error) {
      handleError(error, 'getUsers');
      // Return default user(s) in case of any error during fetching/formatting
      return [{ id: 1, name: "Default User" }] as User[];
    }
  },

  /**
   * Gets dashboard metrics
   */
  async getDashboardMetrics(): Promise<{
    totalDeals: number;
    pipelineValue: number;
    wonDeals: number;
    wonValue: number;
    totalContacts: number;
    newContacts: number;
  }> {
    try {
      // Fetch all deals and contacts in parallel
      const [{ data: deals, error: dealsError }, { data: contacts, error: contactsError }] = await Promise.all([
        supabase.from('deals').select('*'),
        supabase.from('contacts').select('*'),
      ]);

      if (dealsError) throw dealsError;
      if (contactsError) throw contactsError;

      const now = new Date();
      const oneMonthAgo = subMonths(now, 1);

      const totalDeals = deals?.length || 0;
      const pipelineValue = deals
        ?.filter((deal: Deal) => deal.expectedCloseDate ? new Date(deal.expectedCloseDate) >= now : false)
        .reduce((sum: number, deal: Deal) => sum + Number(deal.value), 0) || 0;

      // Assuming stage 5 is 'Closed Won'
      const wonDeals = deals?.filter((deal: Deal) => deal.stageId === 5).length || 0; // Added type annotation
      const wonValue = deals
        ?.filter((deal: Deal) => deal.stageId === 5) // Added type annotation
        .reduce((sum: number, deal: Deal) => sum + Number(deal.value), 0) || 0; // Added type annotation

      const totalContacts = contacts?.length || 0;
      const newContacts = contacts
        ?.filter((contact: Contact) => new Date(contact.createdAt) >= oneMonthAgo)
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
   * Gets sales performance data for charts (stub implementation)
   * @param period - e.g., 'monthly', 'yearly'
   */
  async getSalesPerformanceData(period: string): Promise<any[]> {
    console.log(`Fetching sales performance data for period: ${period}`);
    // This is a stub and should be replaced with actual data aggregation logic
    // based on deals and their closed dates/values.
    // For now, returning sample data or empty array.
    return [
       { name: 'Jan', current: 5000, previous: 4200 },
       { name: 'Feb', current: 7800, previous: 6800 },
       { name: 'Mar', current: 4900, previous: 5100 },
       { name: 'Apr', current: 9000, previous: 7200 },
       { name: 'May', current: 8100, previous: 7000 },
       { name: 'Jun', current: 10500, previous: 8300 }
     ];
  },

  /**
   * Gets a simplified overview of the pipeline stages (stub)
   */
  async getPipelineOverview(): Promise<any[]> {
     console.log("Fetching pipeline overview (stub)");
     // This is a stub and should return aggregated data per pipeline stage.
     return [];
  },

  /**
   * Gets the full pipeline with deals nested under stages.
   * @param filterUserId - Optional user ID to filter deals.
   * @param sortBy - Optional sorting criteria (e.g., 'updated', 'created').
   */
  async getPipeline(filterUserId?: number, sortBy: string = 'updated'): Promise<PipelineStage[]> {
     try {
       // Fetch pipeline stages and deals in parallel
       const [{ data: stagesData, error: stagesError }, { data: dealsData, error: dealsError }] = await Promise.all([
         supabase.from('pipeline_stages').select('*').order('order'),
         supabase.from('deals').select(`
           *,
           contact:contacts(*),
           assigned_to:users(id, name)
         `)
       ]);

       if (stagesError) throw stagesError;

       if (dealsError) throw dealsError;

       const stages = stagesData as PipelineStage[] || [];
       let deals = dealsData as Deal[] || [];

       // Apply user filter if specified
       if (filterUserId !== undefined) {
          deals = deals.filter(deal => deal.ownerId === filterUserId);
       }

       // Sort deals (basic implementation)
       deals.sort((a, b) => {
         const dateA = new Date(sortBy === 'created' ? a.createdAt : a.updatedAt).getTime();
         const dateB = new Date(sortBy === 'created' ? b.createdAt : b.updatedAt).getTime();
         return dateB - dateA; // Descending order
       });

       // Group deals by stage
       const stagesWithDeals: PipelineStage[] = stages.map(stage => {
          const stageDeals = deals.filter(deal => deal.stageId === stage.id);

         return {
           ...stage,
           deals: stageDeals || []
         };
       });

       return stagesWithDeals;

     } catch (error) {
       handleError(error, 'getPipeline');
       // Return default stages in case of error to prevent UI breakdown
       return [
         { id: 1, name: "Lead", color: "#6366F1", order: 1, createdAt: new Date(), updatedAt: new Date() },
         { id: 2, name: "Qualified", color: "#8B5CF6", order: 2, createdAt: new Date(), updatedAt: new Date() },
         { id: 3, name: "Proposal", color: "#EC4899", order: 3, createdAt: new Date(), updatedAt: new Date() },
         { id: 4, name: "Negotiation", color: "#F59E0B", order: 4, createdAt: new Date(), updatedAt: new Date() },
         { id: 5, name: "Closed Won", color: "#10B981", order: 5, createdAt: new Date(), updatedAt: new Date() }
      ];
     }
  },

  /**
   * Gets tasks due today.
   */
   async getTodaysTasks(): Promise<Task[]> {
     try {
       const start = format(startOfDay(new Date()), 'yyyy-MM-dd HH:mm:ss');
       const end = format(endOfDay(new Date()), 'yyyy-MM-dd HH:mm:ss');

       const { data: tasks, error } = await supabase
         .from('tasks')
         .select(`
           *,
           assigned_to:users(id, name) // Fetch assigned user details
         `)
         .gte('due_date', start)
         .lte('due_date', end);

       if (error) throw error;

       // Format tasks and ensure assigned_to is a User object or null
       const formattedTasks: Task[] = tasks.map((task: any) => ({
         ...task,
         assigned_to: task.assigned_to ? { id: task.assigned_to.id, name: task.assigned_to.name } as User : null,
         completed: task.is_completed // Assuming 'completed' maps to 'is_completed' in DB
       }));

       return formattedTasks;
     } catch (error) {
       handleError(error, 'getTodaysTasks');
       return []; // Return empty array on error
     }
   },

   /**
    * Toggles the completion status of a task.
    * @param taskId - The ID of the task to toggle.
    */
   async toggleTaskCompletion(taskId: number): Promise<Task | null> {
     try {
       // First, get the current state of the task
       const { data: currentTask, error: fetchError } = await supabase
         .from('tasks')
         .select('id, is_completed')
         .eq('id', taskId)
         .single();

       if (fetchError) throw fetchError;
       if (!currentTask) return null; // Task not found

       // Toggle the completion status
       const newCompletionStatus = !currentTask.is_completed;

       // Update the task
       const { data: updatedTask, error: updateError } = await supabase
         .from('tasks')
         .update({ is_completed: newCompletionStatus })
         .eq('id', taskId)
         .select('*') // Select all columns to return the updated task
         .single();

       if (updateError) throw updateError;

       // Re-fetch with user details if needed, or assume update returns full object with user
        // For simplicity, returning the basic updated task. Re-fetch in frontend if user details are needed immediately.
        return updatedTask as Task; // Cast to Task (may need adjustment based on select('*') return)

     } catch (error) {
       handleError(error, `toggleTaskCompletion ${taskId}`);
       throw error; // Re-throw the error to be handled by the route handler
     }
   },

   /**
    * Gets recent contacts (stub).
    */
   async getRecentContacts(): Promise<Contact[]> {
     console.log("Fetching recent contacts (stub)");
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10); // Limit to 10 recent contacts

        if (error) throw error;
        return data as Contact[] || [];
      } catch (error) {
        handleError(error, 'getRecentContacts');
        return [];
      }
   },

   /**
    * Gets contacts with optional search filter.
    * @param search - Optional search term for contact name or email.
    */
   async getContacts(search?: string): Promise<Contact[]> {
    try {
      let query = supabase
        .from('contacts')
        .select(`
          *,
          assigned_to:users(id, name) // Fetch assigned user details
        `);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: contacts, error } = await query.order('name', { ascending: true });

      if (error) throw error;

      // Format contacts and ensure assigned_to is a User object or null
      const formattedContacts: Contact[] = contacts.map((contact: any) => ({
        ...contact,
        assignedUser: contact.assigned_to ? { id: contact.assigned_to.id, name: contact.assigned_to.name } as User : null,
        assigned_to: contact.assigned_to?.id || null // Keep the ID field as well
      }));

      return formattedContacts;
    } catch (error) {
      handleError(error, 'getContacts');
      throw error; // Re-throw the error
    }
  },

  /**
   * Gets recent activities (stub).
   */
  async getRecentActivities(): Promise<Activity[]> {
    console.log("Fetching recent activities (stub)");
     try {
       const { data, error } = await supabase
         .from('activities')
         .select('*')
         .order('scheduled_at', { ascending: false })
         .limit(10);

       if (error) throw error;
       return data as Activity[] || [];
     } catch (error) {
       handleError(error, 'getRecentActivities');
       return [];
     }
  },

  /**
   * Gets a single contact by ID.
   * @param contactId - The ID of the contact to fetch.
   */
  async getContactById(contactId: number): Promise<Contact | null> {
     try {
       const { data: contact, error } = await supabase
         .from('contacts')
         .select(
           `*,
           assigned_to:users(id, name)` // Fetch assigned user details
         )
         .eq('id', contactId)
         .single();

       if (error) throw error;
       if (!contact) return null;

       // Format contact to include assignedUser
       const formattedContact: Contact = {
         ...(contact as any),
         assignedUser: contact.assigned_to ? { id: contact.assigned_to.id, name: contact.assigned_to.name } as User : null,
         assigned_to: contact.assigned_to?.id || null // Keep the ID field as well
       };

       return formattedContact;
     } catch (error) {
       handleError(error, `getContactById ${contactId}`);
       throw error; // Re-throw the error
     }
   },

  /**
   * Creates a new contact.
   * @param contactData - The data for the new contact.
   */
  async createContact(contactData: InsertContact): Promise<Contact> {
     try {
       const { data, error } = await supabase
         .from('contacts')
         .insert(contactData)
         .select()
         .single(); // Assuming insert returns the new row

       if (error) throw error;
       // Assuming the data structure matches the Contact type
       return data as Contact;
     } catch (error) {
       handleError(error, 'createContact');
        throw error; // Re-throw the error
     }
   },

  /**
   * Updates an existing contact.
   * @param contactId - The ID of the contact to update.
   * @param contactData - The data to update.
   */
   async updateContact(contactId: number, contactData: Partial<InsertContact>): Promise<Contact | null> {
     try {
       const { data, error } = await supabase
         .from('contacts')
         .update(contactData)
         .eq('id', contactId)
         .select()
         .single(); // Assuming update returns the updated row

       if (error) throw error;
       // Assuming the data structure matches the Contact type
       return data as Contact;
     } catch (error) {
       handleError(error, `updateContact ${contactId}`);
        throw error; // Re-throw the error
     }
   },

  /**
   * Deletes a contact by ID.
   * @param contactId - The ID of the contact to delete.
   */
   async deleteContact(contactId: number): Promise<void> {
     try {
       const { error } = await supabase
         .from('contacts')
         .delete()
         .eq('id', contactId);

       if (error) throw error;
     } catch (error) {
       handleError(error, `deleteContact ${contactId}`);
        throw error; // Re-throw the error
     }
   },

   /**
    * Creates a new deal.
    * @param dealData - The data for the new deal.
    */
   async createDeal(dealData: InsertDeal): Promise<Deal> {
     try {
       const { data, error } = await supabase
         .from('deals')
         .insert(dealData)
         .select()
         .single(); // Assuming insert returns the new row

       if (error) throw error;
       // Assuming the data structure matches the Deal type
       return data as Deal;
     } catch (error) {
       handleError(error, 'createDeal');
        throw error; // Re-throw the error
     }
   },

   /**
    * Updates the stage of a deal.
    * @param dealId - The ID of the deal to update.
    * @param stageId - The new stage ID.
    */
   async updateDealStage(dealId: number, stageId: number): Promise<Deal | null> {
     try {
       const { data, error } = await supabase
         .from('deals')
         .update({ stageId: stageId })
         .eq('id', dealId)
         .select()
         .single(); // Assuming update returns the updated row

       if (error) throw error;
       // Assuming the data structure matches the Deal type
       return data as Deal;
     } catch (error) {
       handleError(error, `updateDealStage ${dealId}`);
        throw error; // Re-throw the error
     }
   },

  /**
   * Creates a new task.
   * @param taskData - The data for the new task.
   */
  async createTask(taskData: InsertTask): Promise<Task> {
     try {
       // Map InsertTask to the actual database columns, if necessary
       // Assuming InsertTask directly maps to task table columns, including is_completed

       const { data, error } = await supabase
         .from('tasks')
         .insert(taskData)
         .select()
         .single(); // Assuming insert returns the new row

       if (error) throw error;
        // Assuming the data structure matches the Task type after inserting and selecting
       return data as Task;
     } catch (error) {
       handleError(error, 'createTask');
        throw error; // Re-throw the error
     }
   },

  /**
   * Updates an existing task.
   * @param taskId - The ID of the task to update.
   * @param taskData - The data to update.
   */
   async updateTask(taskId: number, taskData: Partial<InsertTask>): Promise<Task | null> {
     try {
       // Map Partial<InsertTask> to the actual database columns if necessary
       // Assuming Partial<InsertTask> directly maps to task table columns

       const { data, error } = await supabase
         .from('tasks')
         .update(taskData)
         .eq('id', taskId)
         .select()
         .single(); // Assuming update returns the updated row

       if (error) throw error;
        // Assuming the data structure matches the Task type after updating and selecting
       return data as Task;
     } catch (error) {
       handleError(error, `updateTask ${taskId}`);
        throw error; // Re-throw the error
     }
   },

   /**
    * Gets a single task by ID.
    * @param taskId - The ID of the task to fetch.
    */
   async getTaskById(taskId: number): Promise<Task | null> {
     try {
       const { data: task, error } = await supabase
         .from('tasks')
         .select(
           `*,
           assigned_to:users(id, name)` // Fetch assigned user details
         )
         .eq('id', taskId)
         .single();

       if (error) throw error;
       if (!task) return null;

       // Format task to include assignedUser and map is_completed
       const formattedTask: Task = {
         ...(task as any),
         assigned_to: task.assigned_to?.id || null, // Keep the ID field
         assignedUser: task.assigned_to ? { id: task.assigned_to.id, name: task.assigned_to.name } as User : null,
         completed: task.is_completed // Map is_completed to completed
       };

       return formattedTask;
     } catch (error) {
       handleError(error, `getTaskById ${taskId}`);
       throw error; // Re-throw the error
     }
   },

   /**
    * Gets tasks with optional filters.
    * @param options - Filtering options (search, priority, assignedTo, isActive).
    */
   async getTasks(options?: { search?: string; priority?: string; assignedTo?: number; isActive?: boolean }): Promise<Task[]> {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:users(id, name) // Fetch assigned user details
        `);

      // Apply filters if provided
      if (options?.search) {
        query = query.ilike('description', `\%${options.search}\%`);
      }
      if (options?.priority) {
        query = query.eq('priority', options.priority);
      }
      if (options?.assignedTo !== undefined) {
        query = query.eq('assigned_to', options.assignedTo);
      }
       if (options?.isActive !== undefined) {
         // Assuming isActive true means not completed (is_completed = false)
         query = query.eq('is_completed', !options.isActive);
       }

      const { data: tasks, error } = await query.order('due_date', { ascending: true });

      if (error) throw error;

      // Format tasks to include assignedUser and map is_completed
      const formattedTasks: Task[] = tasks.map((task: any) => ({
        ...task,
        assigned_to: task.assigned_to?.id || null, // Keep the ID field
        assignedUser: task.assigned_to ? { id: task.assigned_to.id, name: task.assigned_to.name } as User : null,
        completed: task.is_completed // Map is_completed to completed
      }));

      return formattedTasks;
    } catch (error) {
      handleError(error, 'getTasks');
      throw error; // Re-throw the error
    }
  },

   /**
    * Deletes a task by ID.
    * @param taskId - The ID of the task to delete.
    */
   async deleteTask(taskId: number): Promise<void> {
     try {
       const { error } = await supabase
         .from('tasks')
         .delete()
         .eq('id', taskId);

       if (error) throw error;
     } catch (error) {
       handleError(error, `deleteTask ${taskId}`);
        throw error; // Re-throw the error
     }
   },

   /**
    * Sets the active status of a task (maps to is_completed = !isActive).
    * @param taskId - The ID of the task to update.
    * @param isActive - The desired active status.
    */
   async setTaskActiveStatus(taskId: number, isActive: boolean): Promise<Task | null> {
     try {
       const { data, error } = await supabase
         .from('tasks')
         .update({ is_completed: !isActive })
         .eq('id', taskId)
         .select()
         .single(); // Assuming update returns the updated row

       if (error) throw error;
        // Assuming the data structure matches the Task type after updating and selecting
       return data as Task;
     } catch (error) {
       handleError(error, `setTaskActiveStatus ${taskId}`);
        throw error; // Re-throw the error
     }
   },

   // Campaign functions (add placeholders or basic implementations)
   /**
    * Fetches campaigns with optional filters.
    * @param filters - Optional filters (e.g., ownerId).
    */
   async fetchCampaigns(filters?: { ownerId?: number }): Promise<any[]> {
     try {
       let query = supabase
         .from('campaigns')
         .select('*'); // Select all columns for now

       if (filters?.ownerId) {
         query = query.eq('owner_id', filters.ownerId); // Assuming ownerId column name
       }

       const { data, error } = await query;

       if (error) throw error;
       return data || [];
     } catch (error) {
       handleError(error, 'fetchCampaigns');
       return [];
     }
   },

   /**
    * Fetches a single campaign by ID.
    * @param campaignId - The ID of the campaign to fetch.
    */
   async fetchCampaignById(campaignId: number): Promise<any | null> {
     try {
       const { data, error } = await supabase
         .from('campaigns')
         .select('*') // Select all columns for now
         .eq('id', campaignId)
         .single();

       if (error) throw error;
       return data;
     } catch (error) {
       handleError(error, `fetchCampaignById ${campaignId}`);
       return null; // Return null if campaign not found or error occurs
     }
   },

   /**
    * Creates a new campaign.
    * @param campaignData - The data for the new campaign.
    */
   async createCampaign(campaignData: any): Promise<any> { // Use a specific type instead of any if schema is available
     try {
       const { data, error } = await supabase
         .from('campaigns')
         .insert(campaignData)
         .select() // Select the inserted row
         .single(); // Assuming insert returns the new row

       if (error) throw error;
       return data; // Return the created campaign object
     } catch (error) {
       handleError(error, 'createCampaign');
       throw error; // Re-throw the error
     }
   },

   /**
    * Updates an existing campaign.
    * @param campaignId - The ID of the campaign to update.
    * @param campaignData - The data to update.
    */
   async updateCampaign(campaignId: number, campaignData: any): Promise<any | null> { // Use a specific type instead of any
     try {
       const { data, error } = await supabase
         .from('campaigns')
         .update(campaignData)
         .eq('id', campaignId)
         .select() // Select the updated row
         .single(); // Assuming update returns the updated row

       if (error) throw error;
       return data; // Return the updated campaign object
     } catch (error) {
       handleError(error, `updateCampaign ${campaignId}`);
       throw error; // Re-throw the error
     }
   },

   /**
    * Deletes a campaign by ID.
    * @param campaignId - The ID of the campaign to delete.
    */
   async deleteCampaign(campaignId: number): Promise<void> {
     try {
       const { error } = await supabase
         .from('campaigns')
         .delete()
         .eq('id', campaignId);

       if (error) throw error;
     } catch (error) {
       handleError(error, `deleteCampaign ${campaignId}`);
       throw error; // Re-throw the error
     }
   },

    /**
     * Fetches targets for a specific campaign.
     * @param campaignId - The ID of the campaign.
     */
    async fetchCampaignTargets(campaignId: number): Promise<any[]> { // Use a specific type instead of any[]
      try {
        const { data, error } = await supabase
          .from('campaign_targets')
          .select(`
            *,
            contact:contacts(*) // Fetch related contact details
          `)
          .eq('campaign_id', campaignId);

        if (error) throw error;
        return data || [];
      } catch (error) {
        handleError(error, `fetchCampaignTargets ${campaignId}`);
        return [];
      }
    },

    /**
     * Adds a contact as a target for a campaign.
     * @param campaignId - The ID of the campaign.
     * @param contactId - The ID of the contact.
     * @param status - The status of the target (e.g., 'pending', 'contacted').
     */
    async addCampaignTarget(campaignId: number, contactId: number, status: string): Promise<any> { // Use a specific type instead of any
      try {
        const { data, error } = await supabase
          .from('campaign_targets')
          .insert({
            campaign_id: campaignId,
            contact_id: contactId,
            status: status
          })
          .select() // Select the inserted row
          .single(); // Assuming insert returns the new row

        if (error) throw error;
        return data; // Return the created campaign target
      } catch (error) {
        handleError(error, 'addCampaignTarget');
         throw error; // Re-throw the error
      }
    },

    /**
     * Removes a target from a campaign.
     * @param targetId - The ID of the campaign target to remove.
     */
    async removeCampaignTarget(targetId: number): Promise<void> {
      try {
        const { error } = await supabase
          .from('campaign_targets')
          .delete()
          .eq('id', targetId);

        if (error) throw error;
      } catch (error) {
        handleError(error, `removeCampaignTarget ${targetId}`);
         throw error; // Re-throw the error
      }
    },

    /**
     * Updates the status of a campaign target.
     * @param targetId - The ID of the campaign target.
     * @param newStatus - The new status.
     */
    async updateCampaignTargetStatus(targetId: number, newStatus: string): Promise<any | null> { // Use a specific type instead of any
      try {
        const { data, error } = await supabase
          .from('campaign_targets')
          .update({ status: newStatus })
          .eq('id', targetId)
          .select() // Select the updated row
          .single(); // Assuming update returns the updated row

        if (error) throw error;
        return data; // Return the updated campaign target
      } catch (error) {
        handleError(error, `updateCampaignTargetStatus ${targetId}`);
         throw error; // Re-throw the error
      }
    },

    /**
     * Fetches activities for a specific campaign.
     * @param campaignId - The ID of the campaign.
     */
    async fetchCampaignActivities(campaignId: number): Promise<any[]> { // Use a specific type instead of any[]
      try {
        const { data, error } = await supabase
          .from('campaign_activities')
          .select('*') // Select all columns for now
          .eq('campaign_id', campaignId)
          .order('scheduled_at', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        handleError(error, `fetchCampaignActivities ${campaignId}`);
        return [];
      }
    },

     /**
      * Adds a new activity to a campaign.
      * @param activityData - The data for the new activity.
      */
     async addCampaignActivity(activityData: any): Promise<any> { // Use a specific type instead of any
       try {
         const { data, error } = await supabase
           .from('campaign_activities')
           .insert(activityData)
           .select() // Select the inserted row
           .single(); // Assuming insert returns the new row

         if (error) throw error;
         return data; // Return the created activity
       } catch (error) {
         handleError(error, 'addCampaignActivity');
          throw error; // Re-throw the error
       }
     },

     /**
      * Updates an existing campaign activity.
      * @param activityId - The ID of the activity to update.
      * @param activityData - The data to update.
      */
     async updateCampaignActivity(activityId: number, activityData: any): Promise<any | null> { // Use a specific type instead of any
       try {
         const { data, error } = await supabase
           .from('campaign_activities')
           .update(activityData)
           .eq('id', activityId)
           .select() // Select the updated row
           .single(); // Assuming update returns the updated row

         if (error) throw error;
         return data; // Return the updated activity
       } catch (error) {
         handleError(error, `updateCampaignActivity ${activityId}`);
          throw error; // Re-throw the error
       }
     },

     /**
      * Deletes a campaign activity by ID.
      * @param activityId - The ID of the activity to delete.
      */
     async deleteCampaignActivity(activityId: number): Promise<void> {
       try {
         const { error } = await supabase
           .from('campaign_activities')
           .delete()
           .eq('id', activityId);

         if (error) throw error;
       } catch (error) {
         handleError(error, `deleteCampaignActivity ${activityId}`);
          throw error; // Re-throw the error
       }
     },

     /**
      * Fetches metrics for a specific campaign.
      * @param campaignId - The ID of the campaign.
      */
     async fetchCampaignMetrics(campaignId: number): Promise<any[]> { // Use a specific type instead of any[]
       try {
         const { data, error } = await supabase
           .from('campaign_metrics')
           .select('*') // Select all columns for now
           .eq('campaign_id', campaignId)
           .order('recorded_at', { ascending: true });

         if (error) throw error;
         return data || [];
       } catch (error) {
         handleError(error, `fetchCampaignMetrics ${campaignId}`);
         return [];
       }
     },

      /**
       * Adds a new metric to a campaign.
       * @param metricData - The data for the new metric.
       */
      async addCampaignMetric(metricData: any): Promise<any> { // Use a specific type instead of any
        try {
          const { data, error } = await supabase
            .from('campaign_metrics')
            .insert(metricData)
            .select() // Select the inserted row
            .single(); // Assuming insert returns the new row

          if (error) throw error;
          return data; // Return the created metric
        } catch (error) {
          handleError(error, 'addCampaignMetric');
           throw error; // Re-throw the error
        }
      },

      /**
       * Updates an existing campaign metric.
       * @param metricId - The ID of the metric to update.
       * @param metricData - The data to update.
       */
      async updateCampaignMetric(metricId: number, metricData: any): Promise<any | null> { // Use a specific type instead of any
        try {
          const { data, error } = await supabase
            .from('campaign_metrics')
            .update(metricData)
            .eq('id', metricId)
            .select() // Select the updated row
            .single(); // Assuming update returns the updated row

          if (error) throw error;
          return data; // Return the updated metric
        } catch (error) {
          handleError(error, `updateCampaignMetric ${metricId}`);
           throw error; // Re-throw the error
        }
      },

      /**
       * Deletes a campaign metric by ID.
       * @param metricId - The ID of the metric to delete.
       */
      async deleteCampaignMetric(metricId: number): Promise<void> {
        try {
          const { error } = await supabase
            .from('campaign_metrics')
            .delete()
            .eq('id', metricId);

          if (error) throw error;
        } catch (error) {
          handleError(error, `deleteCampaignMetric ${metricId}`);
           throw error; // Re-throw the error
        }
      },
};
