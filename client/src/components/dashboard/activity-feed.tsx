import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn, timeAgo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ActivityType = "email" | "call" | "update" | "meeting" | "note";

type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
};

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "email":
      return (
        <div className="absolute -left-[19px] w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/50 border-2 border-white dark:border-slate-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </div>
      );
    case "call":
      return (
        <div className="absolute -left-[19px] w-7 h-7 rounded-full bg-secondary-100 dark:bg-secondary-900/50 border-2 border-white dark:border-slate-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>
      );
    case "update":
      return (
        <div className="absolute -left-[19px] w-7 h-7 rounded-full bg-accent-100 dark:bg-accent-900/50 border-2 border-white dark:border-slate-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-accent-600 dark:text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/>
            <path d="M9 17h6"/>
            <path d="M9 13h6"/>
          </svg>
        </div>
      );
    case "meeting":
      return (
        <div className="absolute -left-[19px] w-7 h-7 rounded-full bg-warning-100 dark:bg-warning-900/50 border-2 border-white dark:border-slate-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-warning-600 dark:text-warning-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      );
    case "note":
      return (
        <div className="absolute -left-[19px] w-7 h-7 rounded-full bg-success-100 dark:bg-success-900/50 border-2 border-white dark:border-slate-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-success-600 dark:text-success-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>
      );
    default:
      return null;
  }
}

export function ActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/activities/recent'],
  });

  const activities: Activity[] = isLoading ? [] : data?.activities || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Recent Activity</CardTitle>
        <Link href="/activities" className="text-sm text-primary hover:text-primary-600 font-medium">View All</Link>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "relative pl-4 space-y-4",
          "before:absolute before:top-0 before:bottom-0 before:left-0 before:border-l before:border-slate-200 dark:before:border-slate-700",
          "after:absolute after:top-0 after:bottom-0 after:left-0 after:border-l-2 after:border-primary-200 dark:after:border-primary-900/50"
        )}>
          {isLoading ? (
            <>
              <div className="relative mb-4">
                <Skeleton className="h-7 w-7 rounded-full absolute -left-[19px]" />
                <div className="pl-4">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="relative mb-4">
                <Skeleton className="h-7 w-7 rounded-full absolute -left-[19px]" />
                <div className="pl-4">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="relative mb-4">
                <Skeleton className="h-7 w-7 rounded-full absolute -left-[19px]" />
                <div className="pl-4">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="relative mb-4">
                {getActivityIcon(activity.type)}
                <div className="pl-4">
                  <p className="text-sm">
                    <span className="font-medium">{activity.title}</span>
                    {" "}
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {timeAgo(new Date(activity.timestamp))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
