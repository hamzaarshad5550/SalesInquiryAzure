import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ChartPeriod = "monthly" | "quarterly" | "yearly";

export function SalesChart() {
  const [period, setPeriod] = useState<ChartPeriod>("monthly");
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/dashboard/sales-performance', period],
  });

  const chartData = isLoading ? [] : data?.salesData || [];

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-0">
        <CardTitle>Sales Performance</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={period === "monthly" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("monthly")}
            className={period === "monthly" 
              ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300" 
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}
          >
            Monthly
          </Button>
          <Button
            variant={period === "quarterly" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("quarterly")}
            className={period === "quarterly" 
              ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300" 
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}
          >
            Quarterly
          </Button>
          <Button
            variant={period === "yearly" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("yearly")}
            className={period === "yearly" 
              ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300" 
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}
          >
            Yearly
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ 
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.375rem",
                    color: "var(--card-foreground)"
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  name="Sales"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
