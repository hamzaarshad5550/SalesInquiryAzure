import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ResponsiveContainer, 
  FunnelChart, 
  Funnel, 
  LabelList,
  Tooltip,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercentage } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { AlertCircle } from "lucide-react";

export function ConversionFunnel() {
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
  
  // Process data for the funnel chart
  const funnelData = useMemo(() => {
    if (!stagesData || !dealsData) return [];
    
    const result = stagesData.map((stage) => {
      const stageDeals = dealsData.filter(deal => deal.stage === stage.id);
      
      return {
        name: stage.name,
        value: stageDeals.length,
        fill: stage.color || "#4f46e5"
      };
    });
    
    return result;
  }, [stagesData, dealsData]);
  
  const isLoading = stagesLoading || dealsLoading;
  const hasError = stagesError || dealsError;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>
          Deal progression through your sales pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[350px] w-full" />
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">Failed to load funnel data</p>
            <p className="text-sm text-slate-500 mt-2">Please try refreshing the page</p>
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  <LabelList
                    position="right"
                    fill="#000"
                    stroke="none"
                    dataKey="name"
                  />
                  <LabelList
                    position="right"
                    fill="#666"
                    stroke="none"
                    dataKey="value"
                    offset={40}
                  />
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
