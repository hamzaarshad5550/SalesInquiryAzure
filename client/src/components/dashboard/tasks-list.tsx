import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  time: string;
  priority: "high" | "medium" | "low";
};

function getTaskTimeDisplay(task: Task) {
  if (!task.time) return '';
  
  const timeRegex = /(\d{1,2}):(\d{2})\s*(?:-\s*(\d{1,2}):(\d{2}))?/;
  const match = task.time.match(timeRegex);
  
  if (!match) return task.time;
  
  const startHour = parseInt(match[1]);
  const startMinute = match[2];
  const startPeriod = startHour >= 12 ? 'PM' : 'AM';
  const displayStartHour = startHour > 12 ? startHour - 12 : (startHour === 0 ? 12 : startHour);
  
  let result = `${displayStartHour}:${startMinute} ${startPeriod}`;
  
  if (match[3] && match[4]) {
    const endHour = parseInt(match[3]);
    const endMinute = match[4];
    const endPeriod = endHour >= 12 ? 'PM' : 'AM';
    const displayEndHour = endHour > 12 ? endHour - 12 : (endHour === 0 ? 12 : endHour);
    result += ` - ${displayEndHour}:${endMinute} ${endPeriod}`;
  }
  
  return result;
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300';
    case 'medium':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    case 'low':
      return 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300';
    default:
      return 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300';
  }
}

export function TasksList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/tasks/today'],
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (taskId: string) => 
      apiRequest('PATCH', `/api/tasks/${taskId}/toggle`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
    },
  });

  const tasks: Task[] = isLoading ? [] : data?.tasks || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Today's Tasks</CardTitle>
        <Link href="/tasks" className="text-sm text-primary hover:text-primary-600 font-medium">View All</Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </>
          ) : (
            <>
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <div className="flex-shrink-0 mr-3">
                    <Checkbox 
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskMutation.mutate(task.id)}
                      className="border-2 border-slate-300 dark:border-slate-600 rounded" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-3.5 w-3.5 mr-1" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{getTaskTimeDisplay(task)}</span>
                      </div>
                      <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                      <div className={`text-xs px-2 py-0.5 rounded ${getPriorityClass(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreVertical className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  </Button>
                </div>
              ))}
              
              <Link href="/tasks">
                <Button variant="outline" className="w-full py-2 border-dashed border-slate-300 dark:border-slate-600 text-sm text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary dark:hover:text-primary-300 dark:hover:border-primary-500 mt-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-3.5 w-3.5 mr-2" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  Add New Task
                </Button>
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
