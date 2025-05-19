import { 
  type InsertContact,
  type InsertDeal,
  type InsertTask,
  type InsertActivity
} from "@shared/schema";
import { format, formatISO, subMonths, startOfMonth, endOfMonth, subYears, startOfDay, endOfDay } from "date-fns";
import { supabase } from "./supabase";

// Create a fallback database implementation using Supabase REST API
// This avoids the direct PostgreSQL connection that's having DNS resolution issues

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
    // Current month revenue
    const currentMonth = new Date();
    const previousMonth = subMonths(currentMonth, 1);
    
    const currentMonthStart = startOfMonth(currentMonth);
    const currentMonthEnd = endOfMonth(currentMonth);
    const previousMonthStart = startOfMonth(previousMonth);
    const previousMonthEnd = endOfMonth(previousMonth);
    
    // Total revenue from deals that were closed this month
    const { data: currentMonthRevenue, error } = await supabase
      .from('deals')
      .select('value')
      .eq('stage_id', 5) // Assuming stage 5 is 'Closed Won'
      .gte('updated_at', currentMonthStart.toISOString())
      .lte('updated_at', currentMonthEnd.toISOString());
    
    if (error) throw error;
    
    // Calculate sum of values
    const totalRevenue = currentMonthRevenue?.reduce((sum: number, deal: { value: string | number }) => sum + Number(deal.value), 0) || 0;
    
    // Total revenue from deals that were closed last month
    const { data: previousMonthRevenue, error: previousError } = await supabase
      .from('deals')
      .select('value')
      .eq('stage_id', 5) // Assuming stage 5 is 'Closed Won'
      .gte('updated_at', previousMonthStart.toISOString())
      .lte('updated_at', previousMonthEnd.toISOString());
    
    if (previousError) throw previousError;
    
    const prevTotalRevenue = previousMonthRevenue?.reduce((sum: number, deal: { value: string | number }) => sum + Number(deal.value), 0) || 0;
    
    // Calculate percent change
    const totalRevenueChange = prevTotalRevenue === 0 
      ? 0 
      : Number(((totalRevenue - prevTotalRevenue) / prevTotalRevenue * 100).toFixed(1));
    
    // Active deals count
    const { data: activeDealsCount, error: activeError } = await supabase
      .from('deals')
      .select('id')
      .gte('stage_id', 1)
      .lt('stage_id', 5); // Not including Closed Won or Lost
    
    if (activeError) throw activeError;
    
    const activeDeals = activeDealsCount?.length || 0;
    
    // Previous month active deals
    const { data: prevActiveDealsCount, error: prevActiveError } = await supabase
      .from('deals')
      .select('id')
      .gte('stage_id', 1)
      .lt('stage_id', 5)
      .gte('updated_at', previousMonthStart.toISOString())
      .lte('updated_at', previousMonthEnd.toISOString());
    
    if (prevActiveError) throw prevActiveError;
    
    const prevActiveDeals = prevActiveDealsCount?.length || 0;
    
    const activeDealsChange = prevActiveDeals === 0 
      ? 0 
      : Number(((activeDeals - prevActiveDeals) / prevActiveDeals * 100).toFixed(1));
    
    // Conversion rate (closed won deals / total closed deals)
    const { data: closedDeals, error: closedError } = await supabase
      .from('deals')
      .select('id')
      .gte('updated_at', currentMonthStart.toISOString())
      .lte('updated_at', currentMonthEnd.toISOString())
      .or('stage_id.eq.5,stage_id.eq.6'); // Closed Won or Closed Lost
    
    if (closedError) throw closedError;
    
    const totalClosed = closedDeals?.length || 0;
    
    const { data: closedWonDeals, error: closedWonError } = await supabase
      .from('deals')
      .select('id')
      .gte('updated_at', currentMonthStart.toISOString())
      .lte('updated_at', currentMonthEnd.toISOString())
      .eq('stage_id', 5); // Closed Won
    
    if (closedWonError) throw closedWonError;
    
    const totalClosedWon = closedWonDeals?.length || 0;
    
    const prevClosedDeals = await supabase
      .from('deals')
      .select('id')
      .gte('updated_at', previousMonthStart.toISOString())
      .lte('updated_at', previousMonthEnd.toISOString())
      .or('stage_id.eq.5,stage_id.eq.6'); // Closed Won or Closed Lost
    
    const prevClosedWonDeals = await supabase
      .from('deals')
      .select('id')
      .gte('updated_at', previousMonthStart.toISOString())
      .lte('updated_at', previousMonthEnd.toISOString())
      .eq('stage_id', 5); // Closed Won
    
    const prevTotalClosed = prevClosedDeals?.length || 0;
    const prevTotalClosedWon = prevClosedWonDeals?.length || 0;
    
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
    const { data: newContacts, error: newContactsError } = await supabase
      .from('contacts')
      .select('id')
      .gte('created_at', currentMonthStart.toISOString())
      .lte('created_at', currentMonthEnd.toISOString());
    
    if (newContactsError) throw newContactsError;
    
    const newContactsCount = newContacts?.length || 0;
    
    const { data: prevNewContacts, error: prevNewContactsError } = await supabase
      .from('contacts')
      .select('id')
      .gte('created_at', previousMonthStart.toISOString())
      .lte('created_at', previousMonthEnd.toISOString());
    
    if (prevNewContactsError) throw prevNewContactsError;
    
    const prevNewContactsCount = prevNewContacts?.length || 0;
    
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
        
        const { data: monthRevenue, error: monthRevenueError } = await supabase
          .from('deals')
          .select('value')
          .eq('stage_id', 5) // Closed Won
          .gte('updated_at', monthStart.toISOString())
          .lte('updated_at', monthEnd.toISOString());
          
        if (monthRevenueError) throw monthRevenueError;
        
        const totalMonthRevenue = monthRevenue?.reduce((sum: number, deal: { value: string | number }) => sum + Number(deal.value), 0) || 0;
        
        salesData.push({
          name: format(monthDate, 'MMM'),
          value: totalMonthRevenue
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
        
        const { data: quarterRevenue, error: quarterRevenueError } = await supabase
          .from('deals')
          .select('value')
          .eq('stage_id', 5) // Closed Won
          .gte('updated_at', quarterStart.toISOString())
          .lte('updated_at', quarterEnd.toISOString());
          
        if (quarterRevenueError) throw quarterRevenueError;
        
        const totalQuarterRevenue = quarterRevenue?.reduce((sum: number, deal: { value: string | number }) => sum + Number(deal.value), 0) || 0;
        
        const quarterName = `Q${4 - i}`;
        
        salesData.push({
          name: quarterName,
          value: totalQuarterRevenue
        });
      }
    } else if (period === 'yearly') {
      // Get last 5 years
      for (let i = 4; i >= 0; i--) {
        const yearDate = subYears(now, i);
        const yearStart = new Date(yearDate.getFullYear(), 0, 1);
        const yearEnd = new Date(yearDate.getFullYear(), 11, 31);
        
        const { data: yearRevenue, error: yearRevenueError } = await supabase
          .from('deals')
          .select('value')
          .eq('stage_id', 5) // Closed Won
          .gte('updated_at', yearStart.toISOString())
          .lte('updated_at', yearEnd.toISOString());
          
        if (yearRevenueError) throw yearRevenueError;
        
        const totalYearRevenue = yearRevenue?.reduce((sum: number, deal: { value: string | number }) => sum + Number(deal.value), 0) || 0;
        
        salesData.push({
          name: format(yearDate, 'yyyy'),
          value: totalYearRevenue
        });
      }
    }
    
    return salesData;
  },

  /**
   * Gets pipeline overview data for dashboard
   */
  async getPipelineOverview() {
    const { data: pipelineData, error } = await supabase
      .from('pipelineStages')
      .select('*')
      .order('order', { ascending: true });
      
    if (error) throw error;
    
    // Calculate total value for each stage
    const stagesWithTotals = await Promise.all(
      pipelineData.map(async (stage: { id: number; name: string; color: string; order: number }) => {
        const stageDeals = await supabase
          .from('deals')
          .select('value')
          .eq('stage_id', stage.id)
          .order('updated_at', { ascending: false })
          .limit(5)
          .single();
        
        return {
          id: stage.id,
          name: stage.name,
          color: stage.color,
          order: stage.order,
          totalValue: Number(stageDeals[0]?.value) || 0,
          deals: stageDeals.map((deal: any) => ({
            id: String(deal.id),
            name: deal.name,
            value: Number(deal.value),
            description: deal.description || "",
            updatedAt: deal.updated_at.toISOString(),
            owner: {
              id: String(deal.owner_id),
              name: deal.owner_name,
              avatarUrl: deal.owner_avatar_url
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
    const pipelineData = await supabase
      .from('pipelineStages')
      .select('*')
      .order('order', { ascending: true });
    
    const stagesWithDeals = await Promise.all(
      pipelineData.map(async (stage: { id: number; name: string; color: string; order: number }) => {
        let dealsQuery = supabase
          .from('deals')
          .select('*')
          .eq('stage_id', stage.id);
        
        if (filterUserId) {
          dealsQuery = dealsQuery.eq('owner_id', filterUserId);
        }
        
        if (sortBy === 'updated') {
          dealsQuery = dealsQuery.order('updated_at', { ascending: false });
        } else if (sortBy === 'created') {
          dealsQuery = dealsQuery.order('created_at', { ascending: false });
        } else if (sortBy === 'value') {
          dealsQuery = dealsQuery.order('value', { ascending: false });
        }
        
        const { data: deals, error } = await dealsQuery;
        
        if (error) throw error;
        
        return {
          ...stage,
          deals: deals.map((deal: any) => ({
            id: deal.id,
            name: deal.name,
            value: deal.value,
            description: deal.description || "",
            updatedAt: deal.updated_at.toISOString(),
            owner: {
              id: String(deal.owner_id),
              name: deal.owner_name,
              avatarUrl: deal.owner_avatar_url
            }
          }))
        };
      })
    );
    
    return stagesWithDeals;
  },
};
