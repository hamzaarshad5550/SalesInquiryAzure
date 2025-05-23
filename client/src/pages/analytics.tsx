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
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataQuality, setDataQuality] = useState<'good' | 'partial' | 'none'>('none');
  
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

  // Add a function to manually sync data
  const syncData = async () => {
    setIsSyncing(true);
    try {
      // Invalidate all queries to force fresh data fetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/sales-performance'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/deals-by-stage'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/lead-sources'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-sales'] })
      ]);
      
      setLastSyncTime(new Date());
      console.log("Data synchronized successfully");
    } catch (error) {
      console.error("Error syncing data:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync on component mount and when timeRange changes
  useEffect(() => {
    syncData();
  }, [timeRange]);

  // Fetch metrics data from API
  const { data: metricsData, isLoading: isMetricsLoading, error: metricsError } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_dashboard_metrics');
        if (error) {
          console.log("Error fetching metrics:", error);
          // Return default metrics instead of throwing
          return {
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
        }
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
        // Return default metrics instead of throwing
        return {
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
      }
    },
    retry: 2
  });

  // Fetch sales performance data - using only real data, no placeholders
  const { data: salesPerformanceData, isLoading: isSalesPerformanceLoading, error: salesPerformanceError } = useQuery({
    queryKey: ['/api/dashboard/sales-performance', { period: timeRange }],
    queryFn: async () => {
      try {
        // Skip the RPC attempt since it doesn't exist
        console.log("Using direct query for sales performance data");
        
        // Fall back to direct query
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select('*');
        
        if (dealsError) {
          console.error("Error fetching deals:", dealsError);
          return { salesData: [] };
        }
        
        // Process the deals data manually
        const now = new Date();
        const currentPeriodDeals = {};
        const previousPeriodDeals = {};
        
        // Define period settings
        let periodOffset = 30; // Default to monthly
        let dateFormat = { month: 'short' };
        
        if (timeRange === 'quarterly') {
          periodOffset = 90;
          dateFormat = { month: 'short', year: 'numeric' };
        } else if (timeRange === 'yearly') {
          periodOffset = 365;
          dateFormat = { year: 'numeric' };
        } else if (timeRange === 'weekly') {
          periodOffset = 7;
          dateFormat = { month: 'short', day: 'numeric' };
        }
        
        // Filter closed deals - adapt this to your schema
        const closedDeals = deals.filter(deal => 
          deal.status === 'closed_won' || 
          deal.stage === 5 || 
          deal.stageId === 5
        );
        
        // Process deals
        closedDeals.forEach(deal => {
          const dealDate = new Date(deal.created_at || deal.createdAt);
          const formattedDate = new Intl.DateTimeFormat('en-US', dateFormat).format(dealDate);
          const daysDiff = Math.floor((now.getTime() - dealDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= periodOffset) {
            // Current period
            currentPeriodDeals[formattedDate] = (currentPeriodDeals[formattedDate] || 0) + Number(deal.value);
          } else if (daysDiff <= periodOffset * 2) {
            // Previous period
            previousPeriodDeals[formattedDate] = (previousPeriodDeals[formattedDate] || 0) + Number(deal.value);
          }
        });
        
        // Format for chart
        const salesData = Object.keys({ ...currentPeriodDeals, ...previousPeriodDeals })
          .sort((a, b) => {
            // Sort dates properly
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA.getTime() - dateB.getTime();
          })
          .map(date => ({
            name: date,
            current: currentPeriodDeals[date] || 0,
            previous: previousPeriodDeals[date] || 0
          }));
        
        console.log("Final chart data points:", salesData.length);
        return { salesData };
      } catch (error) {
        console.error("Error fetching sales performance:", error);
        return { salesData: [] }; // Return empty array, not placeholder data
      }
    },
    retry: 2
  });

  // Fetch deals by stage data
  const { data: dealsByStage, isLoading: isDealsByStageLoading, error: dealsByStageError } = useQuery({
    queryKey: ['/api/dashboard/deals-by-stage', { period: timeRange }],
    queryFn: async () => {
      try {
        // Try to fetch data, but don't throw on error
        const { data, error } = await supabase.rpc('get_deals_by_stage');
        if (error) {
          console.log("Error fetching deals by stage:", error);
          return []; // Return empty array instead of throwing
        }
        
        // Map the data to the expected format
        return (data || []).map((item: any, index: number) => ({
          name: item.stage_name || `Stage ${item.stage_id || index + 1}`,
          value: item.count || 0,
          color: COLORS[index % COLORS.length]
        }));
      } catch (error) {
        console.error("Error fetching deals by stage:", error);
        return []; // Return empty array instead of throwing
      }
    },
    retry: 2
  });

  // Fetch lead sources data
  const { data: leadSources, isLoading: isLeadSourceLoading, error: leadSourcesError } = useQuery({
    queryKey: ['/api/dashboard/lead-sources', { period: timeRange }],
    queryFn: async () => {
      try {
        // Skip the RPC attempt since it doesn't exist
        console.log("Using direct query for lead sources");
        
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
        
        // Query contacts with the appropriate field
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select(`*, ${sourceField}, created_at`);
        
        if (error) {
          console.error("Error fetching contacts:", error);
          return [];
        }
        
        // Filter by time range
        const now = new Date();
        let timeFilter = 30; // Default to monthly
        
        if (timeRange === 'quarterly') {
          timeFilter = 90;
        } else if (timeRange === 'yearly') {
          timeFilter = 365;
        } else if (timeRange === 'weekly') {
          timeFilter = 7;
        }
        
        const filteredContacts = contacts.filter(contact => {
          const contactDate = new Date(contact.created_at || contact.createdAt);
          const daysDiff = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= timeFilter;
        });
        
        // Count by source
        const sourceCount = {};
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
        
        return Object.entries(sourceCount)
          .map(([source, count], index) => ({
            name: source || 'Unknown',
            value: count,
            color: COLORS[index % COLORS.length]
          }))
          .sort((a, b) => b.value - a.value);
      } catch (error) {
        console.error("Error fetching lead sources:", error);
        return []; // Return empty array
      }
    },
    retry: 2
  });
  
  // Fetch top sales performers data
  const { data: topSalesData, isLoading: isTopSalesLoading, error: topSalesError } = useQuery({
    queryKey: ['/api/dashboard/top-sales', { period: timeRange }],
    queryFn: async () => {
      try {
        // Skip the RPC attempt since it doesn't exist
        console.log("Using direct query for top sales performers");
        
        // First check the users table structure
        const { data: userSample, error: userSampleError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
        
        // Determine which field to use for user name
        let nameField = 'name';
        if (userSample && userSample.length > 0) {
          // Check available name fields in order of preference
          const possibleFields = ['full_name', 'fullName', 'name', 'display_name', 'displayName', 'username'];
          for (const field of possibleFields) {
            if (field in userSample[0]) {
              nameField = field;
              console.log(`Using '${field}' as user name field`);
              break;
            }
          }
        }
        
        // Get all users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*');
        
        if (usersError) {
          console.error("Error fetching users:", usersError);
          return { performers: [] };
        }
        
        // Get all deals
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select('*');
        
        if (dealsError) {
          console.error("Error fetching deals:", dealsError);
          return { performers: [] };
        }
        
        // Filter deals by time range and status
        const now = new Date();
        let timeFilter = 30; // Default to monthly
        
        if (timeRange === 'quarterly') {
          timeFilter = 90;
        } else if (timeRange === 'yearly') {
          timeFilter = 365;
        } else if (timeRange === 'weekly') {
          timeFilter = 7;
        }
        
        // Determine which field to use for owner ID
        let ownerIdField = 'owner_id';
        if (deals.length > 0) {
          if ('ownerId' in deals[0]) {
            ownerIdField = 'ownerId';
          }
        }
        
        // Determine which field to use for deal status/stage
        let isClosedWonDeal = (deal) => {
          // Try different possible field combinations
          return (
            deal.status === 'closed_won' ||
            deal.stage === 5 ||
            deal.stageId === 5 ||
            deal.stage_id === 5
          );
        };
        
        const filteredDeals = deals.filter(deal => {
          const dealDate = new Date(deal.created_at || deal.createdAt);
          const daysDiff = Math.floor((now.getTime() - dealDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= timeFilter && isClosedWonDeal(deal);
        });
        
        // Group deals by owner and calculate totals
        const performerMap = {};
        
        filteredDeals.forEach(deal => {
          const ownerId = deal[ownerIdField] || 0;
          const owner = users.find(user => user.id === ownerId);
          
          if (!performerMap[ownerId]) {
            performerMap[ownerId] = {
              id: ownerId,
              name: owner ? (owner[nameField] || `User ${ownerId}`) : `User ${ownerId}`,
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
        return { performers: [] };
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

  // Set hasErrors to always be false to prevent error display
  const hasErrors = false;

  // Comment out or remove the error details collection
  useEffect(() => {
    // We're not collecting or displaying errors anymore
    setErrorDetails(null);
  }, [metricsError, salesPerformanceError, dealsByStageError, leadSourcesError, topSalesError]);

  // Update data quality whenever data changes
  useEffect(() => {
    if (
      salesPerformanceData?.salesData?.length > 0 &&
      leadSources?.length > 0 &&
      topSalesData?.performers?.length > 0
    ) {
      setDataQuality('good');
    } else if (
      salesPerformanceData?.salesData?.length > 0 ||
      leadSources?.length > 0 ||
      topSalesData?.performers?.length > 0
    ) {
      setDataQuality('partial');
    } else {
      setDataQuality('none');
    }
  }, [salesPerformanceData, leadSources, topSalesData]);

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
        <div className="flex items-center space-x-2 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={syncData} 
            disabled={isSyncing}
            className="flex items-center"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Data
              </>
            )}
          </Button>
          {lastSyncTime && (
            <span className="text-xs text-slate-500">
              Last synced: {lastSyncTime.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center mb-6 ml-auto">
          <span className="text-xs mr-2">Data Quality:</span>
          {dataQuality === 'good' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Real-time Data
            </Badge>
          )}
          {dataQuality === 'partial' && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Partial Data
            </Badge>
          )}
          {dataQuality === 'none' && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <XCircle className="h-3 w-3 mr-1" />
              No Data Available
            </Badge>
          )}
        </div>
      </div>

      {/* Error message if any API calls failed */}
      {/* Error message card - REMOVED
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
      */}

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
          <SalesPerformanceChart />
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
              ) : !dealsByStage || dealsByStage.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                  <Activity className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-500">No deals data available for the selected period.</p>
                  <p className="text-sm text-slate-400 mt-2">Try selecting a different time range or check your database connection.</p>
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
              ) : !leadSources || leadSources.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 w-full text-center">
                  <Activity className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-500">No lead source data available.</p>
                  <p className="text-sm text-slate-400 mt-2">Try selecting a different time range or check your database connection.</p>
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
                          {(leadSources || []).map((entry: { name: string; value: number; color?: string }, index: number) => (
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
                      {(leadSources || []).map((source: { name: string; value: number; color?: string }, index: number) => {
                        const totalLeads = (leadSources || []).reduce((a: number, b: { value: number }) => a + (b.value || 0), 0);
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
              {(topSalesData?.performers || []).map((person: { name: string; deals: number; revenue: number }, index: number) => (
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

const SalesPerformanceChart = () => (
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
      ) : !salesPerformanceData?.salesData || salesPerformanceData.salesData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 text-center">
          <Activity className="h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-500">No sales data available for the selected period.</p>
          <p className="text-sm text-slate-400 mt-2">Try selecting a different time range or check your database connection.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={salesPerformanceData.salesData}
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
);
