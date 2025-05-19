import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Contact, type Activity, type Task, type InsertActivity, type InsertTask, type InsertDeal } from "@shared/schema";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Trash2,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Users,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Calendar,
  Clock,
  Check,
  ArrowDown,
  User,
  ExternalLink
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  status: z.string(),
  avatarUrl: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  assignedTo: z.coerce.number().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// Activity form schema
const activityFormSchema = z.object({
  type: z.enum(["call", "email", "meeting", "note", "update"], {
    required_error: "Please select an activity type",
  }),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

// Task form schema
const taskFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  time: z.string().optional(),
  priority: z.enum(["high", "medium", "low"], {
    required_error: "Please select a priority level",
  }),
  assignedTo: z.coerce.number(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Deal form schema
const dealFormSchema = z.object({
  name: z.string().min(2, "Deal name must be at least 2 characters"),
  description: z.string().optional(),
  value: z.coerce.number().positive("Value must be positive"),
  stageId: z.coerce.number({
    required_error: "Please select a pipeline stage",
  }),
  expectedCloseDate: z.string().optional(),
  probability: z.coerce.number().min(0).max(100).default(50),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

export default function ContactDetail() {
  const [match, params] = useRoute("/contacts/:id");
  const [_, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<string>("call");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSubmittingDeal, setIsSubmittingDeal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const contactId = params?.id;

  // Get contact data
  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: [`/api/contacts/${contactId}`],
    enabled: !!contactId,
  });

  // Get activities data for this contact
  const { data: activitiesData } = useQuery<{ activities: Activity[] }>({
    queryKey: [`/api/contacts/${contactId}/activities`],
    enabled: !!contactId,
  });

  // Get tasks data for this contact
  const { data: tasksData } = useQuery<{ tasks: Task[] }>({
    queryKey: [`/api/contacts/${contactId}/tasks`],
    enabled: !!contactId,
  });

  // Get deals data for this contact
  const { data: dealsData } = useQuery<{ deals: any[] }>({
    queryKey: [`/api/contacts/${contactId}/deals`],
    enabled: !!contactId,
  });

  // Get pipeline stages for deal creation
  const { data: pipelineData } = useQuery<{ stages: any[] }>({
    queryKey: ['/api/pipeline'],
    enabled: !!contactId,
  });

  // Get all users for assignee selection
  const { data: usersData } = useQuery<{ users: any[] }>({
    queryKey: ['/api/users'],
    enabled: !!contactId,
    onError: (error) => {
      console.error("Error fetching users:", error);
      return { users: [{ id: 1, full_name: "Default User" }] };
    }
  });

  // Create a normalized users array
  const users = usersData?.users || [];
  const normalizedUsers = users.map(user => ({
    id: user.id,
    name: user.username || user.full_name || user.name || `User ${user.id}`
  }));

  // Initialize forms
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      title: "",
      company: "",
      status: "lead",
      avatarUrl: "",
      address: "",
      notes: "",
      assignedTo: 1,
    },
  });

  const activityForm = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: "call",
      title: "",
      description: "",
    },
  });

  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      time: "",
      priority: "medium",
      assignedTo: 1,
    },
  });

  const dealForm = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: "",
      description: "",
      value: 0,
      stageId: 1,
      expectedCloseDate: "",
      probability: 50,
    },
  });

  // When contact data is loaded, populate the form
  useEffect(() => {
    if (contact) {
      form.reset({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || "",
        title: contact.title || "",
        company: contact.company || "",
        status: contact.status,
        avatarUrl: contact.avatarUrl || "",
        address: contact.address || "",
        notes: contact.notes || "",
        assignedTo: contact.assignedTo || 1,
      });
    }
  }, [contact, form]);

  const updateContactMutation = useMutation({
    mutationFn: (data: ContactFormValues) => {
      return apiRequest("PATCH", `/api/contacts/${contactId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/recent'] });
      toast({
        title: "Contact updated successfully",
        description: "The contact information has been updated",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Error updating contact:", error);
      toast({
        title: "Failed to update contact",
        description: "There was an error updating the contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: () => {
      return apiRequest("DELETE", `/api/contacts/${contactId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/recent'] });
      toast({
        title: "Contact deleted successfully",
        description: "The contact has been removed from your CRM",
      });
      navigate("/contacts");
    },
    onError: (error) => {
      console.error("Error deleting contact:", error);
      toast({
        title: "Failed to delete contact",
        description: "There was an error deleting the contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle contact form submission
  const onSubmit = (data: ContactFormValues) => {
    setIsSubmitting(true);
    updateContactMutation.mutate(data);
  };

  // Handle contact deletion
  const handleDelete = () => {
    deleteContactMutation.mutate();
  };

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: (data: ActivityFormValues) => {
      const activityData: Partial<InsertActivity> = {
        ...data,
        userId: 1, // Current user id placeholder
        relatedToType: 'contact',
        relatedToId: parseInt(contactId as string),
      };
      return apiRequest("POST", "/api/activities", activityData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/activities`] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      
      toast({
        title: "Activity logged successfully",
        description: "The activity has been recorded for this contact",
      });
      
      setIsActivityDialogOpen(false);
      activityForm.reset({
        type: "call",
        title: "",
        description: "",
      });
    },
    onError: (error) => {
      console.error("Error logging activity:", error);
      toast({
        title: "Failed to log activity",
        description: "There was an error recording the activity. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmittingActivity(false);
    }
  });

  // Handle activity form submission
  const onSubmitActivity = (data: ActivityFormValues) => {
    setIsSubmittingActivity(true);
    createActivityMutation.mutate(data);
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      // First, create the task in your database
      const taskData: Partial<InsertTask> = {
        ...data,
        relatedToType: 'contact',
        relatedToId: parseInt(contactId as string),
      };
      const createdTask = await apiRequest("POST", "/api/tasks", taskData);
      
      // Then, if due date exists, create a Google Calendar event
      if (data.dueDate && isGoogleApiInitialized && oauthToken) {
        try {
          // Parse date and time
          const dueDate = new Date(data.dueDate);
          let startTime = dueDate;
          let endTime = new Date(dueDate);
          
          // If time is specified, parse it
          if (data.time) {
            const [startStr, endStr] = data.time.split(' - ');
            if (startStr) {
              const [startHour, startMinute] = startStr.split(':').map(Number);
              startTime.setHours(startHour, startMinute);
            }
            
            if (endStr) {
              const [endHour, endMinute] = endStr.split(':').map(Number);
              endTime.setHours(endHour, endMinute);
            } else {
              // Default to 1 hour duration if no end time
              endTime.setHours(startTime.getHours() + 1, startTime.getMinutes());
            }
          } else {
            // Default times if no specific time provided
            startTime.setHours(9, 0);
            endTime.setHours(10, 0);
          }
          
          // Create Google Calendar event
          const calendarEvent = await createCalendarEvent(
            data.title,
            data.description || '',
            startTime,
            endTime
          );
          
          // Update the task with the Google Calendar event ID
          if (calendarEvent && calendarEvent.id) {
            await apiRequest("PATCH", `/api/tasks/${createdTask.id}`, {
              googleEventId: calendarEvent.id
            });
          }
        } catch (error) {
          console.error("Failed to create Google Calendar event:", error);
          // Continue with task creation even if calendar event fails
        }
      }
      
      return createdTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: "Task created successfully",
        description: "The task has been created and added to your calendar",
      });
      
      setIsTaskDialogOpen(false);
      taskForm.reset({
        title: "",
        description: "",
        dueDate: "",
        time: "",
        priority: "medium",
        assignedTo: 1,
      });
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toast({
        title: "Failed to create task",
        description: "There was an error creating the task. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmittingTask(false);
    }
  });

  // Handle task form submission
  const onSubmitTask = (data: TaskFormValues) => {
    setIsSubmittingTask(true);
    createTaskMutation.mutate(data);
  };

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: (data: DealFormValues) => {
      const dealData: Partial<InsertDeal> = {
        ...data,
        contactId: parseInt(contactId as string),
        ownerId: 1, // Current user id placeholder
      };
      return apiRequest("POST", "/api/deals", dealData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/deals`] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline'] });
      
      toast({
        title: "Deal created successfully",
        description: "The new deal has been added to the pipeline",
      });
      
      setIsDealDialogOpen(false);
      dealForm.reset({
        name: "",
        description: "",
        value: 0,
        stageId: 1,
        expectedCloseDate: "",
        probability: 50,
      });
    },
    onError: (error) => {
      console.error("Error creating deal:", error);
      toast({
        title: "Failed to create deal",
        description: "There was an error creating the deal. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmittingDeal(false);
    }
  });

  // Handle deal form submission
  const onSubmitDeal = (data: DealFormValues) => {
    setIsSubmittingDeal(true);
    createDealMutation.mutate(data);
  };

  if (isLoading || !contact) {
    return (
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/contacts")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-6 w-32 mt-4" />
                <Skeleton className="h-4 w-24 mt-2" />
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const initials = contact.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/contacts")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">{contact.name}</h1>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the contact
                        and remove all associated data from the system.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="md:w-1/3 flex flex-col items-center">
                        <Avatar className="h-32 w-32">
                          <AvatarImage src={contact.avatarUrl || ""} alt={contact.name} />
                          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                        </Avatar>
                        <FormField
                          control={form.control}
                          name="avatarUrl"
                          render={({ field }) => (
                            <FormItem className="w-full mt-4">
                              <FormLabel>Avatar URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/avatar.jpg" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem className="w-full mt-4">
                              <FormLabel>Status</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="lead">Lead</SelectItem>
                                  <SelectItem value="customer">Customer</SelectItem>
                                  <SelectItem value="partner">Partner</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name*</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address*</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="john.doe@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Marketing Director" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Inc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St, City, State, Zip" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="col-span-1 md:col-span-2">
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Add any additional notes about this contact"
                                    {...field}
                                    rows={4}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 flex flex-col items-center">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={contact.avatarUrl || ""} alt={contact.name} />
                      <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-medium mt-4">{contact.name}</h2>
                    <div className="mt-2 flex items-center justify-center px-4 py-1 rounded-full text-xs font-medium capitalize bg-slate-100 dark:bg-slate-700">
                      {contact.status}
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Mail className="h-4 w-4 mr-2 text-slate-500" />
                          <span className="text-sm font-medium">Email</span>
                        </div>
                        <a href={`mailto:${contact.email}`} className="text-primary hover:underline break-all">
                          {contact.email}
                        </a>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Phone className="h-4 w-4 mr-2 text-slate-500" />
                          <span className="text-sm font-medium">Phone</span>
                        </div>
                        {contact.phone ? (
                          <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                            {contact.phone}
                          </a>
                        ) : (
                          <span className="text-slate-500 italic">Not provided</span>
                        )}
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Briefcase className="h-4 w-4 mr-2 text-slate-500" />
                          <span className="text-sm font-medium">Company & Title</span>
                        </div>
                        {contact.company || contact.title ? (
                          <p>
                            {contact.title && <span>{contact.title}</span>}
                            {contact.title && contact.company && <span> at </span>}
                            {contact.company && <span className="font-medium">{contact.company}</span>}
                          </p>
                        ) : (
                          <span className="text-slate-500 italic">Not provided</span>
                        )}
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <MapPin className="h-4 w-4 mr-2 text-slate-500" />
                          <span className="text-sm font-medium">Address</span>
                        </div>
                        {contact.address ? (
                          <p>{contact.address}</p>
                        ) : (
                          <span className="text-slate-500 italic">Not provided</span>
                        )}
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg col-span-1 md:col-span-2">
                        <div className="flex items-center mb-2">
                          <AlertCircle className="h-4 w-4 mr-2 text-slate-500" />
                          <span className="text-sm font-medium">Notes</span>
                        </div>
                        {contact.notes ? (
                          <p className="whitespace-pre-wrap">{contact.notes}</p>
                        ) : (
                          <span className="text-slate-500 italic">No notes</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Related Deals</CardTitle>
              <Button
                onClick={() => {
                  setIsDealDialogOpen(true);
                  dealForm.reset({
                    name: "",
                    description: "",
                    value: 0,
                    stageId: pipelineData?.stages?.[0]?.id || 1,
                    expectedCloseDate: "",
                    probability: 50,
                  });
                }}
              >
                + Add New Deal
              </Button>
            </CardHeader>
            <CardContent>
              {dealsData?.deals && dealsData.deals.length > 0 ? (
                <div className="space-y-4">
                  {dealsData.deals.map((deal) => (
                    <div key={deal.id} className="flex flex-col rounded-lg border p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-lg">{deal.name}</h4>
                          <p className="text-slate-500 text-sm">
                            {pipelineData?.stages?.find(s => s.id === deal.stageId)?.name || 'Unknown Stage'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${deal.value.toLocaleString()}</p>
                          <p className="text-slate-500 text-sm">{deal.probability}% probability</p>
                        </div>
                      </div>
                      
                      {deal.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 my-2">
                          {deal.description}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-slate-500 mt-3">
                        <div className="flex items-center space-x-3">
                          {deal.expectedCloseDate && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(deal.expectedCloseDate).toLocaleDateString()}
                            </span>
                          )}
                          {usersData?.users && usersData.users.find(u => u.id === deal.ownerId) && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {usersData.users.find(u => u.id === deal.ownerId)?.name}
                            </span>
                          )}
                        </div>
                        <span 
                          className="flex items-center hover:underline cursor-pointer" 
                          onClick={() => navigate(`/pipeline?deal=${deal.id}`)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View in Pipeline
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No deals associated with this contact.</p>
              )}
            </CardContent>
          </Card>

          <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Deal</DialogTitle>
                <DialogDescription>
                  Add a new deal associated with this contact.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...dealForm}>
                <form onSubmit={dealForm.handleSubmit(onSubmitDeal)} className="space-y-4 mt-2">
                  <FormField
                    control={dealForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="What's the deal about?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={dealForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deal Value ($)*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? "0" : e.target.value;
                                field.onChange(parseFloat(value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={dealForm.control}
                      name="probability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Probability (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              placeholder="50" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? "0" : e.target.value;
                                field.onChange(parseInt(value, 10));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={dealForm.control}
                      name="stageId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pipeline Stage*</FormLabel>
                          <Select
                            value={field.value.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select pipeline stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {pipelineData?.stages && pipelineData.stages.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id.toString()}>
                                  {stage.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={dealForm.control}
                      name="expectedCloseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Close Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={dealForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional details about the deal" 
                            className="resize-none min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDealDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmittingDeal}>
                      {isSubmittingDeal ? "Creating..." : "Create Deal"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activities History</CardTitle>
              <Button
                onClick={() => {
                  setIsActivityDialogOpen(true);
                  setSelectedActivityType("call");
                }}
              >
                + Log Activity
              </Button>
            </CardHeader>
            <CardContent>
              {activitiesData?.activities && activitiesData.activities.length > 0 ? (
                <div className="space-y-4">
                  {activitiesData.activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border-b dark:border-gray-700">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'call' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        activity.type === 'email' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        activity.type === 'meeting' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        activity.type === 'note' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {activity.type === 'call' && <Phone className="h-4 w-4" />}
                        {activity.type === 'email' && <Mail className="h-4 w-4" />}
                        {activity.type === 'meeting' && <Users className="h-4 w-4" />}
                        {activity.type === 'note' && <MessageSquare className="h-4 w-4" />}
                        {activity.type === 'update' && <RefreshCw className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{activity.title}</h4>
                          <span className="text-xs text-slate-500">
                            {new Date(activity.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No activities found for this contact.</p>
              )}
            </CardContent>
          </Card>

          <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Log New Activity</DialogTitle>
                <DialogDescription>
                  Record a new activity with this contact.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...activityForm}>
                <form onSubmit={activityForm.handleSubmit(onSubmitActivity)} className="space-y-4 mt-2">
                  <FormField
                    control={activityForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Type</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an activity type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="call">Phone Call</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="note">Note</SelectItem>
                            <SelectItem value="update">Status Update</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={activityForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief summary of the activity" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={activityForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed notes about the activity" 
                            className="resize-none min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsActivityDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmittingActivity}>
                      {isSubmittingActivity ? "Saving..." : "Save Activity"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Related Tasks</CardTitle>
              <Button
                onClick={() => {
                  setIsTaskDialogOpen(true);
                  taskForm.reset({
                    title: "",
                    description: "",
                    dueDate: "",
                    time: "",
                    priority: "medium",
                    assignedTo: 1,
                  });
                }}
              >
                + Create Task
              </Button>
            </CardHeader>
            <CardContent>
              {tasksData?.tasks && tasksData.tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasksData.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`flex items-start gap-4 p-4 border rounded-lg ${
                        task.completed ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 
                        task.priority === 'high' ? 'border-red-200 dark:border-red-900/50' :
                        task.priority === 'medium' ? 'border-amber-200 dark:border-amber-900/50' :
                        'border-blue-200 dark:border-blue-900/50'
                      }`}
                    >
                      <div>
                        <div className={`p-2 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {task.completed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            task.priority === 'high' ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : task.priority === 'medium' ? (
                              <Clock className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`font-medium ${task.completed ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                            {task.title}
                          </h4>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Toggle task completion via API
                              apiRequest("PATCH", `/api/tasks/${task.id}/toggle`, {})
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/tasks`] });
                                  toast({
                                    title: task.completed ? "Task reopened" : "Task marked as complete",
                                    description: task.completed ? "The task has been reopened" : "The task has been marked as complete",
                                  });
                                })
                                .catch((error) => {
                                  console.error("Error toggling task:", error);
                                  toast({
                                    title: "Error updating task",
                                    description: "There was a problem updating the task status",
                                    variant: "destructive",
                                  });
                                });
                            }}
                          >
                            {task.completed ? "Reopen" : "Complete"}
                          </Button>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center text-xs text-slate-500 space-x-3">
                          {task.dueDate && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {task.time && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.time}
                            </span>
                          )}
                          {usersData?.users && usersData.users.find(u => u.id === task.assignedTo) && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {usersData.users.find(u => u.id === task.assignedTo)?.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No tasks found for this contact.</p>
              )}
            </CardContent>
          </Card>

          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task related to this contact.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...taskForm}>
                <form onSubmit={taskForm.handleSubmit(onSubmitTask)} className="space-y-4 mt-2">
                  <FormField
                    control={taskForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="What needs to be done?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={taskForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={taskForm.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="e.g. 10:00 AM - 11:00 AM" 
                                {...field} 
                                onChange={(e) => {
                                  // Format time input as user types
                                  let value = e.target.value;
                                  
                                  // If user enters just numbers, format them as time
                                  if (/^\d{1,2}$/.test(value)) {
                                    value = `${value}:00`;
                                  }
                                  
                                  // If user enters time without AM/PM, add it
                                  if (/^\d{1,2}:\d{2}$/.test(value)) {
                                    const hour = parseInt(value.split(':')[0]);
                                    value = `${value} ${hour >= 12 ? 'PM' : 'AM'}`;
                                  }
                                  
                                  // If user enters a dash, format it properly
                                  if (value.includes('-')) {
                                    const [start, end] = value.split('-').map(t => t.trim());
                                    
                                    // Format start time if needed
                                    let formattedStart = start;
                                    if (/^\d{1,2}$/.test(start)) {
                                      formattedStart = `${start}:00 ${parseInt(start) >= 12 ? 'PM' : 'AM'}`;
                                    } else if (/^\d{1,2}:\d{2}$/.test(start)) {
                                      const hour = parseInt(start.split(':')[0]);
                                      formattedStart = `${start} ${hour >= 12 ? 'PM' : 'AM'}`;
                                    }
                                    
                                    // Format end time if needed
                                    let formattedEnd = end || '';
                                    if (/^\d{1,2}$/.test(end)) {
                                      formattedEnd = `${end}:00 ${parseInt(end) >= 12 ? 'PM' : 'AM'}`;
                                    } else if (/^\d{1,2}:\d{2}$/.test(end)) {
                                      const hour = parseInt(end.split(':')[0]);
                                      formattedEnd = `${end} ${hour >= 12 ? 'PM' : 'AM'}`;
                                    }
                                    
                                    value = formattedEnd ? `${formattedStart} - ${formattedEnd}` : formattedStart;
                                  }
                                  
                                  field.onChange(value);
                                }}
                              />
                              <div className="absolute right-3 top-2.5 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                              </div>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={taskForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority level" />
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
                      control={taskForm.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned To</FormLabel>
                          <Select
                            value={field.value.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Assign to someone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {normalizedUsers.length === 0 ? (
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
                  
                  <FormField
                    control={taskForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional details about the task" 
                            className="resize-none min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTaskDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmittingTask}>
                      {isSubmittingTask ? "Creating..." : "Create Task"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </main>
  );
}
