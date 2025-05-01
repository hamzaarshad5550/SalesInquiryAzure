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
import { Download } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("this-month");

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
            <Button className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

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
