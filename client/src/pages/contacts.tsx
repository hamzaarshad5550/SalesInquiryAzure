import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Plus, Search, Mail, Phone, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type Contact } from "@shared/schema";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery<{ contacts: Contact[] }>({
    queryKey: ['/api/contacts', { search: searchQuery }],
  });

  const contacts = isLoading ? [] : data?.contacts || [];

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Contacts</h1>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search contacts..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button asChild>
              <Link href="/contacts/new">
                <Plus className="mr-2 h-4 w-4" /> Add Contact
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>All Contacts</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="w-full">
              <div className="flex justify-between items-center py-3 border-b dark:border-slate-700">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-24" />
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center py-4 border-b dark:border-slate-700">
                  <Skeleton className="h-10 w-10 rounded-full mr-4" />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => {
                  const initials = contact.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase();

                  return (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/contacts/${contact.id}`}
                              className="font-medium text-foreground hover:text-primary"
                            >
                              {contact.name}
                            </Link>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {contact.title}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.company || "-"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`mailto:${contact.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                        <span className="ml-2 text-sm">{contact.email}</span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`tel:${contact.phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                        <span className="ml-2 text-sm">{contact.phone}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          contact.status === 'active' ? 'bg-success/10 text-success border-success/20' :
                          contact.status === 'inactive' ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600' :
                          contact.status === 'lead' ? 'bg-primary/10 text-primary border-primary/20' :
                          'bg-secondary/10 text-secondary border-secondary/20'
                        }>
                          {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
