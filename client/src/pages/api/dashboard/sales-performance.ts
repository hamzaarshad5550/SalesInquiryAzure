import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db';
import { deals, pipelineStages } from '@/shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { subWeeks, subMonths, subQuarters, subYears, startOfDay, endOfDay } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period = 'monthly' } = req.query;
    
    // Get the 'Closed Won' stage ID
    const closedWonStage = await db.query.pipelineStages.findFirst({
      where: eq(pipelineStages.name, 'Closed Won')
    });
    
    if (!closedWonStage) {
      throw new Error('Closed Won stage not found');
    }
    
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    
    // Calculate date ranges based on period
    switch(period) {
      case 'weekly':
        startDate = subWeeks(now, 1);
        previousStartDate = subWeeks(now, 2);
        break;
      case 'quarterly':
        startDate = subQuarters(now, 1);
        previousStartDate = subQuarters(now, 2);
        break;
      case 'yearly':
        startDate = subYears(now, 1);
        previousStartDate = subYears(now, 2);
        break;
      case 'monthly':
      default:
        startDate = subMonths(now, 1);
        previousStartDate = subMonths(now, 2);
    }
    
    // Get current period deals
    const currentPeriodDeals = await db.query.deals.findMany({
      where: and(
        eq(deals.stageId, closedWonStage.id),
        gte(deals.createdAt, startOfDay(startDate)),
        lte(deals.createdAt, endOfDay(now))
      )
    });
    
    // Get previous period deals
    const previousPeriodDeals = await db.query.deals.findMany({
      where: and(
        eq(deals.stageId, closedWonStage.id),
        gte(deals.createdAt, startOfDay(previousStartDate)),
        lte(deals.createdAt, endOfDay(startDate))
      )
    });
    
    // Aggregate values by date
    const currentPeriodData: Record<string, number> = {};
    const previousPeriodData: Record<string, number> = {};
    
    currentPeriodDeals.forEach(deal => {
      const date = deal.createdAt.toISOString().split('T')[0];
      currentPeriodData[date] = (currentPeriodData[date] || 0) + Number(deal.value);
    });
    
    previousPeriodDeals.forEach(deal => {
      const date = deal.createdAt.toISOString().split('T')[0];
      previousPeriodData[date] = (previousPeriodData[date] || 0) + Number(deal.value);
    });
    
    // Format for chart
    const salesData = Object.keys({ ...currentPeriodData, ...previousPeriodData })
      .sort()
      .map(date => ({
        name: date,
        current: currentPeriodData[date] || 0,
        previous: previousPeriodData[date] || 0
      }));
    
    // Calculate summary metrics
    const currentTotal = currentPeriodDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
    const previousTotal = previousPeriodDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
    const percentChange = previousTotal ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    
    res.status(200).json({
      salesData,
      summary: {
        currentTotal,
        previousTotal,
        percentChange
      }
    });
  } catch (error) {
    console.error('Error fetching sales performance:', error);
    res.status(500).json({ error: 'Failed to fetch sales performance' });
  }
}