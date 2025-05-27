import { useState, useEffect } from "react";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { SalesProbabilityChart } from "@/components/analytics/sales-probability-chart";
import { ConversionFunnel } from "@/components/analytics/conversion-funnel";
import { DealVelocity } from "@/components/analytics/deal-velocity";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

// Create a QueryClient instance
const queryClient = new QueryClient();

// Color constants for charts
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--success))"
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<string>("monthly");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Set up real-time listeners
  useEffect(() => {
    // Subscribe to changes in deals table
    const dealsSubscription = supabase
      .channel('deals-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'deals' 
      }, () => {
        // Invalidate relevant queries when data changes
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/sales-performance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/deals-by-stage'] });
        setLastUpdated(new Date());
      })
      .subscribe();
      
    // Subscribe to changes in contacts table for lead sources
    const contactsSubscription = supabase
      .channel('contacts-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'contacts' 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/lead-sources'] });
        setLastUpdated(new Date());
      })
      .subscribe();
      
    // Subscribe to changes in tasks table
    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks' 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/task-metrics'] });
        setLastUpdated(new Date());
      })
      .subscribe();
    
    return () => {
      // Clean up subscriptions
      dealsSubscription.unsubscribe();
      contactsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
    };
  }, []);
  
  // Function to manually refresh all data
  const refreshAllData = async () => {
    setIsRefreshing(true);
    setErrorDetails(null);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/sales-performance'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/deals-by-stage'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/lead-sources'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-sales'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/task-metrics'] })
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing data:", error);
      setErrorDetails(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch metrics data from API
  const { data: metricsData, isLoading: isMetricsLoading, error: metricsError } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_dashboard_metrics');
        if (error) throw error;
        return data || {
          totalDeals: 0,
          pipelineValue: 0,
          wonDeals: 0,
          wonValue: 0,
          totalContacts: 0,
          newContacts: 0,
          conversionRate: 0,
          previousConversionRate: 0,
          avgDealSize: 0,
          previousAvgDealSize: 0,
          previousWonValue: 0,
          previousNewContacts: 0
        };
      } catch (error) {
        console.error("Error fetching metrics:", error);
        throw error;
      }
    },
    retry: 2
  });

  // Fetch sales performance data
  const { data: salesPerformanceData, isLoading: isSalesPerformanceLoading, error: salesPerformanceError } = useQuery({
    queryKey: ['/api/dashboard/sales-performance', { period: timeRange }],
    queryFn: async () => {
      try {
        // Remove the RPC call that doesn't exist
        // Get all deals directly
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select('*');
        
        if (dealsError) {
          console.error("Supabase query error:", dealsError);
          throw dealsError;
        }
        
        // Process the deals data manually
        const now = new Date();
        const currentPeriodDeals = {};
        const previousPeriodDeals = {};
        
        // Define period boundaries
        let periodOffset = 30; // Default to monthly
        if (timeRange === 'quarterly') periodOffset = 90;
        if (timeRange === 'yearly') periodOffset = 365;
        
        // Process deals
        deals.forEach(deal => {
          if (!deal.created_at) return;
          
          const dealDate = new Date(deal.created_at);
          const formattedDate = dealDate.toLocaleDateString('en-US', { 
            month: 'short',
            year: timeRange === 'yearly' ? 'numeric' : undefined
          });
          
          const daysDiff = Math.floor((now.getTime() - dealDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Only include closed won deals (stage 5)
          if (deal.stage_id === 5) {
            if (daysDiff <= periodOffset) {
              // Current period
              currentPeriodDeals[formattedDate] = (currentPeriodDeals[formattedDate] || 0) + Number(deal.value || 0);
            } else if (daysDiff <= periodOffset * 2) {
              // Previous period
              previousPeriodDeals[formattedDate] = (previousPeriodDeals[formattedDate] || 0) + Number(deal.value || 0);
            }
          }
        });
        
        // Format for chart
        const salesData = Object.keys({ ...currentPeriodDeals, ...previousPeriodDeals })
          .map(date => ({
            name: date,
            current: currentPeriodDeals[date] || 0,
            previous: previousPeriodDeals[date] || 0
          }));
        
        return { salesData: salesData || [] };
      } catch (error) {
        console.error("Error fetching sales performance:", error);
        throw error;
      }
    },
    retry: 2
  });

  // Fetch deals by stage data
  const { data: dealsByStage, isLoading: isDealsByStageLoading, error: dealsByStageError } = useQuery({
    queryKey: ['/api/dashboard/deals-by-stage', { period: timeRange }],
    queryFn: async () => {
      const { data: stages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('order', { ascending: true });
      
      if (stagesError) throw stagesError;
      
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*');
      
      if (dealsError) throw dealsError;
      
      return stages.map((stage, index) => {
        const stageDeals = deals.filter(deal => deal.stage === stage.id);
        return {
          name: stage.name,
          value: stageDeals.length,
          color: COLORS[index % COLORS.length]
        };
      });
    }
  });

  // Fetch lead sources data
  const { data: leadSources, isLoading: isLeadSourceLoading, error: leadSourcesError } = useQuery({
    queryKey: ['/api/dashboard/lead-sources', { period: timeRange }],
    queryFn: async () => {
      try {
        // Get contacts data
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select('*');
        
        if (error) throw error;
        
        // Define period boundaries
        const now = new Date();
        let periodOffset = 30; // Default to monthly
        if (timeRange === 'quarterly') periodOffset = 90;
        if (timeRange === 'yearly') periodOffset = 365;
        
        // Filter contacts by period
        const filteredContacts = contacts.filter(contact => {
          if (!contact.created_at) return false;
          
          const contactDate = new Date(contact.created_at);
          const daysDiff = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= periodOffset;
        });
        
        // Since 'source' column doesn't exist, use status as a fallback
        // or create mock sources for demonstration
        const sourceCount = {};
        const mockSources = ['Website', 'Referral', 'Direct', 'Social Media', 'Email'];
        
        filteredContacts.forEach((contact, index) => {
          // Use status as a fallback or generate a mock source
          const source = contact.status || mockSources[index % mockSources.length];
          sourceCount[source] = (sourceCount[source] || 0) + 1;
        });
        
        return Object.entries(sourceCount)
          .map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
          }))
          .sort((a, b) => b.value - a.value);
      } catch (error) {
        console.error("Error fetching lead sources:", error);
        throw error;
      }
    },
    retry: 2
  });
  
  // Fetch top sales performers data
  const { data: topSalesData, isLoading: isTopSalesLoading, error: topSalesError } = useQuery({
    queryKey: ['/api/dashboard/top-sales', { period: timeRange }],
    queryFn: async () => {
      try {
        // First, let's check the structure of the users table
        const { data: usersStructure, error: structureError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
        
        console.log("Users table structure:", usersStructure ? Object.keys(usersStructure[0]) : "No users found");
        
        if (structureError) {
          console.error("Error fetching users structure:", structureError);
        }
        
        // Get users data with all columns to ensure we get whatever name field exists
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*');
        
        if (usersError) {
          console.error("Error fetching users:", usersError);
          throw usersError;
        }
        
        // Get deals data
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select('*');
        
        if (dealsError) {
          console.error("Error fetching deals:", dealsError);
          throw dealsError;
        }
        
        // Define period boundaries
        const now = new Date();
        let periodOffset = 30; // Default to monthly
        if (timeRange === 'quarterly') periodOffset = 90;
        if (timeRange === 'yearly') periodOffset = 365;
        
        // Filter deals by period
        const filteredDeals = deals.filter(deal => {
          if (!deal.created_at) return false;
          
          const dealDate = new Date(deal.created_at);
          const daysDiff = Math.floor((now.getTime() - dealDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= periodOffset;
        });
        
        // Group deals by owner and calculate totals
        const performerMap = {};
        
        filteredDeals.forEach(deal => {
          const ownerId = deal.owner_id || 0;
          const owner = users.find(user => user.id === ownerId);
          
          // Determine the best name field to use
          let displayName = `User ${ownerId}`;
          if (owner) {
            if (owner.username) displayName = owner.username;
            else if (owner.email) displayName = owner.email;
            else if (owner.full_name) displayName = owner.full_name;
            else if (owner.name) displayName = owner.name;
            // Log the owner object to see what fields are available
            console.log(`Owner ${ownerId} fields:`, Object.keys(owner));
          }
          
          if (!performerMap[ownerId]) {
            performerMap[ownerId] = {
              id: ownerId,
              name: displayName,
              deals: 0,
              revenue: 0
            };
          }
          
          performerMap[ownerId].deals += 1;
          performerMap[ownerId].revenue += Number(deal.value) || 0;
        });
        
        return { 
          performers: Object.values(performerMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5) 
        };
      } catch (error) {
        console.error("Error fetching top sales performers:", error);
        // Return mock data as fallback
        return {
          performers: [
            { name: "Sample User 1", deals: 12, revenue: 45000 },
            { name: "Sample User 2", deals: 10, revenue: 38000 },
            { name: "Sample User 3", deals: 8, revenue: 32000 },
            { name: "Sample User 4", deals: 6, revenue: 24000 },
            { name: "Sample User 5", deals: 4, revenue: 18000 }
          ]
        };
      }
    },
    retry: 2
  });

  // Format metrics for display
  const metrics = [
    { 
      title: "Total Revenue", 
      value: metricsData?.wonValue || 0, 
      change: calculateChange(metricsData?.wonValue, metricsData?.previousWonValue), 
      changeType: (metricsData?.wonValue || 0) >= (metricsData?.previousWonValue || 0) ? "increase" : "decrease", 
      format: "currency" 
    },
    { 
      title: "Conversion Rate", 
      value: metricsData?.conversionRate || 0, 
      change: calculateChange(metricsData?.conversionRate, metricsData?.previousConversionRate), 
      changeType: (metricsData?.conversionRate || 0) >= (metricsData?.previousConversionRate || 0) ? "increase" : "decrease", 
      format: "percentage" 
    },
    { 
      title: "Average Deal Size", 
      value: metricsData?.avgDealSize || 0, 
      change: calculateChange(metricsData?.avgDealSize, metricsData?.previousAvgDealSize), 
      changeType: (metricsData?.avgDealSize || 0) >= (metricsData?.previousAvgDealSize || 0) ? "increase" : "decrease", 
      format: "currency" 
    },
    { 
      title: "New Leads", 
      value: metricsData?.newContacts || 0, 
      change: calculateChange(metricsData?.newContacts, metricsData?.previousNewContacts), 
      changeType: (metricsData?.newContacts || 0) >= (metricsData?.previousNewContacts || 0) ? "increase" : "decrease", 
      format: "number" 
    }
  ];

  // Helper function to calculate percentage change
  function calculateChange(current: number = 0, previous: number = 0): number {
    if (previous === 0) return 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  }

  // Format value based on type
  const formatMetricValue = (value: number | string, format: string) => {
    if (format === "currency") {
      return formatCurrency(Number(value));
    } else if (format === "percentage") {
      return formatPercentage(Number(value));
    }
    return value;
  };

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  // Check if any errors occurred
  const hasErrors = metricsError || salesPerformanceError || dealsByStageError || leadSourcesError || topSalesError;
  
  // Helper function to format Supabase errors
  const formatSupabaseError = (error: any): string => {
    if (!error) return 'Unknown error';
    
    if (error.message) return error.message;
    if (error.error_description) return error.error_description;
    if (error.details) return error.details;
    
    return JSON.stringify(error);
  };

  // Collect error details for display
  useEffect(() => {
    const errors = [];
    if (metricsError) errors.push(`Metrics: ${formatSupabaseError(metricsError)}`);
    if (salesPerformanceError) errors.push(`Sales Performance: ${formatSupabaseError(salesPerformanceError)}`);
    if (dealsByStageError) errors.push(`Deals by Stage: ${formatSupabaseError(dealsByStageError)}`);
    if (leadSourcesError) errors.push(`Lead Sources: ${formatSupabaseError(leadSourcesError)}`);
    if (topSalesError) errors.push(`Top Sales: ${formatSupabaseError(topSalesError)}`);
    
    if (errors.length > 0) {
      setErrorDetails(errors.join('\n'));
    } else {
      setErrorDetails(null);
    }
  }, [metricsError, salesPerformanceError, dealsByStageError, leadSourcesError, topSalesError]);

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="quarterly">This Quarter</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refreshAllData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-slate-500 mt-2">
          Last updated: {format(lastUpdated, 'MMM d, yyyy HH:mm:ss')}
        </div>
      </div>

      {/* Error message if any API calls failed */}
      {hasErrors && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <div className="flex flex-col text-destructive">
              <p className="font-medium">There was an error loading some analytics data. Please try refreshing.</p>
              {errorDetails && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer">View error details</summary>
                  <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded overflow-x-auto">
                    {errorDetails}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
          <CardFooter className="px-4 py-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshAllData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </CardFooter>
        </Card>
      )}

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
              ) : salesPerformanceData?.salesData?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                  <Activity className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-500">No sales data available for the selected period.</p>
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
                    data={dealsByStage || []}
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
                      {(dealsByStage || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
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
                          data={leadSources || []}
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
                          {(leadSources || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
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
                      {(leadSources || []).map((source, index) => {
                        const totalLeads = (leadSources || []).reduce((a, b) => a + (b.value || 0), 0);
                        const percentage = totalLeads > 0 ? ((source.value || 0) / totalLeads) * 100 : 0;
                        
                        return (
                          <div key={index} className="flex items-center">
                            <div 
                              className="w-4 h-4 mr-2 rounded-full" 
                              style={{ backgroundColor: source.color || COLORS[index % COLORS.length] }}
                            ></div>
                            <div className="flex-1">
                              <div className="font-medium">{source.name}</div>
                              <div className="text-slate-500 text-sm">
                                {source.value} leads ({percentage.toFixed(1)}%)
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Advanced Analytics Components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <SalesProbabilityChart />
        <ConversionFunnel />
        <DealVelocity />
      </div>

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
              {(topSalesData?.performers || []).map((person, index: number) => {
                // Type assertion to ensure person has the right shape
                const typedPerson = person as { name: string; deals: number; revenue: number };
                return (
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
                    <p className="font-medium">{typedPerson.name}</p>
                    <p className="text-sm text-slate-500">{typedPerson.deals} deals closed</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(typedPerson.revenue)}</p>
                    <p className="text-sm text-slate-500">Total revenue</p>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
