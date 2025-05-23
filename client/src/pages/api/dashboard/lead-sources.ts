import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period = 'monthly' } = req.query;
    
    // First check if the source column exists
    const { data: columnInfo, error: columnError } = await supabase
      .from('contacts')
      .select()
      .limit(1);
    
    // Determine which field to use for source
    let sourceField = 'source';
    if (columnError || (columnInfo && columnInfo.length > 0 && !('source' in columnInfo[0]))) {
      // Try alternative field names
      const possibleFields = ['lead_source', 'leadSource', 'source_type', 'sourceType', 'origin'];
      for (const field of possibleFields) {
        if (columnInfo && columnInfo.length > 0 && field in columnInfo[0]) {
          sourceField = field;
          console.log(`Using '${field}' as source field`);
          break;
        }
      }
    }
    
    // Get all contacts
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*');
    
    if (error) throw error;
    
    // Filter by time range
    const now = new Date();
    let timeFilter = 30; // Default to monthly
    
    if (period === 'quarterly') {
      timeFilter = 90;
    } else if (period === 'yearly') {
      timeFilter = 365;
    } else if (period === 'weekly') {
      timeFilter = 7;
    }
    
    const filteredContacts = contacts.filter(contact => {
      const contactDate = new Date(contact.created_at || contact.createdAt);
      const daysDiff = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= timeFilter;
    });
    
    // Count by source
    const sourceCount: Record<string, number> = {};
    filteredContacts.forEach(contact => {
      // Try to get the source using the determined field or fallbacks
      const source = contact[sourceField] || 
                    contact.source || 
                    contact.lead_source || 
                    contact.leadSource || 
                    'Unknown';
      
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });
    
    // Format for chart
    const COLORS = [
      "hsl(var(--primary))",
      "hsl(var(--secondary))",
      "hsl(var(--accent))",
      "hsl(var(--destructive))",
      "hsl(var(--success))"
    ];
    
    const leadSourcesData = Object.entries(sourceCount)
      .map(([source, count], index) => ({
        name: source || 'Unknown',
        value: count,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    res.status(200).json(leadSourcesData);
  } catch (error) {
    console.error('Error fetching lead sources:', error);
    res.status(500).json([]);
  }
}
