import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { AlertCircle } from "lucide-react";

export function DealVelocity() {
  // Fetch pipeline stages and deals data
  const { data: stagesData, isLoading: stagesLoading, error: stagesError } = useQuery({
    queryKey: ['pipelineStages'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('pipeline_stages')
          .select('*')
          .order('"order"', { ascending: true });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching pipeline stages:", error);
        throw error;
      }
    },
    retry: 2
  });
  
  const { data: dealsData, isLoading: dealsLoading, error: dealsError } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('deals')
          .select('*');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching deals:", error);
        throw error;
      }
    },
    retry: 2
  });
  
  // Process data for the velocity chart
  const velocityData = useMemo(() => {
    if (!stagesData || !dealsData) return [];
    
    return stagesData.map((stage) => {
      const stageDeals = dealsData.filter(deal => deal.stage === stage.id && deal.created_at && deal.updated_at);
      
      // Calculate average time spent in this stage (in days)
      let avgDays = 0;
      if (stageDeals.length > 0) {
        const totalDays = stageDeals.reduce((sum, deal) => {
          const createdDate = new Date(deal.created_at);
          const updatedDate = new Date(deal.updated_at);
          const diffTime = Math.abs(updatedDate.getTime() - createdDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }, 0);
        
        avgDays = totalDays / stageDeals.length;
      }
      
      return {
        name: stage.name,
        days: parseFloat(avgDays.toFixed(1)),
        count: stageDeals.length,
        color: stage.color || "#4f46e5"
      };
    });
  }, [stagesData, dealsData]);
  
  const isLoading = stagesLoading || dealsLoading;
  const hasError = stagesError || dealsError;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Velocity</CardTitle>
        <CardDescription>
          Average time deals spend in each pipeline stage (days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[350px] w-full" />
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">Failed to load velocity data</p>
            <p className="text-sm text-slate-500 mt-2">Please try refreshing the page</p>
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={velocityData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={120}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "days") {
                      return [`${value} days`, "Avg. Time"];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="days" 
                  name="Average Days"
                  radius={[0, 4, 4, 0]}
                >
                  {velocityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

