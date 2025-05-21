import type { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';

export default async function handler(req: Request, res: Response) {
  try {
    // Get pipeline stages
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('order', { ascending: true });
    
    if (stagesError) throw stagesError;
    
    // Get deals
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('*');
    
    if (dealsError) throw dealsError;
    
    // Count deals by stage
    const dealsByStage = stages.map((stage, index) => {
      const stageDeals = deals.filter(deal => deal.stage === stage.id);
      
      return {
        name: stage.name,
        value: stageDeals.length,
        color: [
          "hsl(var(--primary))",
          "hsl(var(--primary)/0.8)",
          "hsl(var(--primary)/0.6)",
          "hsl(var(--primary)/0.4)",
          "hsl(var(--primary)/0.2)"
        ][index % 5]
      };
    });
    
    res.status(200).json(dealsByStage);
  } catch (error) {
    console.error('Error fetching deals by stage:', error);
    res.status(500).json({ error: 'Failed to fetch deals by stage' });
  }
}
