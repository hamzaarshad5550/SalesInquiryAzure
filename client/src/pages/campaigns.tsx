import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchCampaigns, createCampaign, updateCampaign, deleteCampaign } from "@/lib/supabase";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { CampaignFormSchema } from "@/components/campaigns/CampaignForm";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Campaign {
  id: number;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'planning';
  startDate: string;
  endDate: string;
  budget?: number;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  campaign_type?: string;
  target_audience?: string[];
  products?: string[];
  locations?: string[];
  marketing_channels?: string[];
  success_metrics?: any;
  media_assets?: any;
  compliance_notes?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approval_date?: string | null;
  actual_spend?: number;
  performance_metrics?: any;
  thumbnail_url?: string;
  tags?: string[];
  rich_description?: string;
  audience_criteria?: any;
  status_automation?: any;
  last_status_update?: string | null;
}

// Default user ID to use when no authenticated user is found
const DEFAULT_USER_ID = 1;

export default function Campaigns() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { toast } = useToast();
  const hasAttemptedTestCreation = useRef(false);

  // Fetch campaigns with default user ID
  const { data: campaigns, isLoading, error, refetch } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchCampaigns({ ownerId: DEFAULT_USER_ID }),
  });

  // Add test campaign on mount - Temporarily commented out to prevent repeated creation
  /*
  useEffect(() => {
    const createTestCampaign = async () => {
      if (hasAttemptedTestCreation.current) return;
      
      try {
        console.log("[DEBUG] Attempting to create test campaign...");
        const testCampaign = {
          name: "Test Campaign",
          description: "A test campaign to verify database connectivity",
          status: "active",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          budget: 1000,
          ownerId: DEFAULT_USER_ID
        };
        await createCampaign(testCampaign);
        console.log("[DEBUG] Test campaign created successfully");
        toast({
          title: "Test campaign created",
          description: "A test campaign has been created to verify database connectivity.",
        });
        refetch();
      } catch (error) {
        console.error("[ERROR] Failed to create test campaign:", error);
        toast({
          title: "Error",
          description: "Failed to create test campaign. Please check the console for details.",
          variant: "destructive",
        });
      } finally {
        hasAttemptedTestCreation.current = true;
      }
    };

    // Only create test campaign if there are no campaigns and we haven't tried before
    if (!hasAttemptedTestCreation.current && (!campaigns || campaigns.length === 0)) {
      createTestCampaign();
    }
  }, [campaigns, refetch, toast]);
  */

  // Handle create campaign
  const handleCreateCampaign = async (formData: CampaignFormSchema) => {
    try {
      const campaignData: Campaign = {
        id: 0, // Temporary ID, will be ignored by supabase for new inserts
        name: formData.name,
        description: formData.description,
        status: formData.status,
        startDate: formData.start_date.toISOString(),
        endDate: formData.end_date.toISOString(),
        budget: formData.budget,
        ownerId: DEFAULT_USER_ID, // Use default user ID
        createdAt: new Date().toISOString(), // Assuming creation date is handled here
        updatedAt: new Date().toISOString(), // Assuming update date is handled here
        campaign_type: formData.campaign_type,
        approval_status: formData.approval_status,
        approved_by: formData.approved_by,
        approval_date: formData.approval_date?.toISOString() || null, // Ensure string or null for supabase
        compliance_notes: formData.compliance_notes,
        target_audience: formData.target_audience,
        products: formData.products,
        locations: formData.locations,
        marketing_channels: formData.marketing_channels,
        success_metrics: formData.success_metrics,
        media_assets: formData.media_assets,
        actual_spend: formData.actual_spend,
        performance_metrics: formData.performance_metrics,
        thumbnail_url: formData.thumbnail_url,
        tags: formData.tags,
        rich_description: formData.rich_description,
        audience_criteria: formData.audience_criteria,
        status_automation: formData.status_automation,
        last_status_update: formData.last_status_update?.toISOString() || null // Ensure string or null
      };
      await createCampaign(campaignData);
      setIsCreateDialogOpen(false);
      toast({
        title: "Campaign created",
        description: "The campaign has been created successfully.",
      });
      refetch();
    } catch (err) {
      console.error("Error creating campaign:", err);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle edit campaign
  const handleEditCampaign = async (formData: CampaignFormSchema) => {
    if (!selectedCampaign) return;
    try {
      const campaignData: Campaign = {
        id: selectedCampaign.id, // Use existing ID for update
        name: formData.name,
        description: formData.description,
        status: formData.status,
        startDate: formData.start_date.toISOString(),
        endDate: formData.end_date.toISOString(),
        budget: formData.budget,
        ownerId: DEFAULT_USER_ID, // Use default user ID
        createdAt: selectedCampaign.createdAt, // Preserve original creation date
        updatedAt: new Date().toISOString(), // Update timestamp on edit
        campaign_type: formData.campaign_type,
        approval_status: formData.approval_status,
        approved_by: formData.approved_by,
        approval_date: formData.approval_date?.toISOString() || null,
        compliance_notes: formData.compliance_notes,
        target_audience: formData.target_audience,
        products: formData.products,
        locations: formData.locations,
        marketing_channels: formData.marketing_channels,
        success_metrics: formData.success_metrics,
        media_assets: formData.media_assets,
        actual_spend: formData.actual_spend,
        performance_metrics: formData.performance_metrics,
        thumbnail_url: formData.thumbnail_url,
        tags: formData.tags,
        rich_description: formData.rich_description,
        audience_criteria: formData.audience_criteria,
        status_automation: formData.status_automation,
        last_status_update: formData.last_status_update?.toISOString() || null
      };
      await updateCampaign(selectedCampaign.id, campaignData);
      setIsEditDialogOpen(false);
      toast({
        title: "Campaign updated",
        description: "The campaign has been updated successfully.",
      });
      refetch();
    } catch (err) {
      console.error("Error updating campaign:", err);
      toast({
        title: "Error",
        description: "Failed to update campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle delete campaign
  const handleDeleteCampaign = async (id: number) => {
    try {
      await deleteCampaign(id);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Campaign deleted",
        description: "The campaign has been deleted successfully.",
      });
      refetch();
    } catch (err) {
      console.error("Error deleting campaign:", err);
      toast({
        title: "Error",
        description: "Failed to delete campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading campaigns...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-red-600">
        <p>Error loading campaigns</p>
        <p className="text-sm mt-2">Please try refreshing the page</p>
      </div>
    </div>
  );

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Sales Campaigns</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>Add a new sales campaign with detailed information.</DialogDescription>
              </DialogHeader>
              <CampaignForm
                onSubmit={handleCreateCampaign}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead className="w-[150px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Target Audience</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Actual Spend</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns?.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">
                  {campaign.thumbnail_url && (
                    <img 
                      src={campaign.thumbnail_url} 
                      alt={campaign.name} 
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <span>{campaign.name}</span>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={campaign.description}>
                    {campaign.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    campaign.status === 'active' ? 'secondary' :
                    campaign.status === 'completed' ? 'secondary' :
                    campaign.status === 'cancelled' ? 'destructive' :
                    'default'
                  }>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell>{campaign.campaign_type || 'N/A'}</TableCell>
                <TableCell>
                  <div className="max-w-[150px]">
                    {campaign.target_audience?.map((audience: string, index: number) => (
                      <Badge key={index} variant="outline" className="mr-1 mb-1">
                        {audience}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px]">
                    {campaign.products?.map((product: string, index: number) => (
                      <Badge key={index} variant="outline" className="mr-1 mb-1">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>${campaign.budget?.toLocaleString() || '0'}</TableCell>
                <TableCell>${campaign.actual_spend?.toLocaleString() || '0'}</TableCell>
                <TableCell>
                  <Badge variant={
                    campaign.approval_status === 'approved' ? 'secondary' :
                    campaign.approval_status === 'rejected' ? 'destructive' :
                    'default'
                  }>
                    {campaign.approval_status || 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(campaign.startDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>{format(new Date(campaign.endDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { 
                        setSelectedCampaign(campaign as Campaign); 
                        setIsEditDialogOpen(true); 
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { 
                        setSelectedCampaign(campaign); 
                        setIsDeleteDialogOpen(true); 
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>Update campaign details.</DialogDescription>
          </DialogHeader>
          <CampaignForm
            initialData={selectedCampaign ?? undefined}
            onSubmit={handleEditCampaign}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>Are you sure you want to delete this campaign?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => selectedCampaign && handleDeleteCampaign(selectedCampaign.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
} 