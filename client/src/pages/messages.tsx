import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Send,
  Search,
  Plus,
  Users,
  User,
  Mail,
  MailOpen,
} from "lucide-react";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

// Placeholder for message data until API is implemented
type Message = {
  id: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: "incoming" | "outgoing";
};

type Contact = {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
};

export default function Messages() {
  const [currentContact, setCurrentContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch users and messages from API when integrated
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  // This will be replaced with actual API calls
  const contacts: Contact[] = [
    {
      id: "1",
      name: "Alex Turner",
      avatar: "",
      lastMessage: "When will the proposal be ready?",
      lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
      unreadCount: 2,
    },
    {
      id: "2",
      name: "Sarah Johnson",
      avatar: "",
      lastMessage: "Let's schedule a meeting for next week",
      lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
      unreadCount: 0,
    },
    {
      id: "3",
      name: "Michael Brown",
      avatar: "",
      lastMessage: "I've sent the contract draft",
      lastMessageTime: new Date(Date.now() - 86400000).toISOString(),
      unreadCount: 0,
    },
  ];

  // This will be replaced with actual API calls
  const messages: Message[] = [
    {
      id: "1",
      userId: 2,
      userName: "Alex Turner",
      content: "Hi, I wanted to follow up on our conversation from last week.",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
      type: "incoming",
    },
    {
      id: "2",
      userId: 1,
      userName: "You",
      content: "Hello Alex! Yes, I've been working on the proposal you requested.",
      timestamp: new Date(Date.now() - 7000000).toISOString(),
      read: true,
      type: "outgoing",
    },
    {
      id: "3",
      userId: 2,
      userName: "Alex Turner",
      content: "That's great! When do you think it will be ready?",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      type: "incoming",
    },
  ];

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format timestamp for display
  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Send a new message (will be connected to API)
  const sendMessage = () => {
    if (messageText.trim() && currentContact) {
      // This would be an API call in production
      console.log(`Sending message to ${currentContact}: ${messageText}`);
      setMessageText("");
      
      // Would refresh messages from API after sending
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <main className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Messages</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Communicate with your contacts and team members
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-100px)]">
        {/* Contacts sidebar */}
        <Card className="lg:col-span-1 h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Conversations</CardTitle>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search contacts..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex mt-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="clients">Clients</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {isUsersLoading ? (
              // Skeleton loading state
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Contact list
              <div className="space-y-1">
                {filteredContacts.length === 0 ? (
                  <p className="text-center py-4 text-slate-500">No contacts found</p>
                ) : (
                  filteredContacts.map((contact) => (
                    <div 
                      key={contact.id}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${currentContact === contact.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                      onClick={() => setCurrentContact(contact.id)}
                    >
                      <Avatar>
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium truncate">{contact.name}</p>
                          <p className="text-xs text-slate-500">
                            {contact.lastMessageTime 
                              ? formatMessageTime(contact.lastMessageTime) 
                              : ''}
                          </p>
                        </div>
                        <p className="text-sm text-slate-500 truncate">
                          {contact.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      {contact.unreadCount > 0 && (
                        <Badge variant="default" className="ml-auto">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message content */}
        <Card className="lg:col-span-2 h-full flex flex-col">
          {!currentContact ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <MessageCircle className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Your Messages</h3>
              <p className="text-slate-500 max-w-md mb-6">
                Select a conversation from the list or start a new one to begin messaging
              </p>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" /> 
                New Conversation
              </Button>
            </div>
          ) : (
            <>
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {getInitials(contacts.find(c => c.id === currentContact)?.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {contacts.find(c => c.id === currentContact)?.name}
                    </CardTitle>
                    <CardDescription>
                      Active now
                    </CardDescription>
                  </div>
                  <div className="ml-auto flex gap-1">
                    <Button size="icon" variant="ghost">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <User className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto py-6 px-4">
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.type === 'incoming' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex ${message.type === 'incoming' ? 'flex-row' : 'flex-row-reverse'} items-start gap-3 max-w-[80%]`}>
                        {message.type === 'incoming' && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={""} />
                            <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div className={`px-4 py-3 rounded-lg ${
                            message.type === 'incoming' 
                              ? 'bg-slate-100 dark:bg-slate-800' 
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {message.content}
                          </div>
                          <div className={`text-xs mt-1 ${
                            message.type === 'incoming' ? 'text-left' : 'text-right'
                          } text-slate-500`}>
                            {formatMessageTime(message.timestamp)}
                            {message.type === 'outgoing' && (
                              <span className="ml-2">
                                {message.read ? (
                                  <MailOpen className="inline h-3 w-3 text-success" />
                                ) : (
                                  <Mail className="inline h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              
              {/* Message input */}
              <div className="p-4 border-t">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Type your message..."
                    className="resize-none min-h-[60px]"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button 
                    className="h-auto"
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}