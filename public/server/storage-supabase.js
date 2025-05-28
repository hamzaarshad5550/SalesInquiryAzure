var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { format, subMonths, startOfMonth, endOfMonth, subYears } from "date-fns";
import { supabase } from "./supabase";
// Helper functions for common query patterns
const handleError = (error, operation) => {
    console.error(`Error in ${operation}:`, error);
    // Log more details if it's a Supabase error
    if (error.code && error.message) {
        console.error(`Supabase error (${error.code}): ${error.message}`);
        if (error.details)
            console.error(`Details: ${error.details}`);
        if (error.hint)
            console.error(`Hint: ${error.hint}`);
    }
    throw new Error(`Failed to execute ${operation}`);
};
export const storage = {
    /**
     * Gets the current authenticated user (placeholder for auth)
     */
    getCurrentUser() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield supabase
                    .from('users')
                    .select('*')
                    .eq('id', 1) // Default to first user for demo
                    .single();
                if (error)
                    throw error;
                return data;
            }
            catch (error) {
                handleError(error, 'getCurrentUser');
            }
        });
    },
    /**
     * Gets all teams
     */
    getAllTeams() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield supabase
                    .from('teams')
                    .select('*')
                    .order('name', { ascending: true });
                if (error)
                    throw error;
                return data || [];
            }
            catch (error) {
                handleError(error, 'getAllTeams');
                return [];
            }
        });
    },
    /**
     * Gets all users
     */
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data: users, error } = yield supabase
                    .from('users')
                    .select('*');
                if (error) {
                    console.error("Error fetching users:", error);
                    return [{ id: 1, name: "Default User" }];
                }
                if (!users || users.length === 0) {
                    console.log("No users found, returning default user");
                    return [{ id: 1, name: "Default User" }];
                }
                // Log the first user to see its structure
                if (users.length > 0) {
                    console.log("First user structure:", Object.keys(users[0]));
                    console.log("First user data:", users[0]);
                }
                // Format users to ensure they have a name property
                const formattedUsers = users.map(user => {
                    // Determine the best name to use
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
            }
            catch (error) {
                console.error("Error in getUsers:", error);
                return [{ id: 1, name: "Default User" }];
            }
        });
    },
    /**
     * Gets dashboard metrics
     */
    getDashboardMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get deals for metrics
                const { data: deals, error: dealsError } = yield supabase
                    .from('deals')
                    .select('*');
                if (dealsError)
                    throw dealsError;
                // Get contacts for metrics
                const { data: contacts, error: contactsError } = yield supabase
                    .from('contacts')
                    .select('*');
                if (contactsError)
                    throw contactsError;
                // Calculate metrics manually
                const now = new Date();
                const oneMonthAgo = subMonths(now, 1);
                const totalDeals = (deals === null || deals === void 0 ? void 0 : deals.length) || 0;
                const pipelineValue = (deals === null || deals === void 0 ? void 0 : deals.filter((deal) => new Date(deal.expected_close_date || '') >= now).reduce((sum, deal) => sum + Number(deal.value), 0)) || 0;
                // Use 'stage' instead of 'stage' if that's what exists in the database
                const wonDeals = (deals === null || deals === void 0 ? void 0 : deals.filter((deal) => deal.stage === 5 || deal.stage === 5).length) || 0;
                const wonValue = (deals === null || deals === void 0 ? void 0 : deals.filter((deal) => deal.stage === 5 || deal.stage === 5).reduce((sum, deal) => sum + Number(deal.value), 0)) || 0;
                const totalContacts = (contacts === null || contacts === void 0 ? void 0 : contacts.length) || 0;
                const newContacts = (contacts === null || contacts === void 0 ? void 0 : contacts.filter((contact) => new Date(contact.created_at) >= oneMonthAgo).length) || 0;
                return {
                    totalDeals,
                    pipelineValue,
                    wonDeals,
                    wonValue,
                    totalContacts,
                    newContacts
                };
            }
            catch (error) {
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
        });
    },
    /**
     * Gets sales performance data for charts
     */
    getSalesPerformanceData(period) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if Supabase client is initialized
                if (!supabase) {
                    console.error("Supabase client is not initialized");
                    return [];
                }
                // Get all the deals data at once to avoid multiple API calls
                const { data: allDeals, error } = yield supabase
                    .from('deals')
                    .select('*')
                    .or(`stage.eq.5,stage.eq.5`); // Try both column names for Closed Won
                if (error) {
                    console.error("Supabase query error:", error);
                    return [];
                }
                // If no deals found, return empty array with sample data for development
                if (!allDeals || allDeals.length === 0) {
                    console.log("No deals found, returning sample data");
                    return [
                        { name: 'Jan', current: 5000, previous: 4200 },
                        { name: 'Feb', current: 7800, previous: 6800 },
                        { name: 'Mar', current: 4900, previous: 5100 },
                        { name: 'Apr', current: 9000, previous: 7200 },
                        { name: 'May', current: 8100, previous: 7000 },
                        { name: 'Jun', current: 10500, previous: 8300 }
                    ];
                }
                const now = new Date();
                let salesData = [];
                if (period === 'monthly') {
                    // Get last 8 months of data
                    for (let i = 7; i >= 0; i--) {
                        const monthDate = subMonths(now, i);
                        const monthStart = startOfMonth(monthDate);
                        const monthEnd = endOfMonth(monthDate);
                        // Filter deals closed in this month
                        const monthDeals = allDeals.filter((deal) => {
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
                }
                else if (period === 'quarterly') {
                    // Get last 4 quarters
                    for (let i = 3; i >= 0; i--) {
                        const quarterStartMonth = i * 3;
                        const startDate = subMonths(now, quarterStartMonth + 2);
                        const endDate = subMonths(now, quarterStartMonth);
                        const quarterStart = startOfMonth(startDate);
                        const quarterEnd = endOfMonth(endDate);
                        // Filter deals closed in this quarter
                        const quarterDeals = allDeals.filter((deal) => {
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
                }
                else if (period === 'yearly') {
                    // Get last 5 years of data
                    for (let i = 4; i >= 0; i--) {
                        const yearDate = subYears(now, i);
                        const yearStart = new Date(yearDate.getFullYear(), 0, 1);
                        const yearEnd = new Date(yearDate.getFullYear(), 11, 31, 23, 59, 59);
                        // Filter deals closed in this year
                        const yearDeals = allDeals.filter((deal) => {
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
            }
            catch (error) {
                console.error("Error in getSalesPerformanceData:", error);
                // Return sample data as fallback
                return [
                    { name: 'Jan', current: 5000, previous: 4200 },
                    { name: 'Feb', current: 7800, previous: 6800 },
                    { name: 'Mar', current: 4900, previous: 5100 },
                    { name: 'Apr', current: 9000, previous: 7200 },
                    { name: 'May', current: 8100, previous: 7000 },
                    { name: 'Jun', current: 10500, previous: 8300 }
                ];
            }
        });
    },
    /**
     * Gets pipeline overview data for dashboard
     */
    getPipelineOverview() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if the pipeline_stages table exists
                const { error: tableCheckError } = yield supabase
                    .from('pipeline_stages')
                    .select('count')
                    .limit(1);
                // If table doesn't exist, return sample data
                if (tableCheckError && tableCheckError.code === '42P01') {
                    console.log("pipeline_stages table doesn't exist, returning sample data");
                    return [
                        {
                            id: 1,
                            name: "Lead",
                            color: "#6366F1",
                            order: 1,
                            deals: [
                                { id: 1, title: "Sample Deal 1", value: 5000, owner: { name: "Demo User" } },
                                { id: 2, title: "Sample Deal 2", value: 7500, owner: { name: "Demo User" } }
                            ]
                        },
                        {
                            id: 2,
                            name: "Qualified",
                            color: "#8B5CF6",
                            order: 2,
                            deals: [
                                { id: 3, title: "Sample Deal 3", value: 10000, owner: { name: "Demo User" } }
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
                // Get all pipeline stages
                const { data: stages, error: stagesError } = yield supabase
                    .from('pipeline_stages')
                    .select('*')
                    .order('"order"', { ascending: true });
                if (stagesError)
                    throw stagesError;
                // Get all deals
                const { data: deals, error: dealsError } = yield supabase
                    .from('deals')
                    .select('*');
                if (dealsError)
                    throw dealsError;
                // Process and format the data manually since the relationship isn't working
                const result = (stages === null || stages === void 0 ? void 0 : stages.map((stage) => {
                    // Find deals for this stage - using 'stage' instead of 'stage'
                    const stageDeals = deals === null || deals === void 0 ? void 0 : deals.filter(deal => deal.stage === stage.id).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5); // Limit to 5 deals
                    return Object.assign(Object.assign({}, stage), { deals: stageDeals || [] });
                })) || [];
                return result;
            }
            catch (error) {
                handleError(error, 'getPipelineOverview');
                // Return sample data as fallback
                return [
                    {
                        id: 1,
                        name: "Lead",
                        color: "#6366F1",
                        order: 1,
                        deals: [
                            { id: 1, title: "Sample Deal 1", value: 5000, owner: { name: "Demo User" } },
                            { id: 2, title: "Sample Deal 2", value: 7500, owner: { name: "Demo User" } }
                        ]
                    },
                    {
                        id: 2,
                        name: "Qualified",
                        color: "#8B5CF6",
                        order: 2,
                        deals: [
                            { id: 3, title: "Sample Deal 3", value: 10000, owner: { name: "Demo User" } }
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
        });
    },
    /**
     * Gets full pipeline with filtering options
     */
    getPipeline(filterUserId_1) {
        return __awaiter(this, arguments, void 0, function* (filterUserId, sortBy = 'updated') {
            try {
                // Check if the pipeline_stages table exists
                const { error: tableCheckError } = yield supabase
                    .from('pipeline_stages')
                    .select('count')
                    .limit(1);
                // If table doesn't exist, return sample data
                if (tableCheckError && tableCheckError.code === '42P01') {
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
                                    value: 5000,
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
                                    value: 10000,
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
                // Get all pipeline stages
                const { data: stages, error: stagesError } = yield supabase
                    .from('pipeline_stages')
                    .select('*')
                    .order('order', { ascending: true });
                if (stagesError)
                    throw stagesError;
                // Get deals with filter if provided
                let dealsQuery = supabase
                    .from('deals')
                    .select('*, contact:contacts!contact_id(*), owner:users!owner_id(*)');
                if (filterUserId) {
                    dealsQuery = dealsQuery.eq('owner_id', filterUserId);
                }
                const { data: deals, error: dealsError } = yield dealsQuery;
                if (dealsError)
                    throw dealsError;
                // Sort deals based on the sortBy parameter
                let sortedDeals = deals;
                if (sortBy === 'updated') {
                    sortedDeals = deals === null || deals === void 0 ? void 0 : deals.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                }
                else if (sortBy === 'created') {
                    sortedDeals = deals === null || deals === void 0 ? void 0 : deals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                }
                else if (sortBy === 'value') {
                    sortedDeals = deals === null || deals === void 0 ? void 0 : deals.sort((a, b) => Number(b.value) - Number(a.value));
                }
                // Process and format the data similar to what Drizzle provides
                const result = (stages === null || stages === void 0 ? void 0 : stages.map((stage) => {
                    // Find deals for this stage
                    const stageDeals = (sortedDeals === null || sortedDeals === void 0 ? void 0 : sortedDeals.filter((deal) => deal.stage === stage.id)) || [];
                    return Object.assign(Object.assign({}, stage), { deals: stageDeals });
                })) || [];
                return result;
            }
            catch (error) {
                handleError(error, 'getPipeline');
                // Return sample data as fallback
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
                                value: 5000,
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
                                value: 10000,
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
        });
    },
    /**
     * Gets today's tasks for the current user
     */
    getTodaysTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const today = new Date();
                const startOfToday = new Date(today.setHours(0, 0, 0, 0));
                const endOfToday = new Date(today.setHours(23, 59, 59, 999));
                // Get all tasks
                const { data: tasks, error } = yield supabase
                    .from('tasks')
                    .select('*');
                if (error)
                    throw error;
                // If tasks is empty or null, return sample data
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
                // Process tasks without trying to join with users
                const tasksWithUsers = tasks.map(task => {
                    return Object.assign(Object.assign({}, task), { assignedUser: {
                            id: task.assigned_to || 1,
                            name: `User ${task.assigned_to || 1}`,
                            avatarUrl: null
                        } });
                });
                // Filter for today's tasks
                const todaysTasks = tasksWithUsers.filter(task => {
                    if (!task.due_date)
                        return false;
                    const taskDate = new Date(task.due_date);
                    return taskDate >= startOfToday && taskDate <= endOfToday;
                });
                return todaysTasks;
            }
            catch (error) {
                console.error("Error in getTodaysTasks:", error);
                handleError(error, 'getTodaysTasks');
                // Return sample data as fallback
                const today = new Date();
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
        });
    },
    /**
     * Toggles a task's completion status
     */
    toggleTaskCompletion(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // First get the current task
                const { data: task, error: getError } = yield supabase
                    .from('tasks')
                    .select('*')
                    .eq('id', taskId)
                    .single();
                if (getError)
                    throw getError;
                // Toggle the completion status
                const { data: updatedTask, error: updateError } = yield supabase
                    .from('tasks')
                    .update({ completed: !task.completed })
                    .eq('id', taskId)
                    .select()
                    .single();
                if (updateError)
                    throw updateError;
                return updatedTask;
            }
            catch (error) {
                handleError(error, 'toggleTaskCompletion');
                return null;
            }
        });
    },
    /**
     * Gets recent contacts (last added or updated)
     */
    getRecentContacts() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data: contacts, error } = yield supabase
                    .from('contacts')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);
                if (error)
                    throw error;
                // Process contacts without trying to join with users
                const contactsWithUsers = contacts.map(contact => {
                    return Object.assign(Object.assign({}, contact), { assignedUser: {
                            id: contact.assigned_to || 1,
                            name: `User ${contact.assigned_to || 1}`,
                            avatarUrl: null
                        } });
                });
                return contactsWithUsers;
            }
            catch (error) {
                console.error("Error in getRecentContacts:", error);
                handleError(error, 'getRecentContacts');
                // Return sample data as fallback
                return [
                    {
                        id: 1,
                        name: "John Doe",
                        email: "john@example.com",
                        phone: "555-1234",
                        company: "Acme Inc",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        assigned_to: 1,
                        assignedUser: { id: 1, name: "Demo User", avatarUrl: null }
                    }
                ];
            }
        });
    },
    /**
     * Gets all contacts with optional search
     */
    getContacts(search) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // First, get contacts with basic query (no joins)
                let query = supabase.from('contacts').select('*');
                if (search) {
                    // Add search filter if provided
                    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
                }
                const { data: contacts, error } = yield query.order('name', { ascending: true });
                if (error)
                    throw error;
                // Get users separately
                const { data: users, error: usersError } = yield supabase
                    .from('users')
                    .select('*');
                if (usersError)
                    throw usersError;
                // Manually join the data
                const contactsWithUsers = contacts.map(contact => {
                    const user = (users === null || users === void 0 ? void 0 : users.find(u => u.id === contact.assigned_to)) || null;
                    return Object.assign(Object.assign({}, contact), { assignedUser: user });
                });
                return contactsWithUsers;
            }
            catch (error) {
                handleError(error, 'getContacts');
                // Return empty array as fallback
                return [];
            }
        });
    },
    /**
     * Gets recent activities
     */
    getRecentActivities() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data: activities, error } = yield supabase
                    .from('activities')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (error)
                    throw error;
                // Process activities without trying to join with users
                const activitiesWithUsers = activities.map(activity => {
                    return Object.assign(Object.assign({}, activity), { user: {
                            id: activity.user_id || 1,
                            name: `User ${activity.user_id || 1}`,
                            avatarUrl: null
                        } });
                });
                return activitiesWithUsers || [];
            }
            catch (error) {
                console.error("Error in getRecentActivities:", error);
                handleError(error, 'getRecentActivities');
                return [];
            }
        });
    },
    /**
     * Gets a single contact by ID
     */
    getContactById(contactId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data: contact, error } = yield supabase
                    .from('contacts')
                    .select('*, assignedUser:users!assigned_to(*)')
                    .eq('id', contactId)
                    .single();
                if (error)
                    throw error;
                // Get deals for this contact
                const { data: deals, error: dealsError } = yield supabase
                    .from('deals')
                    .select('*, stage:pipeline_stages(*), owner:users!owner_id(*)')
                    .eq('contact_id', contactId)
                    .order('updated_at', { ascending: false });
                if (dealsError)
                    throw dealsError;
                // Get activities for this contact
                const { data: activities, error: activitiesError } = yield supabase
                    .from('activities')
                    .select('*, user:users!user_id(*)')
                    .eq('related_to_type', 'contact')
                    .eq('related_to_id', contactId)
                    .order('created_at', { ascending: false });
                if (activitiesError)
                    throw activitiesError;
                // Get tasks for this contact
                const { data: tasks, error: tasksError } = yield supabase
                    .from('tasks')
                    .select('*, assignedUser:users!assigned_to(*)')
                    .eq('related_to_type', 'contact')
                    .eq('related_to_id', contactId)
                    .order('due_date', { ascending: true });
                if (tasksError)
                    throw tasksError;
                return Object.assign(Object.assign({}, contact), { deals: deals || [], activities: activities || [], tasks: tasks || [] });
            }
            catch (error) {
                handleError(error, 'getContactById');
                return null;
            }
        });
    },
    /**
     * Creates a new contact
     */
    createContact(contactData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Convert from camelCase to snake_case for Supabase
                const supabaseContactData = {
                    name: contactData.name,
                    email: contactData.email,
                    phone: contactData.phone,
                    title: contactData.title,
                    company: contactData.company,
                    status: contactData.status,
                    assigned_to: contactData.assignedTo,
                    avatar_url: contactData.avatarUrl,
                    address: contactData.address,
                    notes: contactData.notes,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                console.log("Sending to Supabase:", supabaseContactData);
                const { data: contact, error } = yield supabase
                    .from('contacts')
                    .insert(supabaseContactData)
                    .select()
                    .single();
                if (error) {
                    console.error("Supabase insert error:", error);
                    throw error;
                }
                return contact;
            }
            catch (error) {
                handleError(error, 'createContact');
                return null;
            }
        });
    },
    /**
     * Updates an existing contact
     */
    updateContact(contactId, contactData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Convert from camelCase to snake_case for Supabase
                const supabaseContactData = {
                    name: contactData.name,
                    email: contactData.email,
                    phone: contactData.phone,
                    title: contactData.title,
                    company: contactData.company,
                    status: contactData.status,
                    assigned_to: contactData.assignedTo,
                    avatar_url: contactData.avatarUrl,
                    address: contactData.address,
                    notes: contactData.notes,
                    updated_at: new Date().toISOString()
                };
                console.log("Sending to Supabase:", supabaseContactData);
                const { data: contact, error } = yield supabase
                    .from('contacts')
                    .update(supabaseContactData)
                    .eq('id', contactId)
                    .select()
                    .single();
                if (error) {
                    console.error("Supabase update error:", error);
                    throw error;
                }
                return contact;
            }
            catch (error) {
                handleError(error, 'updateContact');
                return null;
            }
        });
    },
    /**
     * Deletes a contact
     */
    deleteContact(contactId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = yield supabase
                    .from('contacts')
                    .delete()
                    .eq('id', contactId);
                if (error)
                    throw error;
                return true;
            }
            catch (error) {
                handleError(error, 'deleteContact');
                return false;
            }
        });
    },
    /**
     * Creates a new deal
     */
    createDeal(dealData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data: deal, error } = yield supabase
                    .from('deals')
                    .insert(Object.assign(Object.assign({}, dealData), { created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))
                    .select()
                    .single();
                if (error)
                    throw error;
                return deal;
            }
            catch (error) {
                handleError(error, 'createDeal');
                return null;
            }
        });
    },
    /**
     * Updates a deal's stage
     */
    updateDealStage(dealId, stageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data: deal, error } = yield supabase
                    .from('deals')
                    .update({
                    stage: stageId,
                    updated_at: new Date().toISOString()
                })
                    .eq('id', dealId)
                    .select()
                    .single();
                if (error)
                    throw error;
                return deal;
            }
            catch (error) {
                handleError(error, 'updateDealStage');
                return null;
            }
        });
    },
    /**
     * Creates a new task
     */
    createTask(taskData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Log the incoming data to debug
                console.log("Original task data:", taskData);
                // Ensure we have a valid assigned_to value
                let assignedTo = null;
                if (taskData.assigned_to !== undefined) {
                    assignedTo = Number(taskData.assigned_to);
                    if (isNaN(assignedTo)) {
                        console.error("Invalid assigned_to value:", taskData.assigned_to);
                        throw new Error("assigned_to must be a valid number");
                    }
                }
                else if (taskData.assignedTo !== undefined) {
                    assignedTo = Number(taskData.assignedTo);
                    if (isNaN(assignedTo)) {
                        console.error("Invalid assignedTo value:", taskData.assignedTo);
                        throw new Error("assignedTo must be a valid number");
                    }
                }
                // Use the correct column names
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
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                console.log("Supabase data:", supabaseData);
                // Insert the task with the correctly formatted data
                const { data: task, error } = yield supabase
                    .from('tasks')
                    .insert(supabaseData)
                    .select()
                    .single();
                if (error) {
                    console.error("Supabase insert error:", error);
                    throw error;
                }
                // Convert snake_case back to camelCase for the response
                const formattedTask = Object.assign(Object.assign({}, task), { dueDate: task.due_date, assignedTo: task.assigned_to, assigned_to: task.assigned_to, relatedToType: task.related_to_type, relatedToId: task.related_to_id, createdAt: task.created_at, updatedAt: task.updated_at });
                return formattedTask;
            }
            catch (error) {
                handleError(error, 'createTask');
                return null;
            }
        });
    },
    /**
     * Creates a new activity
     */
    createActivity(activityData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data: activity, error } = yield supabase
                    .from('activities')
                    .insert(Object.assign(Object.assign({}, activityData), { created_at: new Date().toISOString() }))
                    .select()
                    .single();
                if (error)
                    throw error;
                return activity;
            }
            catch (error) {
                handleError(error, 'createActivity');
                return null;
            }
        });
    },
    /**
     * Gets a single task by ID
     */
    getTaskById(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get the task
                const { data: task, error } = yield supabase
                    .from('tasks')
                    .select('*')
                    .eq('id', taskId)
                    .single();
                if (error)
                    throw error;
                // Return task with placeholder assigned user
                return Object.assign(Object.assign({}, task), { assignedUser: {
                        id: task.assigned_to || 1,
                        name: `User ${task.assigned_to || 1}`,
                        avatarUrl: null
                    } });
            }
            catch (error) {
                console.error("Error in getTaskById:", error);
                handleError(error, 'getTaskById');
                return null;
            }
        });
    },
    /**
     * Gets all tasks with optional search filter
     */
    getTasks(search) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Getting tasks with search:", search);
                // First, get the tasks
                let query = supabase
                    .from('tasks')
                    .select('*');
                if (search) {
                    query = query.ilike('title', `%${search}%`);
                }
                const { data: tasks, error } = yield query;
                if (error) {
                    console.error("Error fetching tasks from Supabase:", error);
                    throw error;
                }
                console.log(`Found ${(tasks === null || tasks === void 0 ? void 0 : tasks.length) || 0} tasks`);
                // If no tasks found, return sample data
                if (!tasks || tasks.length === 0) {
                    console.log("No tasks found, returning sample data");
                    return [
                        {
                            id: 1,
                            title: "Sample Task 1",
                            description: "This is a sample task",
                            due_date: new Date().toISOString(),
                            completed: false,
                            priority: "high",
                            assigned_to: 1,
                            assignedUser: { id: 1, name: "Demo User" }
                        }
                    ];
                }
                // Return tasks with placeholder assignedUser
                return tasks.map(task => (Object.assign(Object.assign({}, task), { assignedUser: {
                        id: task.assigned_to || 1,
                        name: `User ${task.assigned_to || 1}`
                    } })));
            }
            catch (error) {
                console.error("Error in getTasks:", error);
                handleError(error, 'getTasks');
                return [];
            }
        });
    },
    /**
     * Updates a task
     */
    updateTask(taskId, taskData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Format the data to match the database schema
                const formattedData = {};
                // Copy simple fields directly
                if (taskData.title !== undefined)
                    formattedData.title = taskData.title;
                if (taskData.description !== undefined)
                    formattedData.description = taskData.description;
                if (taskData.priority !== undefined)
                    formattedData.priority = taskData.priority;
                if (taskData.time !== undefined)
                    formattedData.time = taskData.time;
                // Convert camelCase to snake_case for database fields
                if (taskData.dueDate !== undefined) {
                    // Convert string date to ISO string if it's a string
                    if (typeof taskData.dueDate === 'string' && taskData.dueDate) {
                        formattedData.due_date = new Date(taskData.dueDate).toISOString();
                    }
                    else if (taskData.dueDate instanceof Date) {
                        formattedData.due_date = taskData.dueDate.toISOString();
                    }
                    else {
                        formattedData.due_date = null;
                    }
                }
                if (taskData.assigned_to !== undefined) {
                    formattedData.assigned_to = taskData.assigned_to;
                }
                // Handle related_to_type and related_to_id even if they're not in the type
                if ('relatedToType' in taskData) {
                    formattedData.related_to_type = taskData.relatedToType;
                }
                if ('relatedToId' in taskData) {
                    formattedData.related_to_id = taskData.relatedToId;
                }
                // Add updated_at timestamp
                formattedData.updated_at = new Date().toISOString();
                console.log("Updating task with data:", formattedData);
                // Update the task
                const { data, error } = yield supabase
                    .from('tasks')
                    .update(formattedData)
                    .eq('id', taskId)
                    .select()
                    .single();
                if (error) {
                    console.error("Update error:", error);
                    throw error;
                }
                // Convert snake_case back to camelCase for the response
                const formattedTask = Object.assign(Object.assign({}, data), { dueDate: data.due_date, assignedTo: data.assigned_to, relatedToType: data.related_to_type, relatedToId: data.related_to_id, createdAt: data.created_at, updatedAt: data.updated_at });
                return formattedTask;
            }
            catch (error) {
                handleError(error, 'updateTask');
                return null;
            }
        });
    },
    /**
     * Gets all pipeline stages
     */
    getPipelineStages() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if the pipeline_stages table exists
                const { error: tableCheckError } = yield supabase
                    .from('pipeline_stages')
                    .select('count')
                    .limit(1);
                // If table doesn't exist, return sample data
                if (tableCheckError && tableCheckError.code === '42P01') {
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
                // Get all pipeline stages
                const { data: stages, error: stagesError } = yield supabase
                    .from('pipeline_stages')
                    .select('*')
                    .order('order', { ascending: true });
                if (stagesError)
                    throw stagesError;
                return stages || [];
            }
            catch (error) {
                handleError(error, 'getPipelineStages');
                // Return sample data as fallback
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
        });
    },
    /**
     * Deletes a task
     */
    deleteTask(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = yield supabase
                    .from('tasks')
                    .delete()
                    .eq('id', taskId);
                if (error)
                    throw error;
                return true;
            }
            catch (error) {
                handleError(error, 'deleteTask');
                return false;
            }
        });
    }
};
