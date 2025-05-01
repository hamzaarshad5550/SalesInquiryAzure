import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Briefcase, LineChart, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type MetricCardProps = {
  title: string;
  value: string;
  percentChange: number;
  icon: React.ReactNode;
  iconBgClass: string;
  isLoading?: boolean;
};

function MetricCard({
  title,
  value,
  percentChange,
  icon,
  iconBgClass,
  isLoading = false,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
            )}
            <div className="flex items-center mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <>
                  <span className={`text-xs font-medium flex items-center ${percentChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {percentChange >= 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m18 15-6-6-6 6"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    )}
                    {Math.abs(percentChange)}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">vs last month</span>
                </>
              )}
            </div>
          </div>
          <div className={`w-12 h-12 ${iconBgClass} rounded-full flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total Revenue"
        value={isLoading ? "" : formatCurrency(data?.totalRevenue || 0)}
        percentChange={isLoading ? 0 : data?.totalRevenueChange || 0}
        icon={<DollarSign className="text-lg text-primary-500" />}
        iconBgClass="bg-primary-50 dark:bg-primary-900/30"
        isLoading={isLoading}
      />
      <MetricCard
        title="Active Deals"
        value={isLoading ? "" : String(data?.activeDeals || 0)}
        percentChange={isLoading ? 0 : data?.activeDealsChange || 0}
        icon={<Briefcase className="text-lg text-secondary-500" />}
        iconBgClass="bg-secondary-50 dark:bg-secondary-900/30"
        isLoading={isLoading}
      />
      <MetricCard
        title="Conversion Rate"
        value={isLoading ? "" : `${data?.conversionRate || 0}%`}
        percentChange={isLoading ? 0 : data?.conversionRateChange || 0}
        icon={<LineChart className="text-lg text-accent-500" />}
        iconBgClass="bg-accent-50 dark:bg-accent-900/30"
        isLoading={isLoading}
      />
      <MetricCard
        title="New Contacts"
        value={isLoading ? "" : String(data?.newContacts || 0)}
        percentChange={isLoading ? 0 : data?.newContactsChange || 0}
        icon={<UserPlus className="text-lg text-slate-500 dark:text-slate-300" />}
        iconBgClass="bg-slate-100 dark:bg-slate-700"
        isLoading={isLoading}
      />
    </div>
  );
}
