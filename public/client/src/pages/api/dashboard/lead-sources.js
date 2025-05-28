"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const supabase_1 = require("@/lib/supabase");
async function handler(req, res) {
    try {
        // Get leads with source information
        // This is a simplified example - in a real app, you'd query your leads table
        const { data: leads, error } = await supabase_1.supabase
            .from('contacts')
            .select('source');
        if (error)
            throw error;
        // Count leads by source
        const sourceCount = {};
        leads.forEach(lead => {
            const source = lead.source || 'Unknown';
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
        const leadSources = Object.entries(sourceCount)
            .map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
        }))
            .sort((a, b) => b.value - a.value); // Sort by count descending
        res.status(200).json(leadSources);
    }
    catch (error) {
        console.error('Error fetching lead sources:', error);
        res.status(500).json({ error: 'Failed to fetch lead sources' });
    }
}
