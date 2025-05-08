import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getContacts, createContact } from "../lib/googleApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Plus, UserPlus } from "lucide-react";

// Define the contact form schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal(""))
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface GoogleContact {
  resourceName: string;
  etag: string;
  names?: Array<{
    displayName: string;
    givenName?: string;
    familyName?: string;
  }>;
  emailAddresses?: Array<{
    value: string;
    type?: string;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
  }>;
}

export default function ContactsGoogle() {
  const { currentUser, isGoogleApiInitialized, oauthToken } = useAuth();
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [prevPageTokens, setPrevPageTokens] = useState<string[]>([]);
  const [currentPageToken, setCurrentPageToken] = useState<string | undefined>(undefined);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: ""
    }
  });

  const fetchContacts = useCallback(async (pageToken?: string) => {
    if (!isGoogleApiInitialized) {
      setError("Google API not initialized");
      setLoading(false);
      return;
    }

    if (!oauthToken) {
      setError("Authentication token missing. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { contacts: googleContacts, nextPageToken: newNextPageToken } = await getContacts(50, pageToken);
      setContacts(googleContacts);
      setNextPageToken(newNextPageToken);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching contacts:", err);
      setError(err.message || "Failed to fetch contacts");
      setLoading(false);
    }
  }, [isGoogleApiInitialized, oauthToken]);

  // Fetch contacts when Google API is initialized and token is available
  useEffect(() => {
    if (isGoogleApiInitialized && oauthToken) {
      fetchContacts();
    }
  }, [isGoogleApiInitialized, oauthToken, fetchContacts]);

  const handleNextPage = () => {
    if (nextPageToken) {
      setPrevPageTokens((prev) => [...prev, currentPageToken as string].filter(Boolean));
      setCurrentPageToken(nextPageToken);
      fetchContacts(nextPageToken);
    }
  };

  const handlePrevPage = () => {
    if (prevPageTokens.length > 0) {
      const prevToken = prevPageTokens[prevPageTokens.length - 1];
      setPrevPageTokens((prev) => prev.slice(0, -1));
      setCurrentPageToken(prevToken);
      fetchContacts(prevToken);
    } else {
      // First page
      setCurrentPageToken(undefined);
      fetchContacts();
    }
  };

  const onSubmit = async (data: ContactFormValues) => {
    if (!isGoogleApiInitialized) {
      setError("Google API not initialized");
      return;
    }
    
    if (!oauthToken) {
      setError("Authentication token missing. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      await createContact(data.name, data.email || undefined, data.phone || undefined);
      
      // Reset form and close dialog
      form.reset();
      setIsDialogOpen(false);
      
      // Refresh contacts list
      fetchContacts();
      
    } catch (err: any) {
      console.error("Error creating contact:", err);
      setError(err.message || "Failed to create contact");
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your contacts</h1>
        <p>You need to be signed in to access your Google contacts.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Google Contacts</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage your Google contacts</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Create a new contact in your Google Contacts
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe@example.com" {...field} />
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
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={loading || form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Creating..." : "Create Contact"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card id="contactsContainer" className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Your Contacts</CardTitle>
          <CardDescription>
            Showing {contacts.length > 0 ? `1-${contacts.length}` : "0"} contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="flex flex-col space-y-2 border-b pb-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md dark:bg-red-900/30 dark:text-red-400">
              <p className="font-medium mb-2">Error loading contacts</p>
              <p className="text-sm mb-3">{error}</p>
              
              {error && (error.includes("Permission denied") || error.includes("API not initialized")) && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300 mt-4 text-sm">
                  <p className="font-medium mb-2">API Services Need to be Enabled</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Go to the <a href="https://console.developers.google.com/apis/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google Cloud Console</a></li>
                    <li>Select your project (ID: 88311205730)</li>
                    <li>Click on "Enable APIs and Services"</li>
                    <li>Search for and enable each of these APIs:
                      <ul className="list-disc pl-5 mt-1">
                        <li>Gmail API</li>
                        <li>Google Calendar API</li>
                        <li>People API</li>
                      </ul>
                    </li>
                    <li>After enabling the APIs, wait a few minutes and try again</li>
                  </ol>
                </div>
              )}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No contacts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => {
                const displayName = contact.names?.[0]?.displayName || 'No Name';
                const email = contact.emailAddresses?.[0]?.value || '';
                const phone = contact.phoneNumbers?.[0]?.value || '';
                
                return (
                  <div key={contact.resourceName} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold mb-1">{displayName}</h3>
                    </div>
                    {email && (
                      <p className="text-sm mb-1">
                        <span className="text-gray-500">Email: </span>
                        {email}
                      </p>
                    )}
                    {phone && (
                      <p className="text-sm">
                        <span className="text-gray-500">Phone: </span>
                        {phone}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Pagination className="w-full">
            <PaginationContent>
              <PaginationItem>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={prevPageTokens.length === 0}
                  className={prevPageTokens.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                >
                  Previous
                </Button>
              </PaginationItem>
              <PaginationItem>
                <div className="flex items-center justify-center px-4">Page</div>
              </PaginationItem>
              <PaginationItem>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={!nextPageToken}
                  className={!nextPageToken ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                >
                  Next
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
    </div>
  );
}