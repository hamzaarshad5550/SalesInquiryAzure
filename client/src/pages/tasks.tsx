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

// Task form schema
const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  time: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
  assignedTo: z.coerce.number(),
  relatedToType: z.enum(["deal", "contact"]).optional(),
  relatedToId: z.coerce.number().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  // Get all tasks
  const { data: tasksData, isLoading: isTasksLoading } = useQuery<{ tasks: Task[] }>({
    queryKey: ['/api/tasks', { search: searchQuery }],
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
        time: data.time || undefined,
        relatedToType: data.relatedToType || undefined,
        relatedToId: data.relatedToId ? Number(data.relatedToId) : undefined,
        // Ensure assignedTo is a number and use assigned_to instead
        assigned_to: Number(data.assignedTo), // Use assigned_to instead of assignedTo
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
        dueDate: data.dueDate || undefined, // Keep as string, server will handle conversion
        time: data.time || undefined,
        relatedToType: data.relatedToType || undefined,
        relatedToId: data.relatedToId || undefined,
        // Ensure assignedTo is a number and use assigned_to instead
        assigned_to: data.assignedTo ? Number(data.assignedTo) : undefined,
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

  // Form for creating/editing tasks
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: selectedTask?.title || "",
      description: selectedTask?.description || "",
      dueDate: selectedTask?.dueDate ? format(new Date(selectedTask.dueDate), "yyyy-MM-dd") : "",
      time: selectedTask?.time || "",
      priority: selectedTask?.priority as "high" | "medium" | "low" || "medium",
      assignedTo: selectedTask?.assignedTo || 1, // Default to first user
      relatedToType: selectedTask?.relatedToType as "deal" | "contact" | undefined,
      relatedToId: selectedTask?.relatedToId,
    },
  });

  // Reset form when opening/closing or changing selected task
  const openTaskForm = (task?: Task) => {
    if (task) {
      setSelectedTask(task);
      form.reset({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
        time: task.time || "",
        priority: task.priority as "high" | "medium" | "low",
        assignedTo: task.assignedTo,
        relatedToType: task.relatedToType as "deal" | "contact" | undefined,
        relatedToId: task.relatedToId,
      });
    } else {
      setSelectedTask(null);
      form.reset({
        title: "",
        description: "",
        dueDate: "",
        time: "",
        priority: "medium",
        assignedTo: 1, // Default to first user
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

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button onClick={() => openTaskForm()}>
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>
            Manage and track all your tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isTasksLoading ? (
            <div className="w-full">
              <div className="flex justify-between items-center py-3 border-b dark:border-slate-700">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-24" />
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center py-4 border-b dark:border-slate-700">
                  <Skeleton className="h-5 w-5 mr-4" />
                  <div className="flex-1 min-w-0 mr-4">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-24 mr-4" />
                  <Skeleton className="h-6 w-24 mr-4" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No tasks found</p>
                      <Button
                        variant="outline"
                        size="sm" 
                        className="mt-4"
                        onClick={() => openTaskForm()}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add your first task
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id} className={task.completed ? "opacity-60" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion.mutate(task.id)}
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
                        {normalizedUsers.find((user: { id: number }) => user.id === task.assigned_to)?.name || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openTaskForm(task)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                              />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Task Form Dialog */}
      <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {selectedTask 
                ? "Update the details of the existing task" 
                : "Add a new task with all the required information"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add task details" 
                        className="resize-none min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                {field.value || "Select time"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <div className="font-medium text-sm">Start Time</div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Select
                                        onValueChange={(hour) => {
                                          const currentValue = field.value || "";
                                          const [_, endTime] = currentValue.split(" - ").map(t => t?.trim());
                                          const newStartTime = `${hour}:00 ${parseInt(hour) >= 12 ? 'PM' : 'AM'}`;
                                          field.onChange(endTime ? `${newStartTime} - ${endTime}` : newStartTime);
                                        }}
                                        value={field.value?.split(" - ")[0]?.split(":")[0] || "9"}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Hour" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                            <SelectItem key={hour} value={hour.toString()}>
                                              {hour}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        onValueChange={(ampm) => {
                                          const currentValue = field.value || "";
                                          const [startTime, endTime] = currentValue.split(" - ").map(t => t?.trim());
                                          if (!startTime) {
                                            const newStartTime = `9:00 ${ampm}`;
                                            field.onChange(endTime ? `${newStartTime} - ${endTime}` : newStartTime);
                                            return;
                                          }
                                          
                                          const [time] = startTime.split(" ");
                                          const newStartTime = `${time} ${ampm}`;
                                          field.onChange(endTime ? `${newStartTime} - ${endTime}` : newStartTime);
                                        }}
                                        value={field.value?.split(" - ")[0]?.split(" ")[1] || "AM"}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="AM/PM" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="AM">AM</SelectItem>
                                          <SelectItem value="PM">PM</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="font-medium text-sm">End Time</div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Select
                                        onValueChange={(hour) => {
                                          const currentValue = field.value || "";
                                          const [startTime] = currentValue.split(" - ").map(t => t?.trim());
                                          const currentEndTime = currentValue.split(" - ")[1]?.trim();
                                          const endAmPm = currentEndTime?.split(" ")[1] || "AM";
                                          const newEndTime = `${hour}:00 ${endAmPm}`;
                                          field.onChange(startTime ? `${startTime} - ${newEndTime}` : newEndTime);
                                        }}
                                        value={field.value?.split(" - ")[1]?.split(":")[0] || "10"}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Hour" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                            <SelectItem key={hour} value={hour.toString()}>
                                              {hour}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        onValueChange={(ampm) => {
                                          const currentValue = field.value || "";
                                          const [startTime, endTime] = currentValue.split(" - ").map(t => t?.trim());
                                          if (!endTime) {
                                            const newEndTime = `10:00 ${ampm}`;
                                            field.onChange(startTime ? `${startTime} - ${newEndTime}` : newEndTime);
                                            return;
                                          }
                                          
                                          const [time] = endTime.split(" ");
                                          const newEndTime = `${time} ${ampm}`;
                                          field.onChange(startTime ? `${startTime} - ${newEndTime}` : newEndTime);
                                        }}
                                        value={field.value?.split(" - ")[1]?.split(" ")[1] || "AM"}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="AM/PM" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="AM">AM</SelectItem>
                                          <SelectItem value="PM">PM</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-end">
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      const startTime = field.value?.split(" - ")[0]?.trim() || "9:00 AM";
                                      const endTime = field.value?.split(" - ")[1]?.trim() || "10:00 AM";
                                      field.onChange(`${startTime} - ${endTime}`);
                                    }}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Format: HH:MM AM/PM - HH:MM AM/PM
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Assigned To</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isUsersLoading ? (
                            <SelectItem value="1">Loading users...</SelectItem>
                          ) : normalizedUsers.length === 0 ? (
                            <SelectItem value="1">Default User</SelectItem>
                          ) : (
                            normalizedUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsTaskFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createTask.isPending || updateTask.isPending}
                >
                  {createTask.isPending || updateTask.isPending ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span>{selectedTask ? "Update Task" : "Create Task"}</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
