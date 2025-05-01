import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type DealCardProps = {
  deal: {
    id: string;
    name: string;
    value: number;
    description: string;
    updatedAt: string;
    owner: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  };
  badgeColor: string;
};

function DealCard({ deal, badgeColor }: DealCardProps) {
  const initials = deal.owner.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Calculate time since update
  const updatedDate = new Date(deal.updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let timeAgo = '';
  if (diffDays === 0) {
    timeAgo = 'Today';
  } else if (diffDays === 1) {
    timeAgo = 'Yesterday';
  } else if (diffDays < 7) {
    timeAgo = `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    timeAgo = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    timeAgo = updatedDate.toLocaleDateString();
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium">{deal.name}</span>
        <Badge variant="outline" className={`bg-${badgeColor}-100 dark:bg-${badgeColor}-900/30 text-${badgeColor}-700 dark:text-${badgeColor}-300 border-transparent`}>
          {formatCurrency(deal.value)}
        </Badge>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{deal.description}</p>
      <div className="flex items-center justify-between mt-3">
        <div className="flex -space-x-1">
          <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-800">
            <AvatarImage src={deal.owner.avatarUrl} alt={deal.owner.name} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{timeAgo}</span>
      </div>
    </div>
  );
}

export function PipelineOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/pipeline/overview'],
  });

  const stages = isLoading ? [] : data?.stages || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Pipeline Overview</CardTitle>
        <Link href="/pipeline" className="text-primary hover:text-primary-700 text-sm font-medium flex items-center">
          View Full Pipeline
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 ml-1" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M5 12h14"/>
            <path d="m12 5 7 7-7 7"/>
          </svg>
        </Link>
      </CardHeader>
      <CardContent className="-mx-5 px-5">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-5 pb-4 min-w-max">
            {isLoading ? (
              // Skeleton loaders for stages
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="pipeline-column bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Skeleton className="h-2 w-2 rounded-full mr-2" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-6 ml-2 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                  
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                </div>
              ))
            ) : (
              stages.map((stage) => (
                <div key={stage.id} className="pipeline-column bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm flex items-center">
                      <span className={`w-2 h-2 rounded-full bg-${stage.color} mr-2`}></span>
                      {stage.name}
                      <span className="ml-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs px-2">
                        {stage.deals.length}
                      </span>
                    </h3>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {formatCurrency(stage.totalValue)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {stage.deals.slice(0, 2).map((deal) => (
                      <DealCard 
                        key={deal.id} 
                        deal={deal} 
                        badgeColor={stage.color}
                      />
                    ))}
                    {stage.deals.length > 2 && (
                      <Link href="/pipeline" className="text-center block text-xs text-primary hover:text-primary-600 pt-1">
                        +{stage.deals.length - 2} more deals
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
