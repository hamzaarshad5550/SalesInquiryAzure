import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period = 'monthly' } = req.query;
    
    // Get deals with created_at and value
    const { data: deals, error } = await supabase
      .from('deals')
      .select('created_at, value, status');
    
    if (error) throw error;
    
    // Filter closed deals
    const closedDeals = deals.filter(deal => deal.status === 'closed_won');
    
    // Group by month/week/etc based on period
    const currentPeriodDeals: Record<string, number> = {};
    const previousPeriodDeals: Record<string, number> = {};
    
    const now = new Date();
    let dateFormat: Intl.DateTimeFormatOptions;
    let periodOffset: number;
    
    // Set date format and period offset based on selected period
    switch(period) {
      case 'weekly':
        dateFormat = { weekday: 'short' };
        periodOffset = 7; // 7 days
        break;
      case 'quarterly':
        dateFormat = { month: 'short' };
        periodOffset = 3; // 3 months
        break;
      case 'yearly':
        dateFormat = { month: 'short' };
        periodOffset = 12; // 12 months
        break;
      case 'monthly':
      default:
        dateFormat = { day: '2-digit' };
        periodOffset = 30; // ~1 month in days
    }
    
    // Process deals
    closedDeals.forEach(deal => {
      const dealDate = new Date(deal.created_at);
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
    res.status(500).json({ error: 'Failed to fetch sales performance' });
  }
}