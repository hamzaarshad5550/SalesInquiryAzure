import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Switch 
} from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { 
  UserCircle2,
  Settings2,
  Bell,
  Lock,
  Users,
  Building,
  Key,
  Shield,
  CheckCircle2,
  Save
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form schemas
const profileFormSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  title: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  taskReminders: z.boolean(),
  dealUpdates: z.boolean(),
  teamMessages: z.boolean(),
  marketingEmails: z.boolean()
});

const teamFormSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  color: z.string(),
  description: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type SecurityFormValues = z.infer<typeof securityFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type TeamFormValues = z.infer<typeof teamFormSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  
  // Fetch current user
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/users/current'],
  });

  // Fetch teams
  const { data: teamsData, isLoading: isTeamsLoading } = useQuery({
    queryKey: ['/api/teams'],
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: userData?.username || "",
      name: userData?.name || "",
      email: userData?.email || "",
      title: userData?.title || "",
      bio: userData?.bio || "",
      avatar: userData?.avatarUrl || "",
    }
  });

  // Security form
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      taskReminders: true,
      dealUpdates: true,
      teamMessages: true,
      marketingEmails: false
    }
  });

  // Team form
  const teamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      color: "hsl(var(--primary))",
      description: "",
    }
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: (data: ProfileFormValues) => {
      return apiRequest("PATCH", "/api/users/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/current'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update password mutation
  const updatePassword = useMutation({
    mutationFn: (data: SecurityFormValues) => {
      return apiRequest("POST", "/api/users/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
    },
    onSuccess: () => {
      securityForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update password. Please check your current password and try again.",
        variant: "destructive"
      });
    }
  });

  // Update notification settings mutation
  const updateNotifications = useMutation({
    mutationFn: (data: NotificationFormValues) => {
      return apiRequest("PATCH", "/api/users/notifications", data);
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved"
      });
    }
  });

  // Create team mutation
  const createTeam = useMutation({
    mutationFn: (data: TeamFormValues) => {
      return apiRequest("POST", "/api/teams", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({
        title: "Team created",
        description: "New team has been created successfully"
      });
      teamForm.reset();
    }
  });

  // Form submission handlers
  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfile.mutate(data);
  };

  const onSubmitSecurity = (data: SecurityFormValues) => {
    updatePassword.mutate(data);
  };

  const onSubmitNotifications = (data: NotificationFormValues) => {
    updateNotifications.mutate(data);
  };

  const onSubmitTeam = (data: TeamFormValues) => {
    createTeam.mutate(data);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                orientation="vertical"
                className="space-y-4"
              >
                <TabsList className="flex flex-col h-auto space-y-1">
                  <TabsTrigger 
                    value="profile" 
                    className="w-full justify-start text-left"
                  >
                    <UserCircle2 className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger 
                    value="security" 
                    className="w-full justify-start text-left"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="w-full justify-start text-left"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger 
                    value="teams" 
                    className="w-full justify-start text-left"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Teams
                  </TabsTrigger>
                  <TabsTrigger 
                    value="api" 
                    className="w-full justify-start text-left"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    API Access
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Content area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{
                activeTab === "profile" ? "Profile Settings" :
                activeTab === "security" ? "Security Settings" :
                activeTab === "notifications" ? "Notification Preferences" :
                activeTab === "teams" ? "Teams Management" :
                "API Access"
              }</CardTitle>
              <CardDescription>{
                activeTab === "profile" ? "Manage your personal information" :
                activeTab === "security" ? "Secure your account with a strong password" :
                activeTab === "notifications" ? "Control what notifications you receive" :
                activeTab === "teams" ? "Create and manage teams" :
                "Generate and manage API keys"
              }</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} className="w-full">
                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6 w-full">
                  {isUserLoading ? (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={userData?.avatarUrl} />
                            <AvatarFallback>{userData?.name?.charAt(0) || userData?.username?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-medium">{userData?.name || userData?.username}</h3>
                            <p className="text-sm text-slate-500">{userData?.email}</p>
                          </div>
                          <Button variant="outline" size="sm" className="ml-auto">
                            Change Avatar
                          </Button>
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={profileForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="email@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Sales Manager" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us a little about yourself" 
                                  className="min-h-32 resize-none"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end">
                          <Button type="submit" disabled={updateProfile.isPending}>
                            {updateProfile.isPending ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </TabsContent>
                
                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6 w-full">
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSubmitSecurity)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={securityForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={securityForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 8 characters long
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={securityForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Authenticator App</p>
                            <p className="text-sm text-slate-500">Use an authenticator app to generate one-time codes</p>
                          </div>
                          <Button variant="outline">Setup</Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={updatePassword.isPending}>
                          {updatePassword.isPending ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                
                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6 w-full">
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive email notifications for important updates
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="taskReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Task Reminders</FormLabel>
                                <FormDescription>
                                  Receive notifications for upcoming and overdue tasks
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="dealUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Deal Updates</FormLabel>
                                <FormDescription>
                                  Receive notifications when deals are updated or moved to a new stage
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="teamMessages"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Team Messages</FormLabel>
                                <FormDescription>
                                  Receive notifications for new messages from your team
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="marketingEmails"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Marketing Emails</FormLabel>
                                <FormDescription>
                                  Receive marketing and promotional emails
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={updateNotifications.isPending}>
                          {updateNotifications.isPending ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Preferences
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                
                {/* Teams Tab */}
                <TabsContent value="teams" className="space-y-6 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Your Teams</h3>
                      {isTeamsLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-4 w-[100px]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : teamsData?.length > 0 ? (
                        <div className="space-y-3">
                          {teamsData.map((team: any) => (
                            <div key={team.id} className="flex items-center space-x-4 p-3 border rounded-md">
                              <div 
                                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: team.color }}
                              >
                                {team.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-medium">{team.name}</h4>
                                <p className="text-sm text-slate-500">
                                  {team.description || "No description"}
                                </p>
                              </div>
                              <Button variant="outline" size="sm" className="ml-auto">
                                Manage
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-md">
                          <p className="text-slate-500">No teams found</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Create New Team</h3>
                      <Form {...teamForm}>
                        <form onSubmit={teamForm.handleSubmit(onSubmitTeam)} className="space-y-4">
                          <FormField
                            control={teamForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Team Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Marketing Team" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={teamForm.control}
                            name="color"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Team Color</FormLabel>
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="h-6 w-6 rounded-full"
                                      style={{ backgroundColor: field.value }}
                                    ></div>
                                    <Select
                                      defaultValue={field.value}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select color" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="hsl(var(--primary))">Blue</SelectItem>
                                        <SelectItem value="hsl(var(--destructive))">Red</SelectItem>
                                        <SelectItem value="hsl(var(--success))">Green</SelectItem>
                                        <SelectItem value="hsl(var(--warning))">Yellow</SelectItem>
                                        <SelectItem value="hsl(var(--secondary))">Gray</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={teamForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Team description (optional)" 
                                    className="resize-none"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end">
                            <Button type="submit" disabled={createTeam.isPending}>
                              {createTeam.isPending ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Users className="mr-2 h-4 w-4" />
                                  Create Team
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </div>
                </TabsContent>
                
                {/* API Access Tab */}
                <TabsContent value="api" className="space-y-6 w-full">
                  <div className="rounded-md border p-6">
                    <div className="flex items-start">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Key className="h-6 w-6 text-primary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium">API Access Keys</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Generate and manage API keys to access the CRM through the API
                        </p>
                        <div className="mt-4">
                          <p className="text-sm font-medium flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                            API documentation available
                          </p>
                          <Button className="mt-4">
                            <Key className="mr-2 h-4 w-4" />
                            Generate New API Key
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Your API Keys</h3>
                    <p className="text-sm text-slate-500">
                      Active API keys that have access to your account
                    </p>
                    
                    <div className="text-center border rounded-md py-16">
                      <Building className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <h4 className="text-lg font-medium">No API Keys Found</h4>
                      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                        You haven't generated any API keys yet. API keys allow you to access the CRM data programmatically.
                      </p>
                      <Button className="mt-4" variant="outline">
                        View API Documentation
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}