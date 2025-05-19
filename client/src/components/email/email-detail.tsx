import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Reply, Send, X } from "lucide-react";
import { sendEmailReply } from "@/lib/googleApi";
import { useToast } from "@/hooks/use-toast";

interface EmailDetailProps {
  email: {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    date: string;
    body: string;
    to: string;
  };
  onClose: () => void;
  onBack: () => void;
}

export function EmailDetail({ email, onClose, onBack }: EmailDetailProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const formatFromField = (from: string) => {
    const match = from.match(/(.*?)\s*<([^>]+)>/);
    if (match) {
      const [_, name, email] = match;
      return { name: name.trim(), email };
    }
    return { name: "", email: from };
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast({
        title: "Empty reply",
        description: "Please enter a message before sending.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const { name, email: fromEmail } = formatFromField(email.from);
      await sendEmailReply(
        email.threadId,
        fromEmail,
        `Re: ${email.subject}`,
        replyContent
      );
      
      toast({
        title: "Reply sent",
        description: "Your email has been sent successfully.",
      });
      
      setReplyContent("");
      setIsReplying(false);
    } catch (error: any) {
      toast({
        title: "Failed to send reply",
        description: error.message || "An error occurred while sending your reply.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const { name, email: fromEmail } = formatFromField(email.from);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl">{email.subject || "(No subject)"}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto pb-0">
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{name ? getInitials(name) : "UN"}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <div>
                <span className="font-medium">{name || fromEmail}</span>
                {name && (
                  <span className="text-sm text-muted-foreground ml-2">&lt;{fromEmail}&gt;</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(email.date)}
              </span>
            </div>
            
            <div className="text-xs text-muted-foreground mt-1">
              To: {email.to || "me"}
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4 pb-6">
          <div 
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex-col items-stretch pt-4 gap-4">
        {!isReplying ? (
          <Button 
            variant="outline" 
            className="w-full sm:w-auto" 
            onClick={() => setIsReplying(true)}
          >
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
        ) : (
          <div className="space-y-4 w-full">
            <Textarea
              placeholder="Type your reply here..."
              className="min-h-[120px] w-full"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsReplying(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReply}
                disabled={isSending || !replyContent.trim()}
              >
                {isSending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
