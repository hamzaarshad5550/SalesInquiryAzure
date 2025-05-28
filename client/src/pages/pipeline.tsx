import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, User, DollarSign, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { fetchPipelineStages, fetchDeals, createDeal, moveDealToStage } from "../lib/supabase";
import { formatCurrency } from "../lib/utils";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";

// Default pipeline stages if none exist in the database
const DEFAULT_PIPELINE_STAGES = [
  { id: "1", name: "Lead", color: "blue", order: 1 },
  { id: "2", name: "Qualified", color: "indigo", order: 2 },
  { id: "3", name: "Proposal", color: "purple", order: 3 },
  { id: "4", name: "Negotiation", color: "amber", order: 4 },
  { id: "5", name: "Closed Won", color: "green", order: 5 }
];

// Form schema for creating a new deal
const dealFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  stageId: z.string().min(1, "Stage is required"),
  expectedCloseDate: z.string().optional(),
  probability: z.coerce.number().min(0).max(100).default(50),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

type DealCardProps = {
  deal: {
    id: string;
    name: string;
    value: number;
    description: string;
    updatedAt: string;
    stageId: string;
    owner: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  };
  badgeColor: string;
  onDragStart: (e: React.DragEvent, dealId: string, stageId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
};

function DealCard({ deal, badgeColor, onDragStart, onDragEnd }: DealCardProps) {
  const timeAgo = format(new Date(deal.updatedAt), "MMM d, yyyy");
  
  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 p-3 cursor-move"
      draggable
      onDragStart={(e) => onDragStart(e, deal.id, deal.stageId)}
      onDragEnd={onDragEnd}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-sm">{deal.name}</h3>
        <span className={`text-xs px-2 py-1 rounded-full bg-${badgeColor}-100 text-${badgeColor}-800 dark:bg-${badgeColor}-900 dark:text-${badgeColor}-300`}>
          {formatCurrency(deal.value)}
        </span>
      </div>
      
      {deal.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
          {deal.description}
        </p>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Avatar className="h-6 w-6 mr-1">
            <AvatarImage src={deal.owner.avatarUrl} />
            <AvatarFallback className="text-xs">
              {deal.owner.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-slate-500 dark:text-slate-400">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewDealDialogOpen, setIsNewDealDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("updated");
  
  // Get pipeline stages
  const { data: stagesData, isLoading: stagesLoading } = useQuery({
    queryKey: ['pipelineStages'],
    queryFn: fetchPipelineStages,
  });
  
  // Get deals
  const { data: dealsData, isLoading: dealsLoading, refetch } = useQuery({
    queryKey: ['deals', { user: filterUser, sort: sortBy }],
    queryFn: () => fetchDeals({ ownerId: filterUser }),
  });
  
  // Get users for filtering
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching users:", error);
        return [{ id: 1, name: "Default User" }];
      }
    }
  });
  
  // Create normalized users array
  const normalizedUsers = useMemo(() => {
    if (!usersData) return [{ id: "1", name: "Default User" }];
    
    return usersData.map(user => ({
      id: String(user.id),
      name: user.name || user.username || user.full_name || `User ${user.id}`
    }));
  }, [usersData]);
  
  // Combined loading state
  const isLoading = stagesLoading || dealsLoading;

  // Process data for display
  const stages = useMemo(() => {
    if (!stagesData) return [];
    
    return stagesData.map(stage => {
      // Filter deals for this stage
      const stageDeals = dealsData
        ? dealsData
            .filter(deal => String(deal.stage) === String(stage.id))
            .map(deal => ({
              id: String(deal.id),
              name: deal.title,
              value: Number(deal.value) || 0,
              description: deal.description || "",
              updatedAt: deal.updated_at,
              stageId: String(deal.stage),
              owner: {
                id: String(deal.owner_id),
                name: "Owner", // Default name
                avatarUrl: ""
              }
            }))
        : [];
      
      // Calculate total value for this stage
      const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
      
      return {
        id: String(stage.id),
        name: stage.name,
        color: stage.color,
        order: stage.order,
        deals: stageDeals,
        totalValue
      };
    }).sort((a, b) => a.order - b.order);
  }, [stagesData, dealsData]);
  
  // Create deal mutation
  const { mutate: createDealMutation, isPending } = useMutation({
    mutationFn: async (data: DealFormValues) => {
      // Create a deal directly in Supabase with the exact column names from the database
      const dealData = {
        title: data.name,
        description: data.description || null,
        value: Number(data.value) || 0,
        currency: "USD",
        stage: data.stageId,
        confidence: data.probability,
        owner_id: 1, // Default owner ID
        contact_id: 1, // Default contact ID
        expected_close_date: data.expectedCloseDate || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return createDeal(dealData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      
      toast({
        title: "Deal created",
        description: "New deal created successfully",
      });
      
      form.reset();
      setIsNewDealDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update deal stage mutation
  const { mutate: updateDealStageMutation } = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string, stageId: string }) => {
      return moveDealToStage(dealId, stageId);  // This now uses 'stage' internally
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      
      toast({
        title: "Deal updated",
        description: "Deal moved to new stage successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update deal stage. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Create new deal form
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: "",
      description: "",
      value: 0,
      stageId: selectedStageId || "1",
      expectedCloseDate: "",
      probability: 50,
    },
  });
  
  // Reset form with selected stage when dialog opens
  useEffect(() => {
    if (isNewDealDialogOpen && selectedStageId) {
      form.setValue("stageId", selectedStageId);
    }
  }, [isNewDealDialogOpen, selectedStageId, form]);
  
  // Handle form submission
  const onSubmit = (data: DealFormValues) => {
    createDealMutation(data);
  };
  
  // Handle opening the new deal dialog
  const handleOpenNewDealDialog = (stageId?: string) => {
    if (stageId) {
      setSelectedStageId(stageId);
    }
    setIsNewDealDialogOpen(true);
  };
  
  // Drag and drop functionality
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragStart = (e: React.DragEvent, dealId: string, stageId: string) => {
    setIsDragging(true);
    e.dataTransfer.setData('dealId', dealId);
    e.dataTransfer.setData('currentStageId', stageId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDragging) {
      const element = e.currentTarget as HTMLElement;
      element.classList.add('bg-slate-100', 'dark:bg-slate-600/30');
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
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
      updateDealStageMutation({ dealId, stageId: targetStageId });
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button 
            onClick={() => handleOpenNewDealDialog()}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="created">Recently Created</SelectItem>
              <SelectItem value="value">Highest Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-max">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[250px] bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                <Skeleton className="h-6 w-full mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
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
                      onDragStart={(e) => handleDragStart(e, deal.id, stage.id)}
                      onDragEnd={(e) => handleDragEnd(e)}
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
      
      {/* New Deal Dialog */}
      <Dialog open={isNewDealDialogOpen} onOpenChange={setIsNewDealDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter deal name" {...field} />
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
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stages.map((stage) => (
                            <SelectItem key={stage.id} value={String(stage.id)}>
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
    </div>
  );
}
