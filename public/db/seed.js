"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const schema = __importStar(require("@shared/schema"));
const date_fns_1 = require("date-fns");
async function seed() {
    try {
        console.log("🌱 Starting database seeding...");
        // Create users
        const usersData = [
            {
                username: "sarah.johnson",
                password: "$2b$10$dJkqZ8NJDe.lIzhvbR.lKuF9g/UOxHWweaEMYgVLe/AqzYlGcVBXe", // hashed password
                name: "Sarah Johnson",
                full_name: "Sarah Johnson",
                email: "sarah.j@company.com",
                avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            },
            {
                username: "david.kim",
                password: "$2b$10$dJkqZ8NJDe.lIzhvbR.lKuF9g/UOxHWweaEMYgVLe/AqzYlGcVBXe",
                name: "David Kim",
                full_name: "David Kim",
                email: "david.k@company.com",
                avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            },
            {
                username: "michael.rodriguez",
                password: "$2b$10$dJkqZ8NJDe.lIzhvbR.lKuF9g/UOxHWweaEMYgVLe/AqzYlGcVBXe",
                name: "Michael Rodriguez",
                full_name: "Michael Rodriguez",
                email: "michael.r@company.com",
                avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            },
            {
                username: "emily.chen",
                password: "$2b$10$dJkqZ8NJDe.lIzhvbR.lKuF9g/UOxHWweaEMYgVLe/AqzYlGcVBXe",
                name: "Emily Chen",
                full_name: "Emily Chen",
                email: "emily.c@company.com",
                avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            }
        ];
        // Check if users already exist to avoid duplicates
        const existingUsers = await index_1.db.query.users.findMany();
        if (existingUsers.length === 0) {
            console.log("Creating users...");
            for (const userData of usersData) {
                await index_1.db.insert(schema.users).values({
                    ...userData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        else {
            console.log("Users already exist, skipping creation");
        }
        // Create teams
        const teamsData = [
            { name: "Sales", color: "hsl(var(--secondary))" },
            { name: "Marketing", color: "hsl(var(--accent))" },
            { name: "Support", color: "hsl(var(--success))" }
        ];
        // Check if teams already exist
        const existingTeams = await index_1.db.query.teams.findMany();
        if (existingTeams.length === 0) {
            console.log("Creating teams...");
            for (const teamData of teamsData) {
                await index_1.db.insert(schema.teams).values({
                    ...teamData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        else {
            console.log("Teams already exist, skipping creation");
        }
        // Create user-team assignments
        if (existingUsers.length > 0 && existingTeams.length > 0) {
            const existingUserTeams = await index_1.db.query.userTeams.findMany();
            if (existingUserTeams.length === 0) {
                console.log("Creating user-team assignments...");
                const users = await index_1.db.query.users.findMany();
                const teams = await index_1.db.query.teams.findMany();
                // Assign users to teams
                const userTeamAssignments = [
                    { userId: users[0].id, teamId: teams[0].id, isAdmin: true },
                    { userId: users[1].id, teamId: teams[0].id, isAdmin: false },
                    { userId: users[2].id, teamId: teams[1].id, isAdmin: true },
                    { userId: users[3].id, teamId: teams[2].id, isAdmin: true }
                ];
                for (const assignment of userTeamAssignments) {
                    await index_1.db.insert(schema.userTeams).values(assignment);
                }
            }
            else {
                console.log("User-team assignments already exist, skipping creation");
            }
        }
        // Create pipeline stages
        const pipelineStagesData = [
            { name: "Lead", order: 1, color: "blue" },
            { name: "Qualified", order: 2, color: "indigo" },
            { name: "Proposal", order: 3, color: "purple" },
            { name: "Negotiation", order: 4, color: "amber" },
            { name: "Closed Won", order: 5, color: "green" }
        ];
        // Check if pipeline stages already exist
        const existingStages = await index_1.db.query.pipelineStages.findMany();
        if (existingStages.length === 0) {
            console.log("Creating pipeline stages...");
            for (const stageData of pipelineStagesData) {
                await index_1.db.insert(schema.pipelineStages).values({
                    ...stageData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        else {
            console.log("Pipeline stages already exist, skipping creation");
        }
        // Create contacts
        const contactsData = [
            {
                name: "David Kim",
                email: "david.kim@techvision.com",
                phone: "+1 (555) 123-4567",
                title: "Technology Director",
                company: "TechVision Corp",
                source: "website",
                status: "active",
                avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                assignedTo: 1
            },
            {
                name: "Sarah Johnson",
                email: "sarah.j@innosolutions.co",
                phone: "+1 (555) 234-5678",
                title: "Marketing Director",
                company: "InnoSolutions",
                source: "referral",
                status: "active",
                avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                assignedTo: 2
            },
            {
                name: "Michael Rodriguez",
                email: "m.rodriguez@acmeinc.com",
                phone: "+1 (555) 345-6789",
                title: "CEO",
                company: "Acme Inc.",
                source: "linkedin",
                status: "lead",
                avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                assignedTo: 3
            },
            {
                name: "Emily Chen",
                email: "e.chen@nextgenretail.com",
                phone: "+1 (555) 456-7890",
                title: "CTO",
                company: "NextGen Retail",
                source: "event",
                status: "customer",
                avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                assignedTo: 1
            },
            {
                name: "James Wilson",
                email: "j.wilson@globalmart.com",
                phone: "+1 (555) 567-8901",
                title: "Procurement Manager",
                company: "GlobalMart",
                source: "website",
                status: "active",
                avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                assignedTo: 2
            },
            {
                name: "Alex Turner",
                email: "alex.t@techcorp.co",
                phone: "+1 (555) 678-9012",
                title: "IT Manager",
                company: "TechCorp",
                source: "referral",
                status: "lead",
                avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                assignedTo: 3
            }
        ];
        // Check if contacts already exist
        const existingContacts = await index_1.db.query.contacts.findMany();
        if (existingContacts.length === 0) {
            console.log("Creating contacts...");
            for (const contactData of contactsData) {
                await index_1.db.insert(schema.contacts).values({
                    ...contactData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        else {
            console.log("Contacts already exist, skipping creation");
        }
        // Create deals
        const stages = await index_1.db.query.pipelineStages.findMany({ orderBy: (pipelineStages, { asc }) => [asc(pipelineStages.order)] });
        const contacts = await index_1.db.query.contacts.findMany();
        const users = await index_1.db.query.users.findMany();
        if (stages.length > 0 && contacts.length > 0 && users.length > 0) {
            const existingDeals = await index_1.db.query.deals.findMany();
            if (existingDeals.length === 0) {
                console.log("Creating deals...");
                const dealsData = [
                    // Lead stage
                    {
                        name: "Acme Inc.",
                        description: "Website redesign project",
                        value: 3400,
                        stageId: stages[0].id,
                        contactId: contacts.find(c => c.company === "Acme Inc.")?.id || contacts[0].id,
                        ownerId: users[0].id,
                        expectedCloseDate: (0, date_fns_1.addDays)(new Date(), 30),
                        probability: 20,
                        createdAt: (0, date_fns_1.subDays)(new Date(), 2),
                        updatedAt: (0, date_fns_1.subDays)(new Date(), 2)
                    },
                    {
                        name: "TechCorp",
                        description: "Cloud migration solution",
                        value: 5200,
                        stageId: stages[0].id,
                        contactId: contacts.find(c => c.company === "TechCorp")?.id || contacts[1].id,
                        ownerId: users[1].id,
                        expectedCloseDate: (0, date_fns_1.addDays)(new Date(), 45),
                        probability: 30,
                        createdAt: (0, date_fns_1.subDays)(new Date(), 5),
                        updatedAt: (0, date_fns_1.subDays)(new Date(), 5)
                    },
                    // Qualified stage
                    {
                        name: "GlobalMart",
                        description: "Inventory management system",
                        value: 12500,
                        stageId: stages[1].id,
                        contactId: contacts.find(c => c.company === "GlobalMart")?.id || contacts[2].id,
                        ownerId: users[0].id,
                        expectedCloseDate: (0, date_fns_1.addDays)(new Date(), 60),
                        probability: 40,
                        createdAt: (0, date_fns_1.subDays)(new Date(), 1),
                        updatedAt: (0, date_fns_1.subDays)(new Date(), 1)
                    },
                    // Proposal stage
                    {
                        name: "InnoSolutions",
                        description: "AI chatbot implementation",
                        value: 18900,
                        stageId: stages[2].id,
                        contactId: contacts.find(c => c.company === "InnoSolutions")?.id || contacts[3].id,
                        ownerId: users[1].id,
                        expectedCloseDate: (0, date_fns_1.addDays)(new Date(), 15),
                        probability: 60,
                        createdAt: (0, date_fns_1.subDays)(new Date(), 1),
                        updatedAt: (0, date_fns_1.subDays)(new Date(), 1)
                    },
                    // Negotiation stage
                    {
                        name: "TechVision Corp",
                        description: "Enterprise CRM solution",
                        value: 35600,
                        stageId: stages[3].id,
                        contactId: contacts.find(c => c.company === "TechVision Corp")?.id || contacts[0].id,
                        ownerId: users[2].id,
                        expectedCloseDate: (0, date_fns_1.addDays)(new Date(), 10),
                        probability: 80,
                        createdAt: (0, date_fns_1.subDays)(new Date(), 3),
                        updatedAt: (0, date_fns_1.subDays)(new Date(), 3)
                    },
                    // Closed Won stage
                    {
                        name: "NextGen Retail",
                        description: "POS system upgrade",
                        value: 24500,
                        stageId: stages[4].id,
                        contactId: contacts.find(c => c.company === "NextGen Retail")?.id || contacts[1].id,
                        ownerId: users[0].id,
                        expectedCloseDate: (0, date_fns_1.subDays)(new Date(), 7),
                        probability: 100,
                        createdAt: (0, date_fns_1.subDays)(new Date(), 14),
                        updatedAt: (0, date_fns_1.subDays)(new Date(), 7)
                    }
                ];
                for (const dealData of dealsData) {
                    await index_1.db.insert(schema.deals).values(dealData);
                }
            }
            else {
                console.log("Deals already exist, skipping creation");
            }
        }
        // Create tasks
        const existingTasks = await index_1.db.query.tasks.findMany();
        if (existingTasks.length === 0) {
            console.log("Creating tasks...");
            const users = await index_1.db.query.users.findMany();
            const deals = await index_1.db.query.deals.findMany();
            if (users.length > 0 && deals.length > 0) {
                const today = new Date();
                const tasksData = [
                    {
                        title: "Call with InnoSolutions about proposal",
                        description: "Discuss pricing and implementation timeline",
                        dueDate: today,
                        time: "11:30 - 12:00",
                        completed: false,
                        priority: "high",
                        assignedTo: users[0].id,
                        relatedToType: "deal",
                        relatedToId: deals.find(d => d.name === "InnoSolutions")?.id || deals[0].id
                    },
                    {
                        title: "Prepare presentation for TechVision Corp",
                        description: "Focus on enterprise features and scalability",
                        dueDate: today,
                        time: "14:00 - 15:30",
                        completed: false,
                        priority: "medium",
                        assignedTo: users[0].id,
                        relatedToType: "deal",
                        relatedToId: deals.find(d => d.name === "TechVision Corp")?.id || deals[1].id
                    },
                    {
                        title: "Follow up with Acme Inc. about website project",
                        description: "Send updated timeline and resource allocation",
                        dueDate: today,
                        time: "16:00 - 16:30",
                        completed: false,
                        priority: "low",
                        assignedTo: users[0].id,
                        relatedToType: "deal",
                        relatedToId: deals.find(d => d.name === "Acme Inc.")?.id || deals[2].id
                    },
                    {
                        title: "Update CRM data for GlobalMart",
                        description: "Add new contacts and update deal status",
                        dueDate: (0, date_fns_1.addDays)(today, 1),
                        time: "10:00 - 11:00",
                        completed: false,
                        priority: "medium",
                        assignedTo: users[1].id,
                        relatedToType: "deal",
                        relatedToId: deals.find(d => d.name === "GlobalMart")?.id || deals[3].id
                    }
                ];
                for (const taskData of tasksData) {
                    await index_1.db.insert(schema.tasks).values({
                        ...taskData,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }
        }
        else {
            console.log("Tasks already exist, skipping creation");
        }
        // Create activities
        const existingActivities = await index_1.db.query.activities.findMany();
        if (existingActivities.length === 0) {
            console.log("Creating activities...");
            const users = await index_1.db.query.users.findMany();
            const deals = await index_1.db.query.deals.findMany();
            const contacts = await index_1.db.query.contacts.findMany();
            if (users.length > 0 && deals.length > 0 && contacts.length > 0) {
                const now = new Date();
                const activitiesData = [
                    {
                        type: "email",
                        title: "Email sent",
                        description: "to Michael Rodriguez about website project proposal",
                        userId: users[0].id,
                        relatedToType: "contact",
                        relatedToId: contacts.find(c => c.name === "Michael Rodriguez")?.id || contacts[0].id,
                        createdAt: (0, date_fns_1.subDays)(now, 0, 30) // 30 minutes ago
                    },
                    {
                        type: "call",
                        title: "Call completed",
                        description: "with Sarah Johnson from InnoSolutions",
                        userId: users[0].id,
                        relatedToType: "contact",
                        relatedToId: contacts.find(c => c.name === "Sarah Johnson")?.id || contacts[1].id,
                        createdAt: (0, date_fns_1.subDays)(now, 0, 120) // 2 hours ago
                    },
                    {
                        type: "update",
                        title: "Proposal updated",
                        description: "for TechVision Corp's CRM project",
                        userId: users[0].id,
                        relatedToType: "deal",
                        relatedToId: deals.find(d => d.name === "TechVision Corp")?.id || deals[0].id,
                        createdAt: (0, date_fns_1.subDays)(now, 1) // Yesterday
                    },
                    {
                        type: "meeting",
                        title: "Meeting scheduled",
                        description: "with GlobalMart team for next week",
                        userId: users[1].id,
                        relatedToType: "deal",
                        relatedToId: deals.find(d => d.name === "GlobalMart")?.id || deals[1].id,
                        createdAt: (0, date_fns_1.subDays)(now, 2) // 2 days ago
                    },
                    {
                        type: "note",
                        title: "Note added",
                        description: "regarding NextGen Retail implementation timeline",
                        userId: users[2].id,
                        relatedToType: "deal",
                        relatedToId: deals.find(d => d.name === "NextGen Retail")?.id || deals[2].id,
                        createdAt: (0, date_fns_1.subDays)(now, 3) // 3 days ago
                    }
                ];
                for (const activityData of activitiesData) {
                    await index_1.db.insert(schema.activities).values(activityData);
                }
            }
        }
        else {
            console.log("Activities already exist, skipping creation");
        }
        console.log("✅ Database seeding completed successfully!");
    }
    catch (error) {
        console.error("Error seeding database:", error);
    }
}
seed();
