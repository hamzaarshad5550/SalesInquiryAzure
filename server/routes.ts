import type { Express } from "express";
import { createServer, type Server } from "http";
// Import storage from the Supabase implementation instead
import { storage } from "./storage-supabase";
import { supabase } from "./supabase";
import { formatISO, subMonths, startOfMonth, endOfMonth, subYears } from "date-fns";
import {
  insertContactSchema,
  insertDealSchema,
  insertTaskSchema,
  insertActivitySchema,
} from "@shared/schema";
import { ZodError } from "zod";

function debugRoute(method: string, path: string): string {
  // Enhanced debug logging for route registration
  console.log(`Defining route: ${method} ${path}`);
  // Check for potential path-to-regexp issues
  if (path.includes('/:') && path.includes('/:/', path.indexOf('/:'))) {
    console.error(`POTENTIAL ROUTE ERROR: Route ${path} may have malformed parameter`);
  }
  if (path.endsWith(':')) {
    console.error(`POTENTIAL ROUTE ERROR: Route ${path} ends with a colon`);
  }
  if (path.includes(':') && !path.includes('/:')) {
    console.error(`POTENTIAL ROUTE ERROR: Route ${path} has colon not preceded by slash`);
  }
  return path;
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Starting route registration...");
  
  // API prefix for all routes
  const apiPrefix = "/api";
  console.log(`Using API prefix: ${apiPrefix}`);
  
  // Fix: Don't override Express methods, use a different approach for debugging
  const debugRoute = (method: string, path: string) => {
    console.log(`Registering ${method} route: ${path}`);
    return path;
  };
  
  // Current user placeholder (would be replaced by actual auth)
  app.get(debugRoute('GET', `${apiPrefix}/users/current`), async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      res.json(currentUser);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch current user" });
    }
  });

  // Teams
  app.get(debugRoute('GET', `${apiPrefix}/teams`), async (req, res) => {
    try {
      const allTeams = await storage.getAllTeams();
      res.json(allTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });
  
  // Get all users
  app.get(`${apiPrefix}/users`, async (req, res) => {
    try {
      const users = await storage.getUsers();
      console.log("Returning users:", users); // Debug log
      res.json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      // Return at least one default user
      res.json({ 
        users: [{ id: 1, name: "Default User" }] 
      });
    }
  });

  // Dashboard metrics
  app.get(`${apiPrefix}/dashboard/metrics`, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Sales performance data
  app.get(`${apiPrefix}/dashboard/sales-performance`, async (req, res) => {
    try {
      const period = (req.query.period as string) || 'monthly';
      const salesData = await storage.getSalesPerformanceData(period);
      res.json({ salesData });
    } catch (error) {
      console.error("Error fetching sales performance data:", error);
      res.status(500).json({ message: "Failed to fetch sales performance data" });
    }
  });

  // Pipeline overview
  app.get(`${apiPrefix}/pipeline/overview`, async (req, res) => {
    try {
      const stages = await storage.getPipelineOverview();
      res.json({ stages });
    } catch (error) {
      console.error("Error fetching pipeline overview:", error);
      res.status(500).json({ message: "Failed to fetch pipeline overview" });
    }
  });

  // Full Pipeline
  app.get(`${apiPrefix}/pipeline`, async (req, res) => {
    try {
      // Get pipeline stages directly from storage
      const stages = await storage.getPipeline();
      
      // Get users separately
      let users = [];
      try {
        users = await storage.getUsers();
      } catch (userError) {
        console.error("Error fetching users for pipeline:", userError);
        // Provide default user if we can't get real users
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

  // Today's tasks
  app.get(`${apiPrefix}/tasks/today`, async (req, res) => {
    try {
      const tasks = await storage.getTodaysTasks();
      res.json({ tasks });
    } catch (error) {
      console.error("Error fetching today's tasks:", error);
      res.status(500).json({ message: "Failed to fetch today's tasks" });
    }
  });

  // Toggle task completion
  app.patch(`${apiPrefix}/tasks/:taskId/toggle`, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.toggleTaskCompletion(taskId);
      res.json({ task });
    } catch (error) {
      console.error("Error toggling task completion:", error);
      res.status(500).json({ message: "Failed to toggle task completion" });
    }
  });
  
  // Get all tasks
  app.get(`${apiPrefix}/tasks`, async (req, res) => {
    try {
      console.log("Fetching tasks with query:", req.query);
      
      const search = req.query.search as string;
      const tasks = await storage.getTasks(search);
      
      console.log(`Returning ${tasks.length} tasks`);
      res.json({ tasks });
    } catch (error) {
      console.error("Error in /api/tasks route:", error);
      res.status(500).json({ message: "Failed to fetch tasks", error: String(error) });
    }
  });
  
  // Get a single task
  app.get(debugRoute('GET', `${apiPrefix}/tasks/:taskId`), async (req, res) => {
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
  
  // Update task
  app.patch(debugRoute('PATCH', `${apiPrefix}/tasks/:taskId`), async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      
      // Pre-process the request body to handle date conversion
      const requestBody = { ...req.body };
      
      // Convert dueDate string to Date object if it exists
      if (requestBody.dueDate) {
        try {
          // Keep it as a string, the storage layer will handle conversion
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
  
  // Delete task
  app.delete(`${apiPrefix}/tasks/:taskId`, async (req, res) => {
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

  // Recent contacts
  app.get(`${apiPrefix}/contacts/recent`, async (req, res) => {
    try {
      const contacts = await storage.getRecentContacts();
      res.json({ contacts });
    } catch (error) {
      console.error("Error fetching recent contacts:", error);
      res.status(500).json({ message: "Failed to fetch recent contacts" });
    }
  });

  // All contacts with search
  app.get(`${apiPrefix}/contacts`, async (req, res) => {
    try {
      const search = req.query.search as string;
      const contacts = await storage.getContacts(search);
      res.json({ contacts });
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Recent activities
  app.get(`${apiPrefix}/activities/recent`, async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json({ activities });
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  // Create new contact
  app.post(`${apiPrefix}/contacts`, async (req, res) => {
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

  // Get single contact
  app.get(debugRoute('GET', `${apiPrefix}/contacts/:contactId`), async (req, res) => {
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

  // Update contact
  app.patch(debugRoute('PATCH', `${apiPrefix}/contacts/:contactId`), async (req, res) => {
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

  // Delete contact
  app.delete(`${apiPrefix}/contacts/:contactId`, async (req, res) => {
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

  // Create new deal
  app.post(`${apiPrefix}/deals`, async (req, res) => {
    try {
      // Validate the incoming data with the schema
      const dealData = insertDealSchema.parse(req.body);
      
      // Transform camelCase to snake_case for Supabase
      const transformedData = {
        name: dealData.name,
        description: dealData.description,
        value: dealData.value,
        stage_id: dealData.stageId,
        contact_id: dealData.contactId,
        owner_id: dealData.ownerId,
        probability: dealData.probability,
        expected_close_date: dealData.expectedCloseDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log("Transformed deal data for Supabase:", transformedData);
      
      // Transform back to camelCase for the storage layer
      const storageData = {
        name: transformedData.name,
        value: transformedData.value,
        stageId: transformedData.stage_id,
        contactId: transformedData.contact_id,
        ownerId: transformedData.owner_id,
        description: transformedData.description,
        expectedCloseDate: transformedData.expected_close_date,
        probability: transformedData.probability,
        createdAt: transformedData.created_at,
        updatedAt: transformedData.updated_at
      };
      
      const newDeal = await storage.createDeal(storageData);
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

  // Alternative endpoint for creating deals with proper transformation
  app.post(`${apiPrefix}/deals/create`, async (req, res) => {
    try {
      // Validate the incoming data with the schema
      const dealData = insertDealSchema.parse(req.body);
      
      // Transform camelCase to snake_case for Supabase
      const transformedData = {
        name: dealData.name,
        description: dealData.description,
        value: dealData.value,
        stage_id: dealData.stageId,
        contact_id: dealData.contactId,
        owner_id: dealData.ownerId,
        probability: dealData.probability,
        expected_close_date: dealData.expectedCloseDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log("Transformed deal data for Supabase:", transformedData);
      
      // Transform back to camelCase for the storage layer
      const storageData = {
        name: transformedData.name,
        value: transformedData.value,
        stageId: transformedData.stage_id,
        contactId: transformedData.contact_id,
        ownerId: transformedData.owner_id,
        description: transformedData.description,
        expectedCloseDate: transformedData.expected_close_date,
        probability: transformedData.probability,
        createdAt: transformedData.created_at,
        updatedAt: transformedData.updated_at
      };
      
      const newDeal = await storage.createDeal(storageData);
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

  // Update deal stage
  app.patch(`${apiPrefix}/deals/:dealId/stage`, async (req, res) => {
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

  // Create new task
  app.post(`${apiPrefix}/tasks`, async (req, res) => {
    try {
      console.log("Received task data:", req.body);
      
      // Make a copy of the request body
      const taskData = { ...req.body };
      
      // Ensure assignedTo is properly converted to assigned_to
      if (taskData.assignedTo !== undefined) {
        // Convert to number and validate
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
        
        // Set assigned_to to the validated number
        taskData.assigned_to = assignedToValue;
      }
      
      console.log("Processed task data:", taskData);
      
      // Validate the task data
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

  // Create new activity
  app.post(`${apiPrefix}/activities`, async (req, res) => {
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

  // Direct route to get tasks (bypassing storage layer)
  app.get(`${apiPrefix}/tasks-direct`, async (req, res) => {
    try {
      // Get tasks directly from Supabase
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*');
      
      if (error) {
        console.error("Error fetching tasks:", error);
        return res.status(500).json({ message: "Failed to fetch tasks" });
      }
      
      // Get user IDs from tasks
      const userIds = [...new Set(tasks.map(task => task.assigned_to))].filter(id => id !== null);
      
      // If there are no user IDs, return tasks without users
      if (userIds.length === 0) {
        return res.json(tasks.map(task => ({
          ...task,
          assignedUser: null
        })));
      }
      
      // Fetch only the users we need
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);
      
      if (usersError) {
        console.error("Error fetching users:", usersError);
        // Return tasks without users
        return res.json(tasks.map(task => ({
          ...task,
          assignedUser: null
        })));
      }
      
      // Log the first user to see its structure
      if (users && users.length > 0) {
        console.log("First user structure:", Object.keys(users[0]));
        
        // Return the first user for debugging
        return res.json({
          userStructure: Object.keys(users[0]),
          firstUser: users[0],
          tasks: tasks
        });
      }
      
      // Return tasks without users if no users found
      return res.json(tasks.map(task => ({
        ...task,
        assignedUser: null
      })));
    } catch (error) {
      console.error("Error in direct tasks route:", error);
      res.status(500).json({ message: "Failed to fetch tasks directly" });
    }
  });

  // Route to get users table structure
  app.get(`${apiPrefix}/users-structure`, async (req, res) => {
    try {
      // Get a single user to see the structure
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
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

  // Debug route to check users table
  app.get(`${apiPrefix}/debug-users`, async (req, res) => {
    try {
      // First check if the users table exists
      const { data: tableExists, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'users')
        .limit(1);
      
      if (tableError) {
        return res.status(500).json({ 
          message: "Error checking if users table exists", 
          error: tableError 
        });
      }
      
      if (!tableExists || tableExists.length === 0) {
        return res.status(404).json({ message: "Users table does not exist" });
      }
      
      // Get the columns in the users table
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'users');
      
      if (columnsError) {
        return res.status(500).json({ 
          message: "Error getting columns for users table", 
          error: columnsError 
        });
      }
      
      // Try to get a sample user
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      return res.json({
        tableExists: true,
        columns: columns?.map(col => col.column_name) || [],
        sampleUser: users && users.length > 0 ? users[0] : null,
        usersError: usersError
      });
    } catch (error) {
      console.error("Error in debug-users route:", error);
      res.status(500).json({ message: "Failed to debug users table", error });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Search through all routes for any paths with malformed parameters
  // Look for routes with a colon at the end or a colon not followed by a parameter name
  // For example, fix routes like '/api/env:' to '/api/env' or '/api/:' to '/api/:id'

  // Check all registered routes at the end of registerRoutes function
  console.log("Checking all registered routes for path-to-regexp issues...");
  if (app._router && app._router.stack) {
    app._router.stack.forEach((r: any) => {
      if (r.route && r.route.path) {
        const path = r.route.path;
        // Check for malformed parameters (colon without a name)
        if (path.includes(':') && !path.match(/\/:[a-zA-Z0-9_]+/)) {
          console.error(`MALFORMED ROUTE PARAMETER DETECTED: ${path}`);
          // Here we would fix the route, but we need to identify the specific problematic route first
        }
      }
    });
  }

  return httpServer;
}
