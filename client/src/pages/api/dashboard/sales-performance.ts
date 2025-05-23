import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period = 'monthly' } = req.query;
    
    // Get deals with created_at and value
    const { data: deals, error } = await supabase
      .from('deals')
      .select('*');
    
    if (error) throw error;
    
    // Determine which field indicates a closed deal
    const closedDeals = deals.filter(deal => 
      deal.status === 'closed_won' || 
      deal.stage === 5 || 
      deal.stageId === 5
    );
    
    // Group by month/week/etc based on period
    const currentPeriodDeals: Record<string, number> = {};
    const previousPeriodDeals: Record<string, number> = {};
    
    const now = new Date();
    let dateFormat: Intl.DateTimeFormatOptions;
    let periodOffset: number;
    
    // Set date format and period offset based on period
    if (period === 'weekly') {
      dateFormat = { month: 'short', day: 'numeric' };
      periodOffset = 7;
    } else if (period === 'quarterly') {
      dateFormat = { month: 'short', year: 'numeric' };
      periodOffset = 90;
    } else if (period === 'yearly') {
      dateFormat = { year: 'numeric' };
      periodOffset = 365;
    } else {
      // Default to monthly
      dateFormat = { month: 'short' };
      periodOffset = 30;
    }
    
    // Process deals
    closedDeals.forEach(deal => {
      const dealDate = new Date(deal.created_at || deal.createdAt);
      const formattedDate = new Intl.DateTimeFormat('en-US', dateFormat).format(dealDate);
      const daysDiff = Math.floor((now.getTime() - dealDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= periodOffset) {
        // Current period
        currentPeriodDeals[formattedDate] = (currentPeriodDeals[formattedDate] || 0) + Number(deal.value);
      } else if (daysDiff <= periodOffset * 2) {
        // Previous period
        previousPeriodDeals[formattedDate] = (previousPeriodDeals[formattedDate] || 0) + Number(deal.value);
      }
    });
    
    // Format for chart
    const salesData = Object.keys({ ...currentPeriodDeals, ...previousPeriodDeals })
      .sort((a, b) => {
        // Sort dates properly
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      })
      .map(date => ({
        name: date,
        current: currentPeriodDeals[date] || 0,
        previous: previousPeriodDeals[date] || 0
      }));
    
    res.status(200).json({ salesData });
  } catch (error) {
    console.error('Error fetching sales performance:', error);
    res.status(500).json({ error: 'Failed to fetch sales performance', salesData: [] });
  }
}
