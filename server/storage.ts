import { supabase } from './supabase';
import { 
  type Deal,
  type PipelineStage,
  type Contact,
  type User,
  type Task,
  type Activity,
  type InsertDeal,
  type InsertContact,
  type InsertTask,
  type InsertActivity
} from '../shared/schema';
import { format, formatISO, subMonths, startOfMonth, endOfMonth, subYears, startOfDay, endOfDay } from "date-fns";
import { isSuccessResponse, isErrorResponse, isArrayResponse, getResponseData } from './types/supabase';
import { handleError as logError } from './utils';

// Create a fallback database implementation using Supabase REST API
// This avoids the direct PostgreSQL connection that's having DNS resolution issues

// Helper functions for common query patterns
const handleError = (error: any, operation: string) => {
  console.error(`Error in ${operation}:`, error);
  throw new Error(`Failed to execute ${operation}`);
};

// Type for deal response from Supabase
interface DealResponse {
  id: number;
  name: string;
  value: number;
  description?: string;
  updated_at: string;
  owner_id: number;
  owner_name?: string;
  owner_avatar_url?: string;
}

export const storage = {
  /**
   * Gets the current authenticated user (placeholder for auth)
   */
  async getCurrentUser() {
    try {
      const response = await supabase
        .from('users')
        .select('id')
        .eq('id', 1);
      
      const data = getResponseData(response) as { id: number }[] | null;
      if (!data) return false;
      
      return data.length > 0;
    } catch (error) {
      logError(error, 'getCurrentUser');
      return false;
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
      if (!data) return [];
      
      return data;
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
        .select('*');
      
      if (error) throw error;
      if (!data) return [];
      
      return Array.isArray(data) ? data.map(user => ({
        id: user.id,
        name: user.name || `User ${user.id}`
      })) : [];
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
    
    const prevClosedDealsData = getResponseData(prevClosedDeals);
    const prevClosedWonDealsData = getResponseData(prevClosedWonDeals);
    const prevTotalClosed = Array.isArray(prevClosedDealsData) ? prevClosedDealsData.length : 0;
    const prevTotalClosedWon = Array.isArray(prevClosedWonDealsData) ? prevClosedWonDealsData.length : 0;
    
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
    }
    
    return salesData;
  },
};