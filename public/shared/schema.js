import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
// User schema
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    full_name: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertUserSchema = createInsertSchema(users).pick({
    username: true,
    password: true,
    name: true,
    email: true,
    avatarUrl: true,
});
// Team schema
export const teams = pgTable("teams", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertTeamSchema = createInsertSchema(teams);
// User Team mapping
export const userTeams = pgTable("user_teams", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    teamId: integer("team_id").references(() => teams.id).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
});
export const insertUserTeamSchema = createInsertSchema(userTeams);
// Contact schema
export const contacts = pgTable("contacts", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    title: text("title"),
    company: text("company"),
    source: text("source").default("other").notNull(),
    status: text("status").default("lead").notNull(), // lead, customer, partner, inactive
    avatarUrl: text("avatar_url"),
    address: text("address"),
    notes: text("notes"),
    assignedTo: integer("assigned_to").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertContactSchema = createInsertSchema(contacts);
// Pipeline stages schema
export const pipelineStages = pgTable("pipeline_stages", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    order: integer("order").notNull(),
    color: text("color").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertPipelineStageSchema = createInsertSchema(pipelineStages);
// Deals schema
export const deals = pgTable("deals", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    value: decimal("value", { precision: 15, scale: 2 }).notNull(),
    stageId: integer("stage_id").references(() => pipelineStages.id).notNull(),
    contactId: integer("contact_id").references(() => contacts.id).notNull(),
    ownerId: integer("owner_id").references(() => users.id).notNull(),
    expectedCloseDate: timestamp("expected_close_date"),
    probability: integer("probability").default(50), // 0-100
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertDealSchema = createInsertSchema(deals);
// Tasks schema
export const tasks = pgTable("tasks", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date"),
    time: text("time"), // e.g. "9:00 AM - 10:00 AM"
    completed: boolean("completed").default(false).notNull(),
    priority: text("priority").default("medium").notNull(), // high, medium, low
    assigned_to: integer("assigned_to").references(() => users.id).notNull(),
    relatedToType: text("related_to_type"), // deal, contact
    relatedToId: integer("related_to_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertTaskSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().optional(),
    // Accept either a string (from form) or a Date object
    dueDate: z.union([z.string(), z.date()]).optional(),
    time: z.string().optional(),
    priority: z.enum(["high", "medium", "low"]),
    // Accept either assigned_to or assignedTo
    assigned_to: z.coerce.number().optional(),
    assignedTo: z.coerce.number().optional(),
}).transform(data => {
    // Ensure we have a valid assigned_to value
    if (data.assigned_to === undefined && data.assignedTo !== undefined) {
        data.assigned_to = data.assignedTo;
    }
    else if (data.assignedTo === undefined && data.assigned_to !== undefined) {
        data.assignedTo = data.assigned_to;
    }
    return data;
});
// Activities schema
export const activities = pgTable("activities", {
    id: serial("id").primaryKey(),
    type: text("type").notNull(), // email, call, meeting, note, update
    title: text("title").notNull(),
    description: text("description"),
    userId: integer("user_id").references(() => users.id).notNull(),
    relatedToType: text("related_to_type"), // deal, contact
    relatedToId: integer("related_to_id"),
    metadata: jsonb("metadata"), // For storing activity-specific data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    campaignId: integer("campaign_id").references(() => campaigns.id), // Optional link to a campaign
});
export const insertActivitySchema = createInsertSchema(activities).extend({
    campaignId: z.number().optional().nullable(),
});
export const activitiesRelations = relations(activities, ({ one }) => ({
    user: one(users, { fields: [activities.userId], references: [users.id] }),
    deal: one(deals, {
        fields: [activities.relatedToId],
        references: [deals.id],
        relationName: "dealActivities"
    }),
    contact: one(contacts, {
        fields: [activities.relatedToId],
        references: [contacts.id],
        relationName: "contactActivities"
    }),
    campaign: one(campaigns, { fields: [activities.campaignId], references: [campaigns.id] }),
}));
// Sales Performance Function
export const getSalesPerformanceData = sql `
  CREATE OR REPLACE FUNCTION public.get_sales_performance_data(p_period text)
  RETURNS jsonb
  LANGUAGE plpgsql
  AS $$
  DECLARE
    v_start_date timestamp;
    v_end_date timestamp;
    v_result jsonb;
  BEGIN
    -- Set date range based on period
    CASE p_period
      WHEN 'week' THEN
        v_start_date := date_trunc('week', current_date);
        v_end_date := date_trunc('week', current_date) + interval '1 week' - interval '1 day';
      WHEN 'month' THEN
        v_start_date := date_trunc('month', current_date);
        v_end_date := date_trunc('month', current_date) + interval '1 month' - interval '1 day';
      WHEN 'quarter' THEN
        v_start_date := date_trunc('quarter', current_date);
        v_end_date := date_trunc('quarter', current_date) + interval '3 months' - interval '1 day';
      WHEN 'year' THEN
        v_start_date := date_trunc('year', current_date);
        v_end_date := date_trunc('year', current_date) + interval '1 year' - interval '1 day';
      ELSE
        RAISE EXCEPTION 'Invalid period. Must be one of: week, month, quarter, year';
    END CASE;

    -- Get sales performance data
    SELECT jsonb_build_object(
      'total_deals', COUNT(*),
      'total_value', COALESCE(SUM(value), 0),
      'won_deals', COUNT(*) FILTER (WHERE stage_id = (SELECT id FROM pipeline_stages WHERE name = 'Closed Won')),
      'won_value', COALESCE(SUM(value) FILTER (WHERE stage_id = (SELECT id FROM pipeline_stages WHERE name = 'Closed Won')), 0),
      'avg_deal_size', COALESCE(AVG(value), 0),
      'conversion_rate', CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE stage_id = (SELECT id FROM pipeline_stages WHERE name = 'Closed Won'))::float / COUNT(*)::float) * 100, 2)
        ELSE 0
      END
    ) INTO v_result
    FROM deals
    WHERE created_at >= v_start_date
    AND created_at <= v_end_date;

    RETURN v_result;
  END;
  $$;
`;
// Sales Campaigns schema
export const campaigns = pgTable("campaigns", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    objective: text("objective"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    status: text("status").default("planning").notNull(), // planning, active, completed, cancelled
    ownerId: integer("owner_id").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    imageUrl: text("image_url"),
    tags: text("tags"),
    target_audience: text("target_audience"),
    associated_products: text("associated_products"),
    views: integer("views").default(0).notNull(),
    engagements: integer("engagements").default(0).notNull(),
    conversions: integer("conversions").default(0).notNull(),
});
export const insertCampaignSchema = createInsertSchema(campaigns);
// Campaign Targets schema (linking contacts to campaigns)
export const campaignTargets = pgTable("campaign_targets", {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
    contactId: integer("contact_id").references(() => contacts.id).notNull(),
    // Could add fields here for target segment details if needed
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertCampaignTargetSchema = createInsertSchema(campaignTargets);
// Campaign Strategies/Tactics schema
export const campaignStrategies = pgTable("campaign_strategies", {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
    type: text("type").notNull(), // e.g., 'email', 'event', 'promotion', 'personalized_messaging'
    description: text("description"),
    scheduleDate: timestamp("schedule_date"),
    // Could add more fields for specific strategy details
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertCampaignStrategySchema = createInsertSchema(campaignStrategies);
// Campaign Materials schema
export const campaignMaterials = pgTable("campaign_materials", {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
    name: text("name").notNull(),
    type: text("type"), // e.g., 'image', 'document', 'link'
    url: text("url").notNull(), // URL or path to the material
    // Could add fields for upload date, file size, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertCampaignMaterialSchema = createInsertSchema(campaignMaterials);
// Define relations
export const usersRelations = relations(users, ({ many }) => ({
    contacts: many(contacts, { relationName: "assignedContacts" }),
    deals: many(deals, { relationName: "ownedDeals" }),
    tasks: many(tasks, { relationName: "assignedTasks" }),
    activities: many(activities),
    teams: many(userTeams),
}));
export const teamsRelations = relations(teams, ({ many }) => ({
    users: many(userTeams),
}));
export const userTeamsRelations = relations(userTeams, ({ one }) => ({
    user: one(users, { fields: [userTeams.userId], references: [users.id] }),
    team: one(teams, { fields: [userTeams.teamId], references: [teams.id] }),
}));
export const contactsRelations = relations(contacts, ({ one, many }) => ({
    assignedUser: one(users, { fields: [contacts.assignedTo], references: [users.id], relationName: "assignedContacts" }),
    deals: many(deals),
}));
export const pipelineStagesRelations = relations(pipelineStages, ({ many }) => ({
    deals: many(deals),
}));
export const dealsRelations = relations(deals, ({ one, many }) => ({
    stage: one(pipelineStages, { fields: [deals.stageId], references: [pipelineStages.id] }),
    contact: one(contacts, { fields: [deals.contactId], references: [contacts.id] }),
    owner: one(users, { fields: [deals.ownerId], references: [users.id], relationName: "ownedDeals" }),
    tasks: many(tasks, { relationName: "dealTasks" }),
}));
export const tasksRelations = relations(tasks, ({ one }) => ({
    assignedUser: one(users, { fields: [tasks.assigned_to], references: [users.id], relationName: "assignedTasks" }),
    deal: one(deals, {
        fields: [tasks.relatedToId],
        references: [deals.id],
        relationName: "dealTasks"
    }),
    contact: one(contacts, {
        fields: [tasks.relatedToId],
        references: [contacts.id],
        relationName: "contactTasks"
    })
}));
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
    owner: one(users, { fields: [campaigns.ownerId], references: [users.id] }),
    campaignTargets: many(campaignTargets),
    campaignStrategies: many(campaignStrategies),
    campaignMaterials: many(campaignMaterials),
    activities: many(activities), // Activities related to this campaign
}));
export const campaignTargetsRelations = relations(campaignTargets, ({ one }) => ({
    campaign: one(campaigns, { fields: [campaignTargets.campaignId], references: [campaigns.id] }),
    contact: one(contacts, { fields: [campaignTargets.contactId], references: [contacts.id] }),
}));
export const campaignStrategiesRelations = relations(campaignStrategies, ({ one }) => ({
    campaign: one(campaigns, { fields: [campaignStrategies.campaignId], references: [campaigns.id] }),
}));
export const campaignMaterialsRelations = relations(campaignMaterials, ({ one }) => ({
    campaign: one(campaigns, { fields: [campaignMaterials.campaignId], references: [campaigns.id] }),
}));
