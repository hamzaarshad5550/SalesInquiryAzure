import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getGmailMessages } from "../lib/googleApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
}

export default function Messages() {
  const { currentUser, isGoogleApiInitialized, oauthToken } = useAuth();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [prevPageTokens, setPrevPageTokens] = useState<string[]>([]);
  const [currentPageToken, setCurrentPageToken] = useState<string | undefined>(undefined);

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
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const formatFromField = (from: string) => {
    // Extract name and email from "Name <email@example.com>" format
    const match = from.match(/(.*?)\s*<([^>]+)>/);
    if (match) {
      const [_, name, email] = match;
      return { name: name.trim(), email };
    }
    return { name: "", email: from };
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-gray-500 dark:text-gray-400">View your recent Gmail messages</p>
      </div>

      <Card id="messageContainer" className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Recent Emails</CardTitle>
          <CardDescription>
            Showing {emails.length > 0 ? `1-${emails.length}` : "0"} emails
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
              <p className="font-medium">Error loading messages</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No emails found in your inbox</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emails.map((email) => {
                const { name, email: fromEmail } = formatFromField(email.from);
                return (
                  <div key={email.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold mb-1">{email.subject}</h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatDate(email.date)}
                      </span>
                    </div>
                    <p className="text-sm mb-1">
                      {name ? (
                        <>
                          <span className="font-medium">{name}</span>
                          <span className="text-gray-500 text-xs ml-1">&lt;{fromEmail}&gt;</span>
                        </>
                      ) : (
                        <span>{fromEmail}</span>
                      )}
                    </p>
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