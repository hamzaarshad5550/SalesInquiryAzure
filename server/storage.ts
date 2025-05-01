import { db } from "@db";
import { 
  users, 
  teams, 
  userTeams, 
  contacts, 
  pipelineStages, 
  deals, 
  tasks, 
  activities,
  type InsertContact,
  type InsertDeal,
  type InsertTask,
  type InsertActivity
} from "@shared/schema";
import { eq, desc, and, isNull, asc, sql, like, or, gte, lt, lte, between } from "drizzle-orm";
import { format, formatISO, subMonths, startOfMonth, endOfMonth, subYears, startOfDay, endOfDay } from "date-fns";

export const storage = {
  /**
   * Gets the current authenticated user (placeholder for auth)
   */
  async getCurrentUser() {
    const user = await db.query.users.findFirst({
      where: eq(users.id, 1) // Default to first user for demo
    });
    
    return user;
  },

  /**
   * Gets all teams
   */
  async getAllTeams() {
    const allTeams = await db.query.teams.findMany({
      orderBy: asc(teams.name)
    });
    
    return allTeams;
  },

  /**
   * Gets all users
   */
  async getAllUsers() {
    const allUsers = await db.query.users.findMany({
      orderBy: asc(users.name)
    });
    
    return allUsers;
  },

  /**
   * Gets dashboard metrics
   */
  async getDashboardMetrics() {
    // Current month revenue
    const currentMonth = new Date();
    const previousMonth = subMonths(currentMonth, 1);
    
    const currentMonthStart = startOfMonth(currentMonth);
    const currentMonthEnd = endOfMonth(currentMonth);
    const previousMonthStart = startOfMonth(previousMonth);
    const previousMonthEnd = endOfMonth(previousMonth);
    
    // Total revenue from deals that were closed this month
    const currentMonthRevenue = await db
      .select({ total: sql<number>`sum(${deals.value})` })
      .from(deals)
      .where(
        and(
          eq(deals.stageId, 5), // Assuming stage 5 is 'Closed Won'
          gte(deals.updatedAt, currentMonthStart),
          lte(deals.updatedAt, currentMonthEnd)
        )
      );
    
    // Total revenue from deals that were closed last month
    const previousMonthRevenue = await db
      .select({ total: sql<number>`sum(${deals.value})` })
      .from(deals)
      .where(
        and(
          eq(deals.stageId, 5), // Assuming stage 5 is 'Closed Won'
          gte(deals.updatedAt, previousMonthStart),
          lte(deals.updatedAt, previousMonthEnd)
        )
      );
    
    const totalRevenue = Number(currentMonthRevenue[0]?.total) || 0;
    const prevTotalRevenue = Number(previousMonthRevenue[0]?.total) || 0;
    
    // Calculate percent change
    const totalRevenueChange = prevTotalRevenue === 0 
      ? 0 
      : Number(((totalRevenue - prevTotalRevenue) / prevTotalRevenue * 100).toFixed(1));
    
    // Active deals count
    const activeDealsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(
        and(
          gte(deals.stageId, 1),
          lt(deals.stageId, 5) // Not including Closed Won or Lost
        )
      );
    
    // Previous month active deals
    const prevActiveDealsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(
        and(
          gte(deals.stageId, 1),
          lt(deals.stageId, 5),
          gte(deals.updatedAt, previousMonthStart),
          lte(deals.updatedAt, previousMonthEnd)
        )
      );
    
    const activeDeals = Number(activeDealsCount[0]?.count) || 0;
    const prevActiveDeals = Number(prevActiveDealsCount[0]?.count) || 0;
    
    const activeDealsChange = prevActiveDeals === 0 
      ? 0 
      : Number(((activeDeals - prevActiveDeals) / prevActiveDeals * 100).toFixed(1));
    
    // Conversion rate (closed won deals / total closed deals)
    const closedDeals = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(
        and(
          gte(deals.updatedAt, currentMonthStart),
          lte(deals.updatedAt, currentMonthEnd),
          or(
            eq(deals.stageId, 5), // Closed Won
            eq(deals.stageId, 6)  // Closed Lost
          )
        )
      );
    
    const closedWonDeals = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(
        and(
          gte(deals.updatedAt, currentMonthStart),
          lte(deals.updatedAt, currentMonthEnd),
          eq(deals.stageId, 5) // Closed Won
        )
      );
    
    // Previous month conversion
    const prevClosedDeals = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(
        and(
          gte(deals.updatedAt, previousMonthStart),
          lte(deals.updatedAt, previousMonthEnd),
          or(
            eq(deals.stageId, 5), // Closed Won
            eq(deals.stageId, 6)  // Closed Lost
          )
        )
      );
    
    const prevClosedWonDeals = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(
        and(
          gte(deals.updatedAt, previousMonthStart),
          lte(deals.updatedAt, previousMonthEnd),
          eq(deals.stageId, 5) // Closed Won
        )
      );
    
    const totalClosed = Number(closedDeals[0]?.count) || 0;
    const totalClosedWon = Number(closedWonDeals[0]?.count) || 0;
    
    const prevTotalClosed = Number(prevClosedDeals[0]?.count) || 0;
    const prevTotalClosedWon = Number(prevClosedWonDeals[0]?.count) || 0;
    
    const conversionRate = totalClosed === 0 
      ? 0 
      : Number((totalClosedWon / totalClosed * 100).toFixed(1));
    
    const prevConversionRate = prevTotalClosed === 0 
      ? 0 
      : Number((prevTotalClosedWon / prevTotalClosed * 100).toFixed(1));
    
    const conversionRateChange = prevConversionRate === 0 
      ? 0 
      : Number(((conversionRate - prevConversionRate) / prevConversionRate * 100).toFixed(1));
    
    // New contacts this month
    const newContacts = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(
        and(
          gte(contacts.createdAt, currentMonthStart),
          lte(contacts.createdAt, currentMonthEnd)
        )
      );
    
    // New contacts last month
    const prevNewContacts = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(
        and(
          gte(contacts.createdAt, previousMonthStart),
          lte(contacts.createdAt, previousMonthEnd)
        )
      );
    
    const newContactsCount = Number(newContacts[0]?.count) || 0;
    const prevNewContactsCount = Number(prevNewContacts[0]?.count) || 0;
    
    const newContactsChange = prevNewContactsCount === 0 
      ? 0 
      : Number(((newContactsCount - prevNewContactsCount) / prevNewContactsCount * 100).toFixed(1));
    
    return {
      totalRevenue,
      totalRevenueChange,
      activeDeals,
      activeDealsChange,
      conversionRate,
      conversionRateChange,
      newContacts: newContactsCount,
      newContactsChange
    };
  },

  /**
   * Gets sales performance data for charts
   */
  async getSalesPerformanceData(period: string) {
    const now = new Date();
    let salesData = [];
    
    if (period === 'monthly') {
      // Get last 8 months of data
      for (let i = 7; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthRevenue = await db
          .select({ total: sql<number>`sum(${deals.value})` })
          .from(deals)
          .where(
            and(
              eq(deals.stageId, 5), // Closed Won
              gte(deals.updatedAt, monthStart),
              lte(deals.updatedAt, monthEnd)
            )
          );
        
        salesData.push({
          name: format(monthDate, 'MMM'),
          value: Number(monthRevenue[0]?.total) || 0
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
        
        const quarterRevenue = await db
          .select({ total: sql<number>`sum(${deals.value})` })
          .from(deals)
          .where(
            and(
              eq(deals.stageId, 5), // Closed Won
              gte(deals.updatedAt, quarterStart),
              lte(deals.updatedAt, quarterEnd)
            )
          );
        
        const quarterName = `Q${4 - i}`;
        
        salesData.push({
          name: quarterName,
          value: Number(quarterRevenue[0]?.total) || 0
        });
      }
    } else if (period === 'yearly') {
      // Get last 5 years
      for (let i = 4; i >= 0; i--) {
        const yearDate = subYears(now, i);
        const yearStart = new Date(yearDate.getFullYear(), 0, 1);
        const yearEnd = new Date(yearDate.getFullYear(), 11, 31);
        
        const yearRevenue = await db
          .select({ total: sql<number>`sum(${deals.value})` })
          .from(deals)
          .where(
            and(
              eq(deals.stageId, 5), // Closed Won
              gte(deals.updatedAt, yearStart),
              lte(deals.updatedAt, yearEnd)
            )
          );
        
        salesData.push({
          name: format(yearDate, 'yyyy'),
          value: Number(yearRevenue[0]?.total) || 0
        });
      }
    }
    
    return salesData;
  },

  /**
   * Gets pipeline overview data for dashboard
   */
  async getPipelineOverview() {
    const pipelineData = await db.query.pipelineStages.findMany({
      orderBy: asc(pipelineStages.order),
      with: {
        deals: {
          orderBy: desc(deals.updatedAt),
          limit: 5,
          with: {
            owner: true
          }
        }
      }
    });
    
    // Calculate total value for each stage
    const stagesWithTotals = await Promise.all(
      pipelineData.map(async (stage) => {
        const stageDeals = await db
          .select({ total: sql<number>`sum(${deals.value})` })
          .from(deals)
          .where(eq(deals.stageId, stage.id));
        
        return {
          id: stage.id,
          name: stage.name,
          color: stage.color,
          order: stage.order,
          totalValue: Number(stageDeals[0]?.total) || 0,
          deals: stage.deals.map(deal => ({
            id: String(deal.id),
            name: deal.name,
            value: Number(deal.value),
            description: deal.description || "",
            updatedAt: deal.updatedAt.toISOString(),
            owner: {
              id: String(deal.owner.id),
              name: deal.owner.name,
              avatarUrl: deal.owner.avatarUrl
            }
          }))
        };
      })
    );
    
    return stagesWithTotals;
  },

  /**
   * Gets full pipeline with filtering options
   */
  async getPipeline(filterUserId?: number, sortBy: string = 'updated') {
    const pipelineData = await db.query.pipelineStages.findMany({
      orderBy: asc(pipelineStages.order)
    });
    
    const stagesWithDeals = await Promise.all(
      pipelineData.map(async (stage) => {
        let dealsQuery = db
          .select()
          .from(deals)
          .where(eq(deals.stageId, stage.id))
          .innerJoin(users, eq(deals.ownerId, users.id));
        
        // Apply user filter if specified
        if (filterUserId) {
          dealsQuery = dealsQuery.where(eq(deals.ownerId, filterUserId));
        }
        
        // Apply sorting
        switch (sortBy) {
          case 'value-desc':
            dealsQuery = dealsQuery.orderBy(desc(deals.value));
            break;
          case 'value-asc':
            dealsQuery = dealsQuery.orderBy(asc(deals.value));
            break;
          case 'name':
            dealsQuery = dealsQuery.orderBy(asc(deals.name));
            break;
          case 'updated':
          default:
            dealsQuery = dealsQuery.orderBy(desc(deals.updatedAt));
        }
        
        const stageDeals = await dealsQuery;
        
        // Calculate total value for this stage
        const stageTotalValue = stageDeals.reduce(
          (sum, deal) => sum + Number(deal.deals.value), 
          0
        );
        
        return {
          id: stage.id,
          name: stage.name,
          color: stage.color,
          order: stage.order,
          totalValue: stageTotalValue,
          deals: stageDeals.map(dealData => ({
            id: String(dealData.deals.id),
            name: dealData.deals.name,
            value: Number(dealData.deals.value),
            description: dealData.deals.description || "",
            updatedAt: dealData.deals.updatedAt.toISOString(),
            owner: {
              id: String(dealData.users.id),
              name: dealData.users.name,
              avatarUrl: dealData.users.avatarUrl
            }
          }))
        };
      })
    );
    
    return stagesWithDeals;
  },

  /**
   * Gets today's tasks for the current user
   */
  async getTodaysTasks() {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    const todaysTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          // For demo, get all tasks or tasks assigned to user 1
          eq(tasks.assignedTo, 1),
          between(tasks.dueDate, startOfToday, endOfToday)
        )
      )
      .orderBy(asc(tasks.time), asc(tasks.createdAt));
    
    return todaysTasks.map(task => ({
      id: String(task.id),
      title: task.title,
      completed: task.completed,
      dueDate: task.dueDate?.toISOString() || '',
      time: task.time || '',
      priority: task.priority
    }));
  },

  /**
   * Toggles a task's completion status
   */
  async toggleTaskCompletion(taskId: number) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId)
    });
    
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const updatedTask = await db
      .update(tasks)
      .set({ 
        completed: !task.completed,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId))
      .returning();
    
    if (updatedTask.length === 0) {
      throw new Error(`Failed to update task with ID ${taskId}`);
    }
    
    return updatedTask[0];
  },

  /**
   * Gets recent contacts (last added or updated)
   */
  async getRecentContacts() {
    const recentContacts = await db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.updatedAt))
      .limit(4);
    
    return recentContacts.map(contact => ({
      id: String(contact.id),
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      title: contact.title || '',
      company: contact.company || '',
      avatarUrl: contact.avatarUrl,
      status: contact.status
    }));
  },

  /**
   * Gets all contacts with optional search
   */
  async getContacts(search?: string) {
    let contactsQuery = db.select().from(contacts);
    
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      contactsQuery = contactsQuery.where(
        or(
          like(contacts.name, searchTerm),
          like(contacts.email, searchTerm),
          like(contacts.company, searchTerm),
          like(contacts.title, searchTerm)
        )
      );
    }
    
    const allContacts = await contactsQuery.orderBy(asc(contacts.name));
    
    return allContacts.map(contact => ({
      id: String(contact.id),
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      title: contact.title || '',
      company: contact.company || '',
      avatarUrl: contact.avatarUrl,
      status: contact.status
    }));
  },

  /**
   * Gets recent activities
   */
  async getRecentActivities() {
    const recentActivities = await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(5);
    
    return recentActivities.map(activity => ({
      id: String(activity.id),
      type: activity.type,
      title: activity.title,
      description: activity.description || '',
      timestamp: activity.createdAt.toISOString()
    }));
  },

  /**
   * Gets a single contact by ID
   */
  async getContactById(contactId: number) {
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId)
    });
    
    return contact;
  },

  /**
   * Creates a new contact
   */
  async createContact(contactData: InsertContact) {
    const newContact = await db
      .insert(contacts)
      .values({
        ...contactData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newContact[0];
  },
  
  /**
   * Updates an existing contact
   */
  async updateContact(contactId: number, contactData: Partial<InsertContact>) {
    // First check if contact exists
    const existingContact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId)
    });
    
    if (!existingContact) {
      return null;
    }
    
    // Update the contact
    const updatedContact = await db
      .update(contacts)
      .set({ 
        ...contactData,
        updatedAt: new Date()
      })
      .where(eq(contacts.id, contactId))
      .returning();
    
    return updatedContact[0];
  },
  
  /**
   * Deletes a contact
   */
  async deleteContact(contactId: number) {
    // First check if contact exists
    const existingContact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId)
    });
    
    if (!existingContact) {
      return false;
    }
    
    // Delete the contact
    await db
      .delete(contacts)
      .where(eq(contacts.id, contactId));
    
    return true;
  },

  /**
   * Creates a new deal
   */
  async createDeal(dealData: InsertDeal) {
    const newDeal = await db
      .insert(deals)
      .values({
        ...dealData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newDeal[0];
  },

  /**
   * Updates a deal's stage
   */
  async updateDealStage(dealId: number, stageId: number) {
    const updatedDeal = await db
      .update(deals)
      .set({ 
        stageId: stageId,
        updatedAt: new Date()
      })
      .where(eq(deals.id, dealId))
      .returning();
    
    if (updatedDeal.length === 0) {
      throw new Error(`Failed to update deal with ID ${dealId}`);
    }
    
    return updatedDeal[0];
  },

  /**
   * Creates a new task
   */
  async createTask(taskData: InsertTask) {
    const newTask = await db
      .insert(tasks)
      .values({
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newTask[0];
  },

  /**
   * Creates a new activity
   */
  async createActivity(activityData: InsertActivity) {
    const newActivity = await db
      .insert(activities)
      .values({
        ...activityData,
        createdAt: new Date()
      })
      .returning();
    
    return newActivity[0];
  }
};
