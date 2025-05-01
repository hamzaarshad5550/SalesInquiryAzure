import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, ChevronDown } from "lucide-react";
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
  onDragStart: (e: React.DragEvent, dealId: string, currentStageId: string) => void;
};

function DealCard({ deal, badgeColor, onDragStart }: DealCardProps) {
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
    <div 
      className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e) => onDragStart(e, deal.id, deal.stageId)}
    >
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

export default function Pipeline() {
  const [filterUser, setFilterUser] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/pipeline', { user: filterUser, sort: sortBy }],
  });

  const stages = isLoading ? [] : data?.stages || [];
  const users = isLoading ? [] : data?.users || [];

  const handleDragStart = (e: React.DragEvent, dealId: string, currentStageId: string) => {
    e.dataTransfer.setData('dealId', dealId);
    e.dataTransfer.setData('currentStageId', currentStageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    const currentStageId = e.dataTransfer.getData('currentStageId');

    if (currentStageId !== targetStageId) {
      // Here you would call your API to update the deal's stage
      console.log(`Move deal ${dealId} from stage ${currentStageId} to ${targetStageId}`);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Pipeline</h1>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center">
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <ChevronDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="value-desc">Value (High to Low)</SelectItem>
                  <SelectItem value="value-asc">Value (Low to High)</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="ml-auto">
              <Plus className="mr-2 h-4 w-4" /> New Deal
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Sales Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="-mx-5 px-5 pt-4">
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
                  <div 
                    key={stage.id} 
                    className="pipeline-column bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 min-h-[300px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
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
                      {stage.deals.map((deal) => (
                        <DealCard 
                          key={deal.id} 
                          deal={{...deal, stageId: stage.id}}
                          badgeColor={stage.color}
                          onDragStart={handleDragStart}
                        />
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary dark:hover:text-primary-300 dark:hover:border-primary-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deal
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
