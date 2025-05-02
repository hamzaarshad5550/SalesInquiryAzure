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
  Clock
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
  });

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

  const onSubmit = (data: ContactFormValues) => {
    setIsSubmitting(true);
    updateContactMutation.mutate(data);
  };

  const handleDelete = () => {
    deleteContactMutation.mutate();
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
            <CardHeader>
              <CardTitle>Related Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-slate-500 py-8">No deals found for this contact.</p>
              <div className="flex justify-center">
                <Button>
                  + Add New Deal
                </Button>
              </div>
            </CardContent>
          </Card>
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
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
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
            <CardHeader>
              <CardTitle>Related Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-slate-500 py-8">No tasks found for this contact.</p>
              <div className="flex justify-center">
                <Button>
                  + Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}