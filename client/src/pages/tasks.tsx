import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Clock, 
  Search, 
  Plus, 
  Flag,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { formatTimeString } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LocalTask extends Task {
  isActive?: boolean;
  assigned_to: number;
}

// Task form schema
const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  timeFrom: z.string().optional(),
  timeTo: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
  assigned_to: z.coerce.number(),
  relatedToType: z.enum(["deal", "contact"]).optional(),
  relatedToId: z.coerce.number().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LocalTask | null>(null);
  const { toast } = useToast();

  // Filter states
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("active"); // Default to show active

  // Get all tasks
  const { data: tasksData, isLoading: isTasksLoading } = useQuery<{
    tasks: LocalTask[];
  }>({
    queryKey: [
      '/api/tasks',
      {
        search: searchQuery,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
        assignedTo: assignedToFilter === "all" ? undefined : assignedToFilter,
        isActive: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
      },
    ],
    onSuccess: (data) => {
      console.log("Tasks data fetched successfully:", data);
    },
    onError: (error) => {
      console.error("Error fetching tasks:", error);
    },
  });

  // Get all users for assignment
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
    onError: (error) => {
      console.error("Error fetching users:", error);
      // Set default users if API fails
      return { users: [{ id: 1, full_name: "Default User" }] };
    }
  });

  // Create a normalized users array that works regardless of API response format
  const users = usersData?.users || [];
  const normalizedUsers = users.map(user => ({
    id: user.id,
    name: user.username || user.full_name || user.name || `User ${user.id}`
  }));

  // Create Task mutation
  const createTask = useMutation({
    mutationFn: (data: TaskFormValues) => {
      // Ensure we're sending the correct data format
      const formattedData = {
        ...data,
        // Convert empty strings to undefined for optional fields
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
        time: data.timeFrom && data.timeTo ? `${data.timeFrom}-${data.timeTo}` : undefined,
        relatedToType: data.relatedToType || undefined,
        relatedToId: data.relatedToId ? Number(data.relatedToId) : undefined,
        // Ensure assigned_to is set correctly
        assigned_to: Number(data.assigned_to),
      };
      
      console.log("Sending task data:", formattedData);
      return apiRequest("POST", "/api/tasks", formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Task created", description: "Task was created successfully" });
      setIsTaskFormOpen(false);
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toast({ 
        title: "Creation failed", 
        description: "Failed to create task. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  // Update Task mutation
  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TaskFormValues> }) => {
      // Ensure we're sending the correct data format
      const formattedData = {
        ...data,
        // Convert empty strings to undefined for optional fields
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
        time: data.timeFrom && data.timeTo ? `${data.timeFrom}-${data.timeTo}` : undefined,
        relatedToType: data.relatedToType || undefined,
        relatedToId: data.relatedToId ? Number(data.relatedToId) : undefined,
        // Ensure assigned_to is set correctly and always included in update
        assigned_to: data.assigned_to !== undefined ? Number(data.assigned_to) : undefined,
      };
      
      console.log("Sending task update:", formattedData);
      return apiRequest("PATCH", `/api/tasks/${id}`, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Task updated", description: "Task was updated successfully" });
      setIsTaskFormOpen(false);
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast({ 
        title: "Update failed", 
        description: "Failed to update task. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  // Toggle task completion mutation
  const toggleTaskCompletion = useMutation({
    mutationFn: (taskId: number) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}/toggle`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Task updated", description: "Task status was updated" });
    },
  });

  // Mutation to mark task as inactive
  const markTaskInactive = useMutation({
    mutationFn: (taskId: number) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}/inactive`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Task updated", description: "Task marked as inactive" });
    },
    onError: (error) => {
      console.error("Error marking task inactive:", error);
      toast({ 
        title: "Update failed", 
        description: "Failed to mark task as inactive. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  // Mutation to mark task as active
  const markTaskActive = useMutation({
    mutationFn: (taskId: number) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}/active`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Task updated", description: "Task marked as active" });
    },
    onError: (error) => {
      console.error("Error marking task active:", error);
      toast({ 
        title: "Update failed", 
        description: "Failed to mark task as active. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  // Form for creating/editing tasks
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: selectedTask?.title || "",
      description: selectedTask?.description || "",
      dueDate: selectedTask?.dueDate ? format(new Date(selectedTask.dueDate), "yyyy-MM-dd") : "",
      timeFrom: selectedTask?.time?.split('-')[0] || "",
      timeTo: selectedTask?.time?.split('-')[1] || "",
      priority: selectedTask?.priority as "high" | "medium" | "low" || "medium",
      assigned_to: selectedTask?.assigned_to || 1, // Default to first user
      relatedToType: selectedTask?.relatedToType as "deal" | "contact" | undefined,
      relatedToId: selectedTask?.relatedToId,
    },
  });

  // Reset form when opening/closing or changing selected task
  const openTaskForm = (task?: LocalTask) => {
    if (task) {
      setSelectedTask(task);
      form.reset({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
        timeFrom: task.time?.split('-')[0] || "",
        timeTo: task.time?.split('-')[1] || "",
        priority: task.priority as "high" | "medium" | "low",
        assigned_to: task.assigned_to,
        relatedToType: task.relatedToType as "deal" | "contact" | undefined,
        relatedToId: task.relatedToId,
      });
    } else {
      setSelectedTask(null);
      form.reset({
        title: "",
        description: "",
        dueDate: "",
        timeFrom: "",
        timeTo: "",
        priority: "medium",
        assigned_to: 1, // Default to first user
        relatedToType: undefined,
        relatedToId: undefined,
      });
    }
    setIsTaskFormOpen(true);
  };

  const onSubmit = (data: TaskFormValues) => {
    if (selectedTask) {
      updateTask.mutate({ id: selectedTask.id, data });
    } else {
      createTask.mutate(data);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "No date set";
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string | undefined) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "low":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-secondary/10 text-secondary border-secondary/20";
    }
  };

  const tasks = tasksData?.tasks || [];
  // Remove this duplicate declaration
  // const users = usersData?.users || []; 

  // Filter tasks based on status (show active by default, or add filter controls later)
  const activeTasks = tasks.filter(task => task.isActive !== false); // Filter out inactive tasks

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>Manage and track all your tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {/* Filter Controls */}
            <div className="flex items-center space-x-2">
               <Select onValueChange={setPriorityFilter} value={priorityFilter}>
                 <SelectTrigger className="w-[180px]">
                   <SelectValue placeholder="Filter by Priority" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Priorities</SelectItem>
                   <SelectItem value="high">High</SelectItem>
                   <SelectItem value="medium">Medium</SelectItem>
                   <SelectItem value="low">Low</SelectItem>
                 </SelectContent>
               </Select>

               <Select onValueChange={setAssignedToFilter} value={assignedToFilter}>
                 <SelectTrigger className="w-[180px]">
                   <SelectValue placeholder="Filter by Assignee" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Assignees</SelectItem>
                   {normalizedUsers.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>

               <Select onValueChange={setActiveFilter} value={activeFilter}>
                 <SelectTrigger className="w-[180px]">
                   <SelectValue placeholder="Filter by Status" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Statuses</SelectItem>
                   <SelectItem value="active">Active</SelectItem>
                   <SelectItem value="inactive">Inactive</SelectItem>
                 </SelectContent>
               </Select>

            </div>
            <Button onClick={() => openTaskForm()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>

          {isTasksLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Active Status</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTasks.map((task) => (
                  <TableRow key={task.id} className={cn(
                    task.completed ? "opacity-60" : "",
                    task.isActive === false && "opacity-40 italic line-through"
                  )}>
                    <TableCell>
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion.mutate(task.id)}
                        disabled={task.isActive === false}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{task.title || "Untitled Task"}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {task.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{task.dueDate ? formatDate(task.dueDate) : "No date"}</span>
                      </div>
                      {task.time && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatTimeString(task.time)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {normalizedUsers.find(user => user.id === task.assigned_to)?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-right">
                      {task.isActive !== false ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 cursor-pointer" onClick={() => markTaskInactive.mutate(task.id)} />
                      ) : (
                        <X className="h-5 w-5 text-red-500 cursor-pointer" onClick={() => markTaskActive.mutate(task.id)} />
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openTaskForm(task)}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Task Form Dialog */}
      <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedTask ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>
              {selectedTask
                ? "Edit the details of your task."
                : "Fill in the details to create a new task."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Task description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the due date for this task.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Range (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <span className="self-center">to</span>
                      <FormField
                        control={form.control}
                        name="timeTo"
                        render={({ field }) => (
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set the priority level for this task.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {normalizedUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Assign this task to a user.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" className="w-full">
                  {selectedTask ? "Update Task" : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
