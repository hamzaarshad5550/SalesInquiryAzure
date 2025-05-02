import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

// Color constants for charts
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--success))"
];

// Types for the analytics data
type SalesPerformance = {
  name: string;
  current: number;
  previous: number;
};

type DealsByStage = {
  name: string;
  value: number;
  color: string;
}

type LeadSource = {
  name: string;
  value: number;
  color: string;
}

type TopSalesPerson = {
  id: number;
  name: string;
  deals: number;
  revenue: number;
}

type MetricTile = {
  title: string;
  value: number | string;
  change: number;
  changeType: "increase" | "decrease";
  format: "currency" | "percentage" | "number";
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<string>("monthly");
  
  // Fetch analytics data from API
  const { data: salesPerformanceData, isLoading: isSalesPerformanceLoading } = useQuery({
    queryKey: ['/api/dashboard/sales-performance', { period: timeRange }],
  });

  const { data: dealsByStageData, isLoading: isDealsByStageLoading } = useQuery({
    queryKey: ['/api/analytics/deals-by-stage'],
  });

  const { data: leadSourceData, isLoading: isLeadSourceLoading } = useQuery({
    queryKey: ['/api/analytics/lead-sources'],
  });

  const { data: topSalesData, isLoading: isTopSalesLoading } = useQuery({
    queryKey: ['/api/analytics/top-sales'],
  });

  const { data: metricsData, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
  });

  // Mock data until API is connected
  const dealsByStage: DealsByStage[] = [
    { name: "Lead", value: 25, color: COLORS[0] },
    { name: "Qualified", value: 18, color: COLORS[1] },
    { name: "Proposal", value: 12, color: COLORS[2] },
    { name: "Negotiation", value: 8, color: COLORS[3] },
    { name: "Closed", value: 15, color: COLORS[4] }
  ];

  const leadSources: LeadSource[] = [
    { name: "Website", value: 38, color: COLORS[0] },
    { name: "Referral", value: 22, color: COLORS[1] },
    { name: "Social Media", value: 15, color: COLORS[2] },
    { name: "Email", value: 12, color: COLORS[3] },
    { name: "Events", value: 8, color: COLORS[4] }
  ];

  const topSalesPersons: TopSalesPerson[] = [
    { id: 1, name: "Sarah Johnson", deals: 12, revenue: 85000 },
    { id: 2, name: "Michael Chen", deals: 10, revenue: 72000 },
    { id: 3, name: "Emma Rodriguez", deals: 8, revenue: 65000 },
    { id: 4, name: "James Wilson", deals: 7, revenue: 58000 },
    { id: 5, name: "Maria Garcia", deals: 6, revenue: 48000 }
  ];

  const metrics: MetricTile[] = [
    { 
      title: "Total Revenue", 
      value: 325000, 
      change: 12.5, 
      changeType: "increase", 
      format: "currency" 
    },
    { 
      title: "Conversion Rate", 
      value: 28.5, 
      change: 3.2, 
      changeType: "increase", 
      format: "percentage" 
    },
    { 
      title: "Average Deal Size", 
      value: 15000, 
      change: -2.3, 
      changeType: "decrease", 
      format: "currency" 
    },
    { 
      title: "New Leads", 
      value: 127, 
      change: 18.7, 
      changeType: "increase", 
      format: "number" 
    }
  ];

  // Format value based on type
  const formatMetricValue = (value: number | string, format: string) => {
    if (format === "currency") {
      return formatCurrency(Number(value));
    } else if (format === "percentage") {
      return formatPercentage(Number(value));
    }
    return value;
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          
          <div className="flex flex-wrap items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isMetricsLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-24 mb-1" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-8 w-32 mb-3" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          // Actual metrics
          metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-slate-500">{metric.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">
                  {formatMetricValue(metric.value, metric.format)}
                </div>
                <div className={`flex items-center text-sm mt-1 ${
                  metric.changeType === "increase" 
                    ? "text-success" 
                    : "text-destructive"
                }`}>
                  {metric.changeType === "increase" ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(metric.change)}%
                  <span className="text-slate-500 ml-1">vs previous period</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts section */}
      <Tabs defaultValue="performance" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="performance">
            <LineChartIcon className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="deals">
            <BarChart3 className="h-4 w-4 mr-2" />
            Deals
          </TabsTrigger>
          <TabsTrigger value="sources">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Lead Sources
          </TabsTrigger>
        </TabsList>
        
        {/* Sales Performance Chart */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance Over Time</CardTitle>
              <CardDescription>
                Compare current period vs previous period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSalesPerformanceLoading ? (
                <div className="flex items-center justify-center h-80">
                  <Skeleton className="h-72 w-full rounded-lg" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={salesPerformanceData?.salesData || []}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="current"
                      name="Current Period"
                      stroke={COLORS[0]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="previous"
                      name="Previous Period"
                      stroke={COLORS[1]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Deals by Stage Chart */}
        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle>Deals by Pipeline Stage</CardTitle>
              <CardDescription>
                Current distribution of deals across pipeline stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDealsByStageLoading ? (
                <div className="flex items-center justify-center h-80">
                  <Skeleton className="h-72 w-full rounded-lg" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={dealsByStage}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Number of Deals">
                      {dealsByStage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Lead Sources Chart */}
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
              <CardDescription>
                Where your leads are coming from
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col lg:flex-row items-center justify-between">
              {isLeadSourceLoading ? (
                <div className="flex items-center justify-center h-80 w-full">
                  <Skeleton className="h-72 w-72 rounded-full" />
                </div>
              ) : (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width={300} height={300}>
                      <PieChart>
                        <Pie
                          data={leadSources}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {leadSources.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value} leads`, "Count"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="lg:w-1/2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {leadSources.map((source, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-4 h-4 mr-2 rounded-full" 
                            style={{ backgroundColor: source.color }}
                          ></div>
                          <div className="flex-1">
                            <div className="font-medium">{source.name}</div>
                            <div className="text-slate-500 text-sm">
                              {source.value} leads ({((source.value / leadSources.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Sales Performers</CardTitle>
          <CardDescription>
            Team members with highest revenue in current period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTopSalesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center p-2">
                  <Skeleton className="h-10 w-10 rounded-full mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {topSalesPersons.map((person, index) => (
                <div 
                  key={index}
                  className="flex items-center py-3 px-2 border-b dark:border-slate-700 last:border-0"
                >
                  <div className="mr-4">
                    <div className="bg-primary/10 text-primary font-bold h-10 w-10 rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{person.name}</p>
                    <p className="text-sm text-slate-500">{person.deals} deals closed</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(person.revenue)}</p>
                    <p className="text-sm text-slate-500">Total revenue</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}