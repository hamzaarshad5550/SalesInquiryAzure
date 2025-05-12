import type { Express } from "express";
import { createServer, type Server } from "http";
// Import storage from the Supabase implementation instead
import { storage } from "./storage-supabase";
import { formatISO, subMonths, startOfMonth, endOfMonth, subYears } from "date-fns";
import {
  insertContactSchema,
  insertDealSchema,
  insertTaskSchema,
  insertActivitySchema,
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix for all routes
  const apiPrefix = "/api";

  // Current user placeholder (would be replaced by actual auth)
  app.get(`${apiPrefix}/users/current`, async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      res.json(currentUser);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch current user" });
    }
  });

  // Teams
  app.get(`${apiPrefix}/teams`, async (req, res) => {
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
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
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
      const user = req.query.user as string;
      const sort = req.query.sort as string;
      
      const filterUser = user !== 'all' ? parseInt(user) : undefined;
      
      const stages = await storage.getPipeline(filterUser, sort);
      const usersList = await storage.getAllUsers();
      
      res.json({ stages, users: usersList });
    } catch (error) {
      console.error("Error fetching pipeline:", error);
      res.status(500).json({ message: "Failed to fetch pipeline" });
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
      const search = req.query.search as string | undefined;
      // Implement a search function in storage later
      const tasksList = await db.select().from(tasksTable);
      res.json({ tasks: tasksList });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  
  // Get a single task
  app.get(`${apiPrefix}/tasks/:taskId`, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await db.query.tasks.findFirst({
        where: eq(tasksTable.id, taskId)
      });
      
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
  app.patch(`${apiPrefix}/tasks/:taskId`, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const taskData = insertTaskSchema.partial().parse(req.body);
      
      const [updatedTask] = await db.update(tasksTable)
        .set(taskData)
        .where(eq(tasksTable.id, taskId))
        .returning();
      
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
      
      const [deletedTask] = await db.delete(tasksTable)
        .where(eq(tasksTable.id, taskId))
        .returning();
      
      if (!deletedTask) {
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
  app.get(`${apiPrefix}/contacts/:contactId`, async (req, res) => {
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
  app.patch(`${apiPrefix}/contacts/:contactId`, async (req, res) => {
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
      const dealData = insertDealSchema.parse(req.body);
      const newDeal = await storage.createDeal(dealData);
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
      const taskData = insertTaskSchema.parse(req.body);
      const newTask = await storage.createTask(taskData);
      res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof ZodError) {
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
