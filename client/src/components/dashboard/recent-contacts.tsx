import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PhoneCall, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Contact = {
  id: string;
  name: string;
  title: string;
  company: string;
  avatarUrl?: string;
  email: string;
  phone: string;
};

export function RecentContacts() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/contacts/recent'],
  });

  const contacts: Contact[] = isLoading ? [] : data?.contacts || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Recent Contacts</CardTitle>
        <Link href="/contacts" className="text-sm text-primary hover:text-primary-600 font-medium">View All</Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <>
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex space-x-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex space-x-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex space-x-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex space-x-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </>
          ) : (
            contacts.map((contact) => {
              const initials = contact.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase();

              return (
                <div key={contact.id} className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link href={`/contacts/${contact.id}`}>
                      <p className="text-sm font-medium hover:text-primary">{contact.name}</p>
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {contact.title}{contact.company ? ` at ${contact.company}` : ''}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700"
                      asChild
                    >
                      <a href={`tel:${contact.phone}`}>
                        <PhoneCall className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700"
                      asChild
                    >
                      <a href={`mailto:${contact.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
