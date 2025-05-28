// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage-supabase.ts
import { format, subMonths, startOfMonth, endOfMonth, subYears } from "date-fns";

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = "https://mvmbtxwdovdubcojrwjz.supabase.co";
var supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bWJ0eHdkb3ZkdWJjb2pyd2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTQ1NDMsImV4cCI6MjA2MjA5MDU0M30.YXjE1qf7vDbgSzijgj-7HxxMFAXv0X6xn3PRL4WViMg";
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase configuration");
}
console.log("Connecting to Supabase at:", supabaseUrl);
var supabase2 = createClient(supabaseUrl, supabaseKey);

// server/storage-supabase.ts
var handleError = (error, operation) => {
  console.error(`Error in ${operation}:`, error);
  if (error.code && error.message) {
    console.error(`Supabase error (${error.code}): ${error.message}`);
    if (error.details)
      console.error(`Details: ${error.details}`);
    if (error.hint)
      console.error(`Hint: ${error.hint}`);
  }
  throw new Error(`Failed to execute ${operation}`);
};
var storage = {
  /**
   * Gets the current authenticated user (placeholder for auth)
   */
  async getCurrentUser() {
    try {
      const { data, error } = await supabase2.from("users").select("*").eq("id", 1).single();
      if (error)
        throw error;
      return data;
    } catch (error) {
      handleError(error, "getCurrentUser");
    }
  },
  /**
   * Gets all teams
   */
  async getAllTeams() {
    try {
      const { data, error } = await supabase2.from("teams").select("*").order("name", { ascending: true });
      if (error)
        throw error;
      return data || [];
    } catch (error) {
      handleError(error, "getAllTeams");
      return [];
    }
  },
  /**
   * Gets all users
   */
  async getUsers() {
    try {
      const { data: users, error } = await supabase2.from("users").select("*");
      if (error) {
        console.error("Error fetching users:", error);
        return [{ id: 1, name: "Default User" }];
      }
      if (!users || users.length === 0) {
        console.log("No users found, returning default user");
        return [{ id: 1, name: "Default User" }];
      }
      if (users.length > 0) {
        console.log("First user structure:", Object.keys(users[0]));
        console.log("First user data:", users[0]);
      }
      const formattedUsers = users.map((user) => {
        let displayName = "Default User";
        if (user.full_name)
          displayName = user.full_name;
        else if (user.username)
          displayName = user.username;
        else if (user.email)
          displayName = user.email;
        else
          displayName = `User ${user.id}`;
        return {
          id: user.id,
          name: displayName
        };
      });
      console.log("Formatted users:", formattedUsers);
      return formattedUsers;
    } catch (error) {
      console.error("Error in getUsers:", error);
      return [{ id: 1, name: "Default User" }];
    }
  },
  /**
   * Gets dashboard metrics
   */
  async getDashboardMetrics() {
    try {
      const { data: deals, error: dealsError } = await supabase2.from("deals").select("*");
      if (dealsError)
        throw dealsError;
      const { data: contacts, error: contactsError } = await supabase2.from("contacts").select("*");
      if (contactsError)
        throw contactsError;
      const now = /* @__PURE__ */ new Date();
      const oneMonthAgo = subMonths(now, 1);
      const totalDeals = deals?.length || 0;
      const pipelineValue = deals?.filter((deal) => new Date(deal.expected_close_date || "") >= now).reduce((sum, deal) => sum + Number(deal.value), 0) || 0;
      const wonDeals = deals?.filter((deal) => deal.stage === 5 || deal.stage === 5).length || 0;
      const wonValue = deals?.filter((deal) => deal.stage === 5 || deal.stage === 5).reduce((sum, deal) => sum + Number(deal.value), 0) || 0;
      const totalContacts = contacts?.length || 0;
      const newContacts = contacts?.filter((contact) => new Date(contact.created_at) >= oneMonthAgo).length || 0;
      return {
        totalDeals,
        pipelineValue,
        wonDeals,
        wonValue,
        totalContacts,
        newContacts
      };
    } catch (error) {
      handleError(error, "getDashboardMetrics");
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
  async getSalesPerformanceData(period) {
    try {
      if (!supabase2) {
        console.error("Supabase client is not initialized");
        return [];
      }
      const { data: allDeals, error } = await supabase2.from("deals").select("*").or(`stage.eq.5,stage.eq.5`);
      if (error) {
        console.error("Supabase query error:", error);
        return [];
      }
      if (!allDeals || allDeals.length === 0) {
        console.log("No deals found, returning sample data");
        return [
          { name: "Jan", current: 5e3, previous: 4200 },
          { name: "Feb", current: 7800, previous: 6800 },
          { name: "Mar", current: 4900, previous: 5100 },
          { name: "Apr", current: 9e3, previous: 7200 },
          { name: "May", current: 8100, previous: 7e3 },
          { name: "Jun", current: 10500, previous: 8300 }
        ];
      }
      const now = /* @__PURE__ */ new Date();
      let salesData = [];
      if (period === "monthly") {
        for (let i = 7; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const monthDeals = allDeals.filter((deal) => {
            const updateDate = new Date(deal.updated_at);
            return updateDate >= monthStart && updateDate <= monthEnd;
          });
          const monthValue = monthDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
          salesData.push({
            name: format(monthDate, "MMM"),
            value: monthValue
          });
        }
      } else if (period === "quarterly") {
        for (let i = 3; i >= 0; i--) {
          const quarterStartMonth = i * 3;
          const startDate = subMonths(now, quarterStartMonth + 2);
          const endDate = subMonths(now, quarterStartMonth);
          const quarterStart = startOfMonth(startDate);
          const quarterEnd = endOfMonth(endDate);
          const quarterDeals = allDeals.filter((deal) => {
            const updateDate = new Date(deal.updated_at);
            return updateDate >= quarterStart && updateDate <= quarterEnd;
          });
          const quarterValue = quarterDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
          salesData.push({
            name: `Q${4 - i}`,
            value: quarterValue
          });
        }
      } else if (period === "yearly") {
        for (let i = 4; i >= 0; i--) {
          const yearDate = subYears(now, i);
          const yearStart = new Date(yearDate.getFullYear(), 0, 1);
          const yearEnd = new Date(yearDate.getFullYear(), 11, 31, 23, 59, 59);
          const yearDeals = allDeals.filter((deal) => {
            const updateDate = new Date(deal.updated_at);
            return updateDate >= yearStart && updateDate <= yearEnd;
          });
          const yearValue = yearDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
          salesData.push({
            name: format(yearDate, "yyyy"),
            value: yearValue
          });
        }
      }
      return salesData;
    } catch (error) {
      console.error("Error in getSalesPerformanceData:", error);
      return [
        { name: "Jan", current: 5e3, previous: 4200 },
        { name: "Feb", current: 7800, previous: 6800 },
        { name: "Mar", current: 4900, previous: 5100 },
        { name: "Apr", current: 9e3, previous: 7200 },
        { name: "May", current: 8100, previous: 7e3 },
        { name: "Jun", current: 10500, previous: 8300 }
      ];
    }
  },
  /**
   * Gets pipeline overview data for dashboard
   */
  async getPipelineOverview() {
    try {
      const { error: tableCheckError } = await supabase2.from("pipeline_stages").select("count").limit(1);
      if (tableCheckError && tableCheckError.code === "42P01") {
        console.log("pipeline_stages table doesn't exist, returning sample data");
        return [
          {
            id: 1,
            name: "Lead",
            color: "#6366F1",
            order: 1,
            deals: [
              { id: 1, title: "Sample Deal 1", value: 5e3, owner: { name: "Demo User" } },
              { id: 2, title: "Sample Deal 2", value: 7500, owner: { name: "Demo User" } }
            ]
          },
          {
            id: 2,
            name: "Qualified",
            color: "#8B5CF6",
            order: 2,
            deals: [
              { id: 3, title: "Sample Deal 3", value: 1e4, owner: { name: "Demo User" } }
            ]
          },
          {
            id: 3,
            name: "Proposal",
            color: "#EC4899",
            order: 3,
            deals: []
          },
          {
            id: 4,
            name: "Negotiation",
            color: "#F59E0B",
            order: 4,
            deals: []
          },
          {
            id: 5,
            name: "Closed Won",
            color: "#10B981",
            order: 5,
            deals: []
          }
        ];
      }
      const { data: stages, error: stagesError } = await supabase2.from("pipeline_stages").select("*").order('"order"', { ascending: true });
      if (stagesError)
        throw stagesError;
      const { data: deals, error: dealsError } = await supabase2.from("deals").select("*");
      if (dealsError)
        throw dealsError;
      const result = stages?.map((stage2) => {
        const stageDeals = deals?.filter((deal) => deal.stage === stage2.id).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);
        return {
          ...stage2,
          deals: stageDeals || []
        };
      }) || [];
      return result;
    } catch (error) {
      handleError(error, "getPipelineOverview");
      return [
        {
          id: 1,
          name: "Lead",
          color: "#6366F1",
          order: 1,
          deals: [
            { id: 1, title: "Sample Deal 1", value: 5e3, owner: { name: "Demo User" } },
            { id: 2, title: "Sample Deal 2", value: 7500, owner: { name: "Demo User" } }
          ]
        },
        {
          id: 2,
          name: "Qualified",
          color: "#8B5CF6",
          order: 2,
          deals: [
            { id: 3, title: "Sample Deal 3", value: 1e4, owner: { name: "Demo User" } }
          ]
        },
        {
          id: 3,
          name: "Proposal",
          color: "#EC4899",
          order: 3,
          deals: []
        },
        {
          id: 4,
          name: "Negotiation",
          color: "#F59E0B",
          order: 4,
          deals: []
        },
        {
          id: 5,
          name: "Closed Won",
          color: "#10B981",
          order: 5,
          deals: []
        }
      ];
    }
  },
  /**
   * Gets full pipeline with filtering options
   */
  async getPipeline(filterUserId, sortBy = "updated") {
    try {
      const { error: tableCheckError } = await supabase2.from("pipeline_stages").select("count").limit(1);
      if (tableCheckError && tableCheckError.code === "42P01") {
        console.log("pipeline_stages table doesn't exist, returning sample data");
        return [
          {
            id: 1,
            name: "Lead",
            color: "#6366F1",
            order: 1,
            deals: [
              {
                id: 1,
                name: "Sample Deal 1",
                value: 5e3,
                contact: { name: "John Doe" },
                owner: { name: "Demo User" }
              }
            ]
          },
          {
            id: 2,
            name: "Qualified",
            color: "#8B5CF6",
            order: 2,
            deals: [
              {
                id: 3,
                name: "Sample Deal 3",
                value: 1e4,
                contact: { name: "Jane Smith" },
                owner: { name: "Demo User" }
              }
            ]
          },
          {
            id: 3,
            name: "Proposal",
            color: "#EC4899",
            order: 3,
            deals: []
          },
          {
            id: 4,
            name: "Negotiation",
            color: "#F59E0B",
            order: 4,
            deals: []
          },
          {
            id: 5,
            name: "Closed Won",
            color: "#10B981",
            order: 5,
            deals: []
          }
        ];
      }
      const { data: stages, error: stagesError } = await supabase2.from("pipeline_stages").select("*").order("order", { ascending: true });
      if (stagesError)
        throw stagesError;
      let dealsQuery = supabase2.from("deals").select("*, contact:contacts!contact_id(*), owner:users!owner_id(*)");
      if (filterUserId) {
        dealsQuery = dealsQuery.eq("owner_id", filterUserId);
      }
      const { data: deals, error: dealsError } = await dealsQuery;
      if (dealsError)
        throw dealsError;
      let sortedDeals = deals;
      if (sortBy === "updated") {
        sortedDeals = deals?.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      } else if (sortBy === "created") {
        sortedDeals = deals?.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortBy === "value") {
        sortedDeals = deals?.sort(
          (a, b) => Number(b.value) - Number(a.value)
        );
      }
      const result = stages?.map((stage2) => {
        const stageDeals = sortedDeals?.filter((deal) => deal.stage === stage2.id) || [];
        return {
          ...stage2,
          deals: stageDeals
        };
      }) || [];
      return result;
    } catch (error) {
      handleError(error, "getPipeline");
      return [
        {
          id: 1,
          name: "Lead",
          color: "#6366F1",
          order: 1,
          deals: [
            {
              id: 1,
              name: "Sample Deal 1",
              value: 5e3,
              contact: { name: "John Doe" },
              owner: { name: "Demo User" }
            }
          ]
        },
        {
          id: 2,
          name: "Qualified",
          color: "#8B5CF6",
          order: 2,
          deals: [
            {
              id: 3,
              name: "Sample Deal 3",
              value: 1e4,
              contact: { name: "Jane Smith" },
              owner: { name: "Demo User" }
            }
          ]
        },
        {
          id: 3,
          name: "Proposal",
          color: "#EC4899",
          order: 3,
          deals: []
        },
        {
          id: 4,
          name: "Negotiation",
          color: "#F59E0B",
          order: 4,
          deals: []
        },
        {
          id: 5,
          name: "Closed Won",
          color: "#10B981",
          order: 5,
          deals: []
        }
      ];
    }
  },
  /**
   * Gets today's tasks for the current user
   */
  async getTodaysTasks() {
    try {
      const today = /* @__PURE__ */ new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const endOfToday = new Date(today.setHours(23, 59, 59, 999));
      const { data: tasks, error } = await supabase2.from("tasks").select("*");
      if (error)
        throw error;
      if (!tasks || tasks.length === 0) {
        console.log("No tasks found, returning sample data");
        return [
          {
            id: 1,
            title: "Sample Task 1",
            description: "This is a sample task",
            due_date: today.toISOString(),
            completed: false,
            priority: "high",
            assigned_to: 1,
            assignedUser: { id: 1, name: "Demo User", avatarUrl: null }
          }
        ];
      }
      const tasksWithUsers = tasks.map((task) => {
        return {
          ...task,
          assignedUser: {
            id: task.assigned_to || 1,
            name: `User ${task.assigned_to || 1}`,
            avatarUrl: null
          }
        };
      });
      const todaysTasks = tasksWithUsers.filter((task) => {
        if (!task.due_date)
          return false;
        const taskDate = new Date(task.due_date);
        return taskDate >= startOfToday && taskDate <= endOfToday;
      });
      return todaysTasks;
    } catch (error) {
      console.error("Error in getTodaysTasks:", error);
      handleError(error, "getTodaysTasks");
      const today = /* @__PURE__ */ new Date();
      return [
        {
          id: 1,
          title: "Sample Task 1",
          description: "This is a sample task",
          due_date: today.toISOString(),
          completed: false,
          priority: "high",
          assigned_to: 1,
          assignedUser: { id: 1, name: "Demo User", avatarUrl: null }
        }
      ];
    }
  },
  /**
   * Toggles a task's completion status
   */
  async toggleTaskCompletion(taskId) {
    try {
      const { data: task, error: getError } = await supabase2.from("tasks").select("*").eq("id", taskId).single();
      if (getError)
        throw getError;
      const { data: updatedTask, error: updateError } = await supabase2.from("tasks").update({ completed: !task.completed }).eq("id", taskId).select().single();
      if (updateError)
        throw updateError;
      return updatedTask;
    } catch (error) {
      handleError(error, "toggleTaskCompletion");
      return null;
    }
  },
  /**
   * Gets recent contacts (last added or updated)
   */
  async getRecentContacts() {
    try {
      const { data: contacts, error } = await supabase2.from("contacts").select("*").order("created_at", { ascending: false }).limit(5);
      if (error)
        throw error;
      const contactsWithUsers = contacts.map((contact) => {
        return {
          ...contact,
          assignedUser: {
            id: contact.assigned_to || 1,
            name: `User ${contact.assigned_to || 1}`,
            avatarUrl: null
          }
        };
      });
      return contactsWithUsers;
    } catch (error) {
      console.error("Error in getRecentContacts:", error);
      handleError(error, "getRecentContacts");
      return [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          phone: "555-1234",
          company: "Acme Inc",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString(),
          assigned_to: 1,
          assignedUser: { id: 1, name: "Demo User", avatarUrl: null }
        }
      ];
    }
  },
  /**
   * Gets all contacts with optional search
   */
  async getContacts(search) {
    try {
      let query = supabase2.from("contacts").select("*");
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
      }
      const { data: contacts, error } = await query.order("name", { ascending: true });
      if (error)
        throw error;
      const { data: users, error: usersError } = await supabase2.from("users").select("*");
      if (usersError)
        throw usersError;
      const contactsWithUsers = contacts.map((contact) => {
        const user = users?.find((u) => u.id === contact.assigned_to) || null;
        return {
          ...contact,
          assignedUser: user
        };
      });
      return contactsWithUsers;
    } catch (error) {
      handleError(error, "getContacts");
      return [];
    }
  },
  /**
   * Gets recent activities
   */
  async getRecentActivities() {
    try {
      const { data: activities, error } = await supabase2.from("activities").select("*").order("created_at", { ascending: false }).limit(10);
      if (error)
        throw error;
      const activitiesWithUsers = activities.map((activity) => {
        return {
          ...activity,
          user: {
            id: activity.user_id || 1,
            name: `User ${activity.user_id || 1}`,
            avatarUrl: null
          }
        };
      });
      return activitiesWithUsers || [];
    } catch (error) {
      console.error("Error in getRecentActivities:", error);
      handleError(error, "getRecentActivities");
      return [];
    }
  },
  /**
   * Gets a single contact by ID
   */
  async getContactById(contactId) {
    try {
      const { data: contact, error } = await supabase2.from("contacts").select("*, assignedUser:users!assigned_to(*)").eq("id", contactId).single();
      if (error)
        throw error;
      const { data: deals, error: dealsError } = await supabase2.from("deals").select("*, stage:pipeline_stages(*), owner:users!owner_id(*)").eq("contact_id", contactId).order("updated_at", { ascending: false });
      if (dealsError)
        throw dealsError;
      const { data: activities, error: activitiesError } = await supabase2.from("activities").select("*, user:users!user_id(*)").eq("related_to_type", "contact").eq("related_to_id", contactId).order("created_at", { ascending: false });
      if (activitiesError)
        throw activitiesError;
      const { data: tasks, error: tasksError } = await supabase2.from("tasks").select("*, assignedUser:users!assigned_to(*)").eq("related_to_type", "contact").eq("related_to_id", contactId).order("due_date", { ascending: true });
      if (tasksError)
        throw tasksError;
      return {
        ...contact,
        deals: deals || [],
        activities: activities || [],
        tasks: tasks || []
      };
    } catch (error) {
      handleError(error, "getContactById");
      return null;
    }
  },
  /**
   * Creates a new contact
   */
  async createContact(contactData) {
    try {
      const supabaseContactData = {
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        title: contactData.title,
        company: contactData.company,
        status: contactData.status,
        assigned_to: contactData.assignedTo,
        // Changed from assignedTo to assigned_to
        avatar_url: contactData.avatarUrl,
        // Changed from avatarUrl to avatar_url
        address: contactData.address,
        notes: contactData.notes,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("Sending to Supabase:", supabaseContactData);
      const { data: contact, error } = await supabase2.from("contacts").insert(supabaseContactData).select().single();
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      return contact;
    } catch (error) {
      handleError(error, "createContact");
      return null;
    }
  },
  /**
   * Updates an existing contact
   */
  async updateContact(contactId, contactData) {
    try {
      const supabaseContactData = {
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        title: contactData.title,
        company: contactData.company,
        status: contactData.status,
        assigned_to: contactData.assignedTo,
        // Convert from assignedTo to assigned_to
        avatar_url: contactData.avatarUrl,
        // Convert from avatarUrl to avatar_url
        address: contactData.address,
        notes: contactData.notes,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("Sending to Supabase:", supabaseContactData);
      const { data: contact, error } = await supabase2.from("contacts").update(supabaseContactData).eq("id", contactId).select().single();
      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      return contact;
    } catch (error) {
      handleError(error, "updateContact");
      return null;
    }
  },
  /**
   * Deletes a contact
   */
  async deleteContact(contactId) {
    try {
      const { error } = await supabase2.from("contacts").delete().eq("id", contactId);
      if (error)
        throw error;
      return true;
    } catch (error) {
      handleError(error, "deleteContact");
      return false;
    }
  },
  /**
   * Creates a new deal
   */
  async createDeal(dealData) {
    try {
      const { data: deal, error } = await supabase2.from("deals").insert({
        ...dealData,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (error)
        throw error;
      return deal;
    } catch (error) {
      handleError(error, "createDeal");
      return null;
    }
  },
  /**
   * Updates a deal's stage
   */
  async updateDealStage(dealId, stageId) {
    try {
      const { data: deal, error } = await supabase2.from("deals").update({
        stage,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", dealId).select().single();
      if (error)
        throw error;
      return deal;
    } catch (error) {
      handleError(error, "updateDealStage");
      return null;
    }
  },
  /**
   * Creates a new task
   */
  async createTask(taskData) {
    try {
      console.log("Original task data:", taskData);
      let assignedTo = null;
      if (taskData.assigned_to !== void 0) {
        assignedTo = Number(taskData.assigned_to);
        if (isNaN(assignedTo)) {
          console.error("Invalid assigned_to value:", taskData.assigned_to);
          throw new Error("assigned_to must be a valid number");
        }
      } else if (taskData.assignedTo !== void 0) {
        assignedTo = Number(taskData.assignedTo);
        if (isNaN(assignedTo)) {
          console.error("Invalid assignedTo value:", taskData.assignedTo);
          throw new Error("assignedTo must be a valid number");
        }
      }
      const supabaseData = {
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority || "medium",
        assigned_to: assignedTo,
        due_date: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
        time: taskData.time || null,
        related_to_type: taskData.relatedToType || null,
        related_to_id: taskData.relatedToId ? Number(taskData.relatedToId) : null,
        completed: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("Supabase data:", supabaseData);
      const { data: task, error } = await supabase2.from("tasks").insert(supabaseData).select().single();
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      const formattedTask = {
        ...task,
        dueDate: task.due_date,
        assignedTo: task.assigned_to,
        // For backward compatibility
        assigned_to: task.assigned_to,
        relatedToType: task.related_to_type,
        relatedToId: task.related_to_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      };
      return formattedTask;
    } catch (error) {
      handleError(error, "createTask");
      return null;
    }
  },
  /**
   * Creates a new activity
   */
  async createActivity(activityData) {
    try {
      const { data: activity, error } = await supabase2.from("activities").insert({
        ...activityData,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (error)
        throw error;
      return activity;
    } catch (error) {
      handleError(error, "createActivity");
      return null;
    }
  },
  /**
   * Gets a single task by ID
   */
  async getTaskById(taskId) {
    try {
      const { data: task, error } = await supabase2.from("tasks").select("*").eq("id", taskId).single();
      if (error)
        throw error;
      return {
        ...task,
        assignedUser: {
          id: task.assigned_to || 1,
          name: `User ${task.assigned_to || 1}`,
          avatarUrl: null
        }
      };
    } catch (error) {
      console.error("Error in getTaskById:", error);
      handleError(error, "getTaskById");
      return null;
    }
  },
  /**
   * Gets all tasks with optional search filter
   */
  async getTasks(search) {
    try {
      console.log("Getting tasks with search:", search);
      let query = supabase2.from("tasks").select("*");
      if (search) {
        query = query.ilike("title", `%${search}%`);
      }
      const { data: tasks, error } = await query;
      if (error) {
        console.error("Error fetching tasks from Supabase:", error);
        throw error;
      }
      console.log(`Found ${tasks?.length || 0} tasks`);
      if (!tasks || tasks.length === 0) {
        console.log("No tasks found, returning sample data");
        return [
          {
            id: 1,
            title: "Sample Task 1",
            description: "This is a sample task",
            due_date: (/* @__PURE__ */ new Date()).toISOString(),
            completed: false,
            priority: "high",
            assigned_to: 1,
            assignedUser: { id: 1, name: "Demo User" }
          }
        ];
      }
      return tasks.map((task) => ({
        ...task,
        assignedUser: {
          id: task.assigned_to || 1,
          name: `User ${task.assigned_to || 1}`
        }
      }));
    } catch (error) {
      console.error("Error in getTasks:", error);
      handleError(error, "getTasks");
      return [];
    }
  },
  /**
   * Updates a task
   */
  async updateTask(taskId, taskData) {
    try {
      const formattedData = {};
      if (taskData.title !== void 0)
        formattedData.title = taskData.title;
      if (taskData.description !== void 0)
        formattedData.description = taskData.description;
      if (taskData.priority !== void 0)
        formattedData.priority = taskData.priority;
      if (taskData.time !== void 0)
        formattedData.time = taskData.time;
      if (taskData.dueDate !== void 0) {
        if (typeof taskData.dueDate === "string" && taskData.dueDate) {
          formattedData.due_date = new Date(taskData.dueDate).toISOString();
        } else if (taskData.dueDate instanceof Date) {
          formattedData.due_date = taskData.dueDate.toISOString();
        } else {
          formattedData.due_date = null;
        }
      }
      if (taskData.assignedTo !== void 0) {
        formattedData.assigned_to = taskData.assignedTo;
      }
      if ("relatedToType" in taskData) {
        formattedData.related_to_type = taskData.relatedToType;
      }
      if ("relatedToId" in taskData) {
        formattedData.related_to_id = taskData.relatedToId;
      }
      formattedData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      console.log("Updating task with data:", formattedData);
      const { data, error } = await supabase2.from("tasks").update(formattedData).eq("id", taskId).select().single();
      if (error) {
        console.error("Update error:", error);
        throw error;
      }
      const formattedTask = {
        ...data,
        dueDate: data.due_date,
        assignedTo: data.assigned_to,
        relatedToType: data.related_to_type,
        relatedToId: data.related_to_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      return formattedTask;
    } catch (error) {
      handleError(error, "updateTask");
      return null;
    }
  },
  /**
   * Gets all pipeline stages
   */
  async getPipelineStages() {
    try {
      const { error: tableCheckError } = await supabase2.from("pipeline_stages").select("count").limit(1);
      if (tableCheckError && tableCheckError.code === "42P01") {
        console.log("pipeline_stages table doesn't exist, returning sample data");
        return [
          {
            id: 1,
            name: "Lead",
            color: "#6366F1",
            order: 1
          },
          {
            id: 2,
            name: "Qualified",
            color: "#8B5CF6",
            order: 2
          },
          {
            id: 3,
            name: "Proposal",
            color: "#EC4899",
            order: 3
          },
          {
            id: 4,
            name: "Negotiation",
            color: "#F59E0B",
            order: 4
          },
          {
            id: 5,
            name: "Closed Won",
            color: "#10B981",
            order: 5
          }
        ];
      }
      const { data: stages, error: stagesError } = await supabase2.from("pipeline_stages").select("*").order("order", { ascending: true });
      if (stagesError)
        throw stagesError;
      return stages || [];
    } catch (error) {
      handleError(error, "getPipelineStages");
      return [
        {
          id: 1,
          name: "Lead",
          color: "#6366F1",
          order: 1
        },
        {
          id: 2,
          name: "Qualified",
          color: "#8B5CF6",
          order: 2
        },
        {
          id: 3,
          name: "Proposal",
          color: "#EC4899",
          order: 3
        },
        {
          id: 4,
          name: "Negotiation",
          color: "#F59E0B",
          order: 4
        },
        {
          id: 5,
          name: "Closed Won",
          color: "#10B981",
          order: 5
        }
      ];
    }
  }
};

// server/routes.ts
import {
  insertContactSchema,
  insertDealSchema,
  insertTaskSchema,
  insertActivitySchema
} from "@shared/schema";
import { ZodError } from "zod";
async function registerRoutes(app2) {
  console.log("Starting route registration...");
  const apiPrefix = "/api";
  console.log(`Using API prefix: ${apiPrefix}`);
  const debugRoute = (method, path3) => {
    console.log(`Registering ${method} route: ${path3}`);
    return path3;
  };
  app2.get(debugRoute("GET", `${apiPrefix}/users/current`), async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      res.json(currentUser);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch current user" });
    }
  });
  app2.get(debugRoute("GET", `${apiPrefix}/teams`), async (req, res) => {
    try {
      const allTeams = await storage.getAllTeams();
      res.json(allTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });
  app2.get(`${apiPrefix}/users`, async (req, res) => {
    try {
      const users = await storage.getUsers();
      console.log("Returning users:", users);
      res.json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.json({
        users: [{ id: 1, name: "Default User" }]
      });
    }
  });
  app2.get(`${apiPrefix}/dashboard/metrics`, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });
  app2.get(`${apiPrefix}/dashboard/sales-performance`, async (req, res) => {
    try {
      const period = req.query.period || "monthly";
      const salesData = await storage.getSalesPerformanceData(period);
      res.json({ salesData });
    } catch (error) {
      console.error("Error fetching sales performance data:", error);
      res.status(500).json({ message: "Failed to fetch sales performance data" });
    }
  });
  app2.get(`${apiPrefix}/pipeline/overview`, async (req, res) => {
    try {
      const stages = await storage.getPipelineOverview();
      res.json({ stages });
    } catch (error) {
      console.error("Error fetching pipeline overview:", error);
      res.status(500).json({ message: "Failed to fetch pipeline overview" });
    }
  });
  app2.get(`${apiPrefix}/pipeline`, async (req, res) => {
    try {
      const stages = await storage.getPipeline();
      let users = [];
      try {
        users = await storage.getUsers();
      } catch (userError) {
        console.error("Error fetching users for pipeline:", userError);
        users = [{ id: 1, name: "Default User" }];
      }
      res.json({
        stages,
        users
      });
    } catch (error) {
      console.error("Error fetching pipeline data:", error);
      res.status(500).json({
        message: "Failed to fetch pipeline data",
        stages: [
          {
            id: 1,
            name: "Lead",
            color: "#6366F1",
            order: 1,
            deals: []
          },
          {
            id: 2,
            name: "Qualified",
            color: "#8B5CF6",
            order: 2,
            deals: []
          },
          {
            id: 3,
            name: "Proposal",
            color: "#EC4899",
            order: 3,
            deals: []
          },
          {
            id: 4,
            name: "Negotiation",
            color: "#F59E0B",
            order: 4,
            deals: []
          },
          {
            id: 5,
            name: "Closed Won",
            color: "#10B981",
            order: 5,
            deals: []
          }
        ],
        users: [{ id: 1, name: "Default User" }]
      });
    }
  });
  app2.get(`${apiPrefix}/tasks/today`, async (req, res) => {
    try {
      const tasks = await storage.getTodaysTasks();
      res.json({ tasks });
    } catch (error) {
      console.error("Error fetching today's tasks:", error);
      res.status(500).json({ message: "Failed to fetch today's tasks" });
    }
  });
  app2.patch(`${apiPrefix}/tasks/:taskId/toggle`, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.toggleTaskCompletion(taskId);
      res.json({ task });
    } catch (error) {
      console.error("Error toggling task completion:", error);
      res.status(500).json({ message: "Failed to toggle task completion" });
    }
  });
  app2.get(`${apiPrefix}/tasks`, async (req, res) => {
    try {
      console.log("Fetching tasks with query:", req.query);
      const search = req.query.search;
      const tasks = await storage.getTasks(search);
      console.log(`Returning ${tasks.length} tasks`);
      res.json({ tasks });
    } catch (error) {
      console.error("Error in /api/tasks route:", error);
      res.status(500).json({ message: "Failed to fetch tasks", error: String(error) });
    }
  });
  app2.get(debugRoute("GET", `${apiPrefix}/tasks/:taskId`), async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });
  app2.patch(debugRoute("PATCH", `${apiPrefix}/tasks/:taskId`), async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const requestBody = { ...req.body };
      if (requestBody.dueDate) {
        try {
          requestBody.dueDate = requestBody.dueDate;
        } catch (e) {
          return res.status(400).json({
            message: "Invalid date format",
            errors: [{ path: ["dueDate"], message: "Invalid date format" }]
          });
        }
      }
      const taskData = insertTaskSchema.partial().parse(requestBody);
      const updatedTask = await storage.updateTask(taskId, taskData);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  });
  app2.delete(`${apiPrefix}/tasks/:taskId`, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const success = await storage.deleteTask(taskId);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  app2.get(`${apiPrefix}/contacts/recent`, async (req, res) => {
    try {
      const contacts = await storage.getRecentContacts();
      res.json({ contacts });
    } catch (error) {
      console.error("Error fetching recent contacts:", error);
      res.status(500).json({ message: "Failed to fetch recent contacts" });
    }
  });
  app2.get(`${apiPrefix}/contacts`, async (req, res) => {
    try {
      const search = req.query.search;
      const contacts = await storage.getContacts(search);
      res.json({ contacts });
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });
  app2.get(`${apiPrefix}/activities/recent`, async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json({ activities });
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });
  app2.post(`${apiPrefix}/contacts`, async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const newContact = await storage.createContact(contactData);
      res.status(201).json(newContact);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      } else {
        console.error("Error creating contact:", error);
        res.status(500).json({ message: "Failed to create contact" });
      }
    }
  });
  app2.get(debugRoute("GET", `${apiPrefix}/contacts/:contactId`), async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const contact = await storage.getContactById(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error getting contact:", error);
      res.status(500).json({ message: "Failed to get contact" });
    }
  });
  app2.patch(debugRoute("PATCH", `${apiPrefix}/contacts/:contactId`), async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const contactData = insertContactSchema.partial().parse(req.body);
      const updatedContact = await storage.updateContact(contactId, contactData);
      if (!updatedContact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(updatedContact);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      } else {
        console.error("Error updating contact:", error);
        res.status(500).json({ message: "Failed to update contact" });
      }
    }
  });
  app2.delete(`${apiPrefix}/contacts/:contactId`, async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const success = await storage.deleteContact(contactId);
      if (!success) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });
  app2.post(`${apiPrefix}/deals`, async (req, res) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const transformedData = {
        name: dealData.name,
        description: dealData.description,
        value: dealData.value,
        stage_id: dealData.stageId,
        contact_id: dealData.contactId,
        owner_id: dealData.ownerId,
        probability: dealData.probability,
        expected_close_date: dealData.expectedCloseDate
      };
      console.log("Transformed deal data for Supabase:", transformedData);
      const newDeal = await storage.createDeal(transformedData);
      res.status(201).json(newDeal);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      } else {
        console.error("Error creating deal:", error);
        res.status(500).json({ message: "Failed to create deal" });
      }
    }
  });
  app2.post(`${apiPrefix}/deals/create`, async (req, res) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const transformedData = {
        name: dealData.name,
        description: dealData.description,
        value: dealData.value,
        stage_id: dealData.stageId,
        contact_id: dealData.contactId,
        owner_id: dealData.ownerId,
        probability: dealData.probability,
        expected_close_date: dealData.expectedCloseDate
      };
      console.log("Transformed deal data for Supabase:", transformedData);
      const newDeal = await storage.createDeal(transformedData);
      res.status(201).json(newDeal);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      } else {
        console.error("Error creating deal:", error);
        res.status(500).json({ message: "Failed to create deal" });
      }
    }
  });
  app2.patch(`${apiPrefix}/deals/:dealId/stage`, async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const { stageId } = req.body;
      if (!stageId) {
        return res.status(400).json({ message: "stageId is required" });
      }
      const updatedDeal = await storage.updateDealStage(dealId, parseInt(stageId));
      res.json({ deal: updatedDeal });
    } catch (error) {
      console.error("Error updating deal stage:", error);
      res.status(500).json({ message: "Failed to update deal stage" });
    }
  });
  app2.post(`${apiPrefix}/tasks`, async (req, res) => {
    try {
      console.log("Received task data:", req.body);
      const taskData = { ...req.body };
      if (taskData.assignedTo !== void 0) {
        const assignedToValue = Number(taskData.assignedTo);
        if (isNaN(assignedToValue)) {
          return res.status(400).json({
            message: "Invalid assignedTo value",
            errors: [{
              path: ["assignedTo"],
              message: "assignedTo must be a valid number"
            }]
          });
        }
        taskData.assigned_to = assignedToValue;
      }
      console.log("Processed task data:", taskData);
      const validatedData = insertTaskSchema.parse(taskData);
      console.log("Validated task data:", validatedData);
      const newTask = await storage.createTask(validatedData);
      if (!newTask) {
        return res.status(500).json({ message: "Failed to create task" });
      }
      res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Validation error:", error.errors);
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });
  app2.post(`${apiPrefix}/activities`, async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const newActivity = await storage.createActivity(activityData);
      res.status(201).json(newActivity);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      } else {
        console.error("Error creating activity:", error);
        res.status(500).json({ message: "Failed to create activity" });
      }
    }
  });
  app2.get(`${apiPrefix}/tasks-direct`, async (req, res) => {
    try {
      const { data: tasks, error } = await supabase.from("tasks").select("*");
      if (error) {
        console.error("Error fetching tasks:", error);
        return res.status(500).json({ message: "Failed to fetch tasks" });
      }
      const userIds = [...new Set(tasks.map((task) => task.assigned_to))].filter((id) => id !== null);
      if (userIds.length === 0) {
        return res.json(tasks.map((task) => ({
          ...task,
          assignedUser: null
        })));
      }
      const { data: users, error: usersError } = await supabase.from("users").select("*").in("id", userIds);
      if (usersError) {
        console.error("Error fetching users:", usersError);
        return res.json(tasks.map((task) => ({
          ...task,
          assignedUser: null
        })));
      }
      if (users && users.length > 0) {
        console.log("First user structure:", Object.keys(users[0]));
        return res.json({
          userStructure: Object.keys(users[0]),
          firstUser: users[0],
          tasks
        });
      }
      return res.json(tasks.map((task) => ({
        ...task,
        assignedUser: null
      })));
    } catch (error) {
      console.error("Error in direct tasks route:", error);
      res.status(500).json({ message: "Failed to fetch tasks directly" });
    }
  });
  app2.get(`${apiPrefix}/users-structure`, async (req, res) => {
    try {
      const { data: users, error } = await supabase.from("users").select("*").limit(1);
      if (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Failed to fetch users" });
      }
      if (users && users.length > 0) {
        return res.json({
          columns: Object.keys(users[0]),
          sample: users[0]
        });
      }
      return res.json({ message: "No users found" });
    } catch (error) {
      console.error("Error in users structure route:", error);
      res.status(500).json({ message: "Failed to fetch users structure" });
    }
  });
  app2.get(`${apiPrefix}/debug-users`, async (req, res) => {
    try {
      const { data: tableExists, error: tableError } = await supabase.from("information_schema.tables").select("table_name").eq("table_name", "users").limit(1);
      if (tableError) {
        return res.status(500).json({
          message: "Error checking if users table exists",
          error: tableError
        });
      }
      if (!tableExists || tableExists.length === 0) {
        return res.status(404).json({ message: "Users table does not exist" });
      }
      const { data: columns, error: columnsError } = await supabase.from("information_schema.columns").select("column_name").eq("table_name", "users");
      if (columnsError) {
        return res.status(500).json({
          message: "Error getting columns for users table",
          error: columnsError
        });
      }
      const { data: users, error: usersError } = await supabase.from("users").select("*").limit(1);
      return res.json({
        tableExists: true,
        columns: columns?.map((col) => col.column_name) || [],
        sampleUser: users && users.length > 0 ? users[0] : null,
        usersError
      });
    } catch (error) {
      console.error("Error in debug-users route:", error);
      res.status(500).json({ message: "Failed to debug users table", error });
    }
  });
  const httpServer = createServer(app2);
  console.log("Checking all registered routes for path-to-regexp issues...");
  if (app2._router && app2._router.stack) {
    app2._router.stack.forEach((r) => {
      if (r.route && r.route.path) {
        const path3 = r.route.path;
        if (path3.includes(":") && !path3.match(/\/:[a-zA-Z0-9_]+/)) {
          console.error(`MALFORMED ROUTE PARAMETER DETECTED: ${path3}`);
        }
      }
    });
  }
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false
  },
  optimizeDeps: {
    include: [
      // Core React
      "react",
      "react-dom",
      "react/jsx-runtime",
      // Routing
      "wouter",
      // UI Components
      "lucide-react",
      "react-icons",
      "react-icons/si",
      "recharts",
      // Data Management
      "@tanstack/react-query",
      "@supabase/supabase-js"
    ],
    exclude: [
      // Exclude Firebase packages to prevent resolution issues
      "firebase",
      "firebase/auth",
      "firebase/app"
    ]
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.path}`);
  next();
});
app.use((req, res, next) => {
  try {
    next();
  } catch (err) {
    if (err && err.message && err.message.includes("path-to-regexp")) {
      console.error("PATH-TO-REGEXP ERROR CAUGHT IN MIDDLEWARE:");
      console.error(`Error message: ${err.message}`);
      console.error(`Route path: ${req.path}`);
      return res.status(500).json({ error: "Route configuration error" });
    }
    next(err);
  }
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  console.log("Starting server initialization...");
  try {
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");
    app.use((req, res, next) => {
      if (req.url.startsWith("/@") || req.url.includes("node_modules/.vite")) {
        return next();
      }
      if (req.url.includes(":") && !req.url.match(/\/:[a-zA-Z0-9_]+/)) {
        console.error(`MALFORMED URL PARAMETER DETECTED: ${req.url}`);
        return res.status(400).json({ error: "Invalid URL format - missing parameter name" });
      }
      next();
    });
    app.use((err, req, res, next) => {
      if (err && err.message && err.message.includes("path-to-regexp")) {
        console.error("PATH-TO-REGEXP ERROR DETECTED:");
        console.error(`Error message: ${err.message}`);
        console.error(`Route path: ${req.path}`);
        console.error(`Stack trace: ${err.stack}`);
        return res.status(500).json({ error: "Route configuration error" });
      }
      next(err);
    });
    app.use(function globalErrorHandler(err, _req, res, _next) {
      console.error("Express error handler caught:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = 5e3;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Server initialization failed:", error);
  }
})();
