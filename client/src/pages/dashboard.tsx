import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MetricsSection } from "@/components/dashboard/metrics-section";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { PipelineOverview } from "@/components/dashboard/pipeline-overview";
import { TasksList } from "@/components/dashboard/tasks-list";
import { RecentContacts } from "@/components/dashboard/recent-contacts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { 
  Download,
  FileText,
  Plus,
  User,
  Clock,
  Check,
  X,
  Calendar,
  Users,
  Bell
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Papa from 'papaparse';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("this-month");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Fetch dashboard data for export
  const { data: metricsData } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: salesData } = useQuery({
    queryKey: ['/api/dashboard/sales-performance', { period: timeRange }],
  });

  // Handle Export button click
  const handleExport = () => {
    // Combine data for export
    const exportData = {
      metrics: metricsData || {},
      sales: salesData?.salesData || [],
      exportDate: new Date().toISOString(),
      timeRange: timeRange
    };

    // Convert to CSV
    const csv = Papa.unparse(
      // Flatten nested data for CSV format
      [
        {
          exportDate: exportData.exportDate,
          timeRange: exportData.timeRange,
          totalRevenue: exportData.metrics.totalRevenue || 0,
          totalDeals: exportData.metrics.totalDeals || 0,
          conversionRate: exportData.metrics.conversionRate || 0,
        },
        ...((exportData.sales || []).map(item => ({
          period: item.name,
          current: item.current,
          previous: item.previous
        })))
      ]
    );

    // Create a download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dashboard-export-${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show toast notification
    toast({
      title: "Export successful",
      description: `Data exported as CSV for ${timeRange}`,
      duration: 3000,
    });
  };

  // Navigate to tasks page with new task form open
  const handleAddTask = () => {
    navigate("/tasks");
    setIsTaskDialogOpen(false);
  };

  // Navigate to pipeline page with new deal form open
  const handleAddDeal = () => {
    navigate("/pipeline");
    setIsDealDialogOpen(false);
  };

  // Navigate to contacts page with new contact form open
  const handleAddContact = () => {
    navigate("/contacts/new");
    setIsContactDialogOpen(false);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button className="flex items-center" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-md">Quick Actions</CardTitle>
          <CardDescription>Create and manage your CRM items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  New Deal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                  <DialogDescription>
                    Add a new deal to your sales pipeline.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Would you like to create a new deal in the pipeline?</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDealDialogOpen(false)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleAddDeal}>
                    <Check className="mr-2 h-4 w-4" />
                    Continue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Users className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact to your CRM.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Would you like to add a new contact?</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleAddContact}>
                    <Check className="mr-2 h-4 w-4" />
                    Continue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Clock className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your schedule.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Would you like to create a new task?</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleAddTask}>
                    <Check className="mr-2 h-4 w-4" />
                    Continue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <MetricsSection />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <SalesChart />
          <PipelineOverview />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <TasksList />
          <RecentContacts />
          <ActivityFeed />
        </div>
      </div>
    </main>
  );
}
