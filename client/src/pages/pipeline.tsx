import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

type DealCardProps = {
  deal: {
    id: string;
    name: string;
    value: number;
    description: string;
    updatedAt: string;
    owner: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  };
  badgeColor: string;
  onDragStart: (e: React.DragEvent, dealId: string, currentStageId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
};

function DealCard({ deal, badgeColor, onDragStart, onDragEnd }: DealCardProps) {
  const initials = deal.owner.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Calculate time since update
  const updatedDate = new Date(deal.updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let timeAgo = '';
  if (diffDays === 0) {
    timeAgo = 'Today';
  } else if (diffDays === 1) {
    timeAgo = 'Yesterday';
  } else if (diffDays < 7) {
    timeAgo = `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    timeAgo = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    timeAgo = updatedDate.toLocaleDateString();
  }

  return (
    <div 
      className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e) => onDragStart(e, deal.id, deal.stageId)}
      onDragEnd={onDragEnd}
    >
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium">{deal.name}</span>
        <Badge variant="outline" className={`bg-${badgeColor}-100 dark:bg-${badgeColor}-900/30 text-${badgeColor}-700 dark:text-${badgeColor}-300 border-transparent`}>
          {formatCurrency(deal.value)}
        </Badge>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{deal.description}</p>
      <div className="flex items-center justify-between mt-3">
        <div className="flex -space-x-1">
          <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-800">
            <AvatarImage src={deal.owner.avatarUrl} alt={deal.owner.name} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{timeAgo}</span>
      </div>
    </div>
  );
}

// Form schema for creating a new deal
const dealFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  stageId: z.coerce.number().int("Stage ID must be an integer"),
  ownerId: z.coerce.number().int("Owner ID must be an integer"),
  contactId: z.coerce.number().int().default(1), // Default to first contact until we implement contact selection
});

type DealFormValues = z.infer<typeof dealFormSchema>;

export default function Pipeline() {
  const [filterUser, setFilterUser] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [isNewDealDialogOpen, setIsNewDealDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/pipeline', { user: filterUser, sort: sortBy }],
  });

  const stages = isLoading ? [] : data?.stages || [];
  const users = isLoading ? [] : data?.users || [];
  
  // Create new deal form
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: "",
      description: "",
      value: 0,
      stageId: selectedStageId,
      ownerId: 0,
      contactId: 1, // Default to first contact
    },
  });
  
  // Reset form with selected stage when dialog opens
  React.useEffect(() => {
    if (isNewDealDialogOpen && selectedStageId) {
      form.setValue("stageId", selectedStageId);
    }
  }, [isNewDealDialogOpen, selectedStageId, form]);
  
  // Create deal mutation
  const { mutate: createDeal, isPending } = useMutation({
    mutationFn: (data: DealFormValues) => {
      return apiRequest("POST", "/api/deals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/overview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      
      toast({
        title: "Success",
        description: "New deal created successfully",
      });
      
      // Reset and close form
      form.reset();
      setIsNewDealDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle opening the New Deal dialog
  const handleOpenNewDealDialog = (stageId?: number) => {
    // If a stage ID is provided, pre-select it
    if (stageId) {
      setSelectedStageId(stageId);
    } else {
      // Default to first stage if no stage ID is provided
      setSelectedStageId(stages.length > 0 ? Number(stages[0].id) : 0);
    }
    setIsNewDealDialogOpen(true);
  };
  
  // Handle form submission
  const onSubmit = (data: DealFormValues) => {
    console.log("Creating new deal:", data);
    createDeal(data);
  };

  const [isDragging, setIsDragging] = useState(false);
  const { mutate: updateDealStage } = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string, stageId: number | string }) => {
      return apiRequest("PATCH", `/api/deals/${dealId}/stage`, { stageId: Number(stageId) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline'] });
      // Also invalidate the dashboard pipeline overview
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/overview'] });
      
      toast({
        title: "Deal updated",
        description: "Deal moved to new stage successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update deal stage. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDragStart = (e: React.DragEvent, dealId: string, currentStageId: string) => {
    setIsDragging(true);
    e.dataTransfer.setData('dealId', dealId);
    e.dataTransfer.setData('currentStageId', currentStageId);
    
    // Add a drag image/ghost element for better feedback
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1px transparent GIF
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Apply styling to the dragged element
    const element = e.currentTarget as HTMLElement;
    element.classList.add('opacity-50', 'scale-95');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    
    // Remove styling from the dragged element
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('opacity-50', 'scale-95');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Provide visual feedback for the drop target
    const element = e.currentTarget as HTMLElement;
    element.classList.add('bg-slate-100', 'dark:bg-slate-600/30');
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    // Remove visual feedback when leaving the drop target
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('bg-slate-100', 'dark:bg-slate-600/30');
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    const currentStageId = e.dataTransfer.getData('currentStageId');
    
    // Remove visual feedback
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('bg-slate-100', 'dark:bg-slate-600/30');

    if (currentStageId !== targetStageId) {
      console.log(`Move deal ${dealId} from stage ${currentStageId} to ${targetStageId}`);
      // Call the mutation to update the deal stage
      updateDealStage({ dealId, stageId: targetStageId });
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Pipeline</h1>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center">
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <ChevronDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="value-desc">Value (High to Low)</SelectItem>
                  <SelectItem value="value-asc">Value (Low to High)</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="ml-auto"
              onClick={() => handleOpenNewDealDialog()}
            >
              <Plus className="mr-2 h-4 w-4" /> New Deal
            </Button>
          </div>
        </div>
      </div>

      {/* New Deal Dialog */}
      <Dialog open={isNewDealDialogOpen} onOpenChange={setIsNewDealDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
            <DialogDescription>
              Add a new deal to your sales pipeline.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="New client agreement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the deal" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === "" ? "0" : e.target.value;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(val) => field.onChange(Number(val))}
                        defaultValue={String(selectedStageId)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stages.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              {stage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewDealDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Deal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Sales Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="-mx-5 px-5 pt-4">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-5 pb-4 min-w-max">
              {isLoading ? (
                // Skeleton loaders for stages
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="pipeline-column bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Skeleton className="h-2 w-2 rounded-full mr-2" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-6 ml-2 rounded-full" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                    
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full rounded-lg" />
                      <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                  </div>
                ))
              ) : (
                stages.map((stage) => (
                  <div 
                    key={stage.id} 
                    className="pipeline-column bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 min-h-[300px] w-[250px]"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm flex items-center">
                        <span className={`w-2 h-2 rounded-full bg-${stage.color} mr-2`}></span>
                        {stage.name}
                        <span className="ml-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs px-2">
                          {stage.deals.length}
                        </span>
                      </h3>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {formatCurrency(stage.totalValue)}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {stage.deals.map((deal) => (
                        <DealCard 
                          key={deal.id} 
                          deal={{...deal, stageId: stage.id}}
                          badgeColor={stage.color}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary dark:hover:text-primary-300 dark:hover:border-primary-500"
                        onClick={() => handleOpenNewDealDialog(stage.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deal
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
