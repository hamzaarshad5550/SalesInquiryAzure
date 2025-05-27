import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db';
import { deals, users } from '@/shared/schema';
import { eq, gte } from 'drizzle-orm';
import { subWeeks, subMonths, subQuarters, subYears } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period = 'monthly' } = req.query;
    const now = new Date();
    let cutoffDate = new Date();

    // Calculate cutoff date based on period
    switch (period) {
      case 'weekly':
        cutoffDate = subWeeks(now, 1);
        break;
      case 'quarterly':
        cutoffDate = subQuarters(now, 1);
        break;
      case 'yearly':
        cutoffDate = subYears(now, 1);
        break;
      case 'monthly':
      default:
        cutoffDate = subMonths(now, 1);
    }

    // Get all users
    const allUsers = await db.query.users.findMany();

    // Get deals for the period
    const periodDeals = await db.query.deals.findMany({
      where: gte(deals.createdAt, cutoffDate)
    });

    // Calculate total value per user
    const userPerformance = allUsers.map(user => {
      const userDeals = periodDeals.filter(deal => deal.ownerId === user.id);
      const totalValue = userDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
      const dealCount = userDeals.length;

      return {
        id: user.id,
        name: user.name, // Using name instead of full_name
        totalValue,
        dealCount
      };
    });

    // Sort by total value and take top 5
    const topPerformers = userPerformance
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    res.status(200).json({ performers: topPerformers });
  } catch (error) {
    console.error('Error fetching top sales:', error);
    res.status(500).json({ error: 'Failed to fetch top sales' });
  }
} 