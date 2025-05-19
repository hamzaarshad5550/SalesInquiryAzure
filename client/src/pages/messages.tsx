import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getGmailMessages, getGmailMessageDetail } from "../lib/googleApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, AlertCircle, RefreshCw, Inbox } from "lucide-react";
import { EmailDetail } from "@/components/email/email-detail";
import { useToast } from "@/hooks/use-toast";

interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
}

interface EmailDetail extends EmailMessage {
  body: string;
  to: string;
}

export default function Messages() {
  const { currentUser, isGoogleApiInitialized, oauthToken } = useAuth();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [prevPageTokens, setPrevPageTokens] = useState<string[]>([]);
  const [currentPageToken, setCurrentPageToken] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const { toast } = useToast();

  const fetchEmails = useCallback(async (pageToken?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check authentication status
      if (!currentUser) {
        setError("You must be logged in to view messages");
        setLoading(false);
        return;
      }

      // Verify Google API initialization
      if (!isGoogleApiInitialized) {
        setError("Google API not initialized. Please try logging in again.");
        setLoading(false);
        return;
      }

      // Check for OAuth token
      if (!oauthToken) {
        setError("Authentication token missing. Please log in again.");
        setLoading(false);
        return;
      }

      console.log("Fetching Gmail messages...");
      
      // Fetch the messages from Gmail API
      const { messages, nextPageToken: newNextPageToken } = await getGmailMessages(15, pageToken);
      
      console.log(`Fetched ${messages.length} email messages`);
      
      setEmails(messages);
      setNextPageToken(newNextPageToken);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching emails:", err);
      
      // Provide more helpful error messages based on error type
      if (err.message?.includes("API not initialized")) {
        setError("Gmail service is not available. Please log out and log in again.");
      } else if (err.message?.includes("Authentication required")) {
        setError("Your login session has expired. Please log out and log in again.");
      } else {
        setError(err.message || "Failed to fetch emails. Please try again later.");
      }
      
      setLoading(false);
    }
  }, [currentUser, isGoogleApiInitialized, oauthToken]);

  // Fetch emails when Google API is initialized and we have a valid token
  useEffect(() => {
    if (isGoogleApiInitialized && oauthToken) {
      fetchEmails();
    }
  }, [isGoogleApiInitialized, oauthToken, fetchEmails]);

  const handleNextPage = () => {
    if (nextPageToken) {
      setPrevPageTokens((prev) => [...prev, currentPageToken as string].filter(Boolean));
      setCurrentPageToken(nextPageToken);
      fetchEmails(nextPageToken);
    }
  };

  const handlePrevPage = () => {
    if (prevPageTokens.length > 0) {
      const prevToken = prevPageTokens[prevPageTokens.length - 1];
      setPrevPageTokens((prev) => prev.slice(0, -1));
      setCurrentPageToken(prevToken);
      fetchEmails(prevToken);
    } else {
      // First page
      setCurrentPageToken(undefined);
      fetchEmails();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmails();
    setRefreshing(false);
  };

  const handleSelectEmail = async (email: EmailMessage) => {
    setLoadingEmail(true);
    try {
      const emailDetail = await getGmailMessageDetail(email.id);
      setSelectedEmail(emailDetail);
    } catch (error: any) {
      toast({
        title: "Failed to load email",
        description: error.message || "Could not load the email details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingEmail(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your messages</h1>
        <p>You need to be signed in to access your Gmail messages.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const formatFromField = (from: string) => {
    const match = from.match(/(.*?)\s*<([^>]+)>/);
    if (match) {
      const [_, name, email] = match;
      return { name: name.trim(), email };
    }
    return { name: "", email: from };
  };

  return (
    <div className="container mx-auto py-6 px-4 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Messages</h1>
          <p className="text-gray-500 dark:text-gray-400">View your recent Gmail messages</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={loading || refreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <span>Recent Emails</span>
            </CardTitle>
            <CardDescription>
              Showing {emails.length > 0 ? `1-${emails.length}` : "0"} emails
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="px-6">
              {loading ? (
                <div className="space-y-4 py-2">
                  {Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="flex flex-col space-y-2 py-4 border-b">
                        <Skeleton className="h-5 w-3/4" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : error ? (
                <div className="p-4 my-4 bg-red-50 text-red-700 rounded-md dark:bg-red-900/30 dark:text-red-400">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-2">Error loading messages</p>
                      <p className="text-sm mb-3">{error}</p>
                      
                      {(error.includes("Permission denied") || error.includes("disabled") || error.includes("not been used")) && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300 mt-4 text-sm">
                          <p className="font-medium mb-2">API Services Need to be Enabled</p>
                          <ol className="list-decimal pl-5 space-y-2">
                            <li>Go to the <a href="https://console.cloud.google.com/apis/dashboard?project=rayyan-ai-4ef4c" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google Cloud Console</a></li>
                            <li>Select your project "rayyan-ai-4ef4c" (ID: 88311205730)</li>
                            <li>Click on "Enable APIs and Services"</li>
                            <li>Search for and enable each of these APIs:
                              <ul className="list-disc pl-5 mt-1">
                                <li><a href="https://console.cloud.google.com/apis/library/gmail.googleapis.com?project=rayyan-ai-4ef4c" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Gmail API</a></li>
                                <li><a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=rayyan-ai-4ef4c" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google Calendar API</a></li>
                                <li><a href="https://console.cloud.google.com/apis/library/people.googleapis.com?project=rayyan-ai-4ef4c" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">People API</a></li>
                              </ul>
                            </li>
                            <li>After enabling the APIs, wait a few minutes and try again</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No emails found</p>
                  <p className="text-sm mt-1">Your inbox appears to be empty</p>
                </div>
              ) : (
                <div>
                  {emails.map((email) => {
                    const { name, email: fromEmail } = formatFromField(email.from);
                    return (
                      <div 
                        key={email.id} 
                        className="py-4 border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors px-2 -mx-2 rounded cursor-pointer"
                        onClick={() => handleSelectEmail(email)}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-semibold mb-1 truncate max-w-[calc(100%-80px)]" title={email.subject}>
                            {email.subject || "(No subject)"}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                            {formatDate(email.date)}
                          </span>
                        </div>
                        <p className="text-sm mb-1 flex items-baseline flex-wrap gap-x-1">
                          {name ? (
                            <>
                              <span className="font-medium truncate max-w-[200px]" title={name}>{name}</span>
                              <span className="text-gray-500 text-xs truncate max-w-[250px]" title={fromEmail}>&lt;{fromEmail}&gt;</span>
                            </>
                          ) : (
                            <span className="truncate max-w-[300px]" title={fromEmail}>{fromEmail}</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="border-t py-3 px-6">
          <div className="w-full flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {emails.length > 0 ? `Showing ${emails.length} messages` : ""}
            </div>
            <Pagination className="ml-auto">
              <PaginationContent>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevPage}
                    disabled={prevPageTokens.length === 0 || loading}
                    className="h-8 px-3"
                  >
                    Previous
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextPage}
                    disabled={!nextPageToken || loading}
                    className="h-8 px-3"
                  >
                    Next
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardFooter>
      </Card>

      {selectedEmail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-4xl h-[90vh] bg-background rounded-lg shadow-xl flex flex-col">
            {loadingEmail ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="mt-4 text-sm text-muted-foreground">Loading email...</p>
                </div>
              </div>
            ) : (
              <EmailDetail 
                email={selectedEmail} 
                onClose={() => setSelectedEmail(null)}
                onBack={() => setSelectedEmail(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
