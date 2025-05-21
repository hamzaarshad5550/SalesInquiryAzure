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
  Cell,
  ReferenceLine,
  Label
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercentage } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { AlertCircle } from "lucide-react";

type StageProbability = {
  id: number;
  name: string;
  probability: number;
  count: number;
  color: string;
  avgDealSize: number;
};

export function SalesProbabilityChart() {
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
  
  // Process data for the chart
  const probabilityData = useMemo(() => {
    if (!stagesData || !dealsData) return [];
    
    return stagesData.map((stage) => {
      const stageDeals = dealsData.filter(deal => deal.stage === stage.id);
      const wonDeals = stageDeals.filter(deal => deal.status === 'closed_won');
      
      // Calculate win probability
      const probability = stageDeals.length > 0 
        ? (wonDeals.length / stageDeals.length) * 100 
        : 0;
      
      // Calculate average deal size
      const totalValue = stageDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
      const avgDealSize = stageDeals.length > 0 ? totalValue / stageDeals.length : 0;
      
      return {
        id: stage.id,
        name: stage.name,
        probability: parseFloat(probability.toFixed(1)),
        count: stageDeals.length,
        color: stage.color || "#4f46e5",
        avgDealSize
      };
    });
  }, [stagesData, dealsData]);
  
  const isLoading = stagesLoading || dealsLoading;
  const hasError = stagesError || dealsError;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Probability by Pipeline Stage</CardTitle>
        <CardDescription>
          Win probability across different stages of your sales pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[350px] w-full" />
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">Failed to load probability data</p>
            <p className="text-sm text-slate-500 mt-2">Please try refreshing the page</p>
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={probabilityData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "probability") {
                      return [`${value}%`, "Win Probability"];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="probability" 
                  name="Win Probability"
                  radius={[4, 4, 0, 0]}
                >
                  {probabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <ReferenceLine y={50} stroke="#ff0000" strokeDasharray="3 3">
                  <Label value="50% Threshold" position="insideBottomRight" />
                </ReferenceLine>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
