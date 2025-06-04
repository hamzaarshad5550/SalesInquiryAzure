import { useState } from "react";
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
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Campaign {
  id: number;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  budget?: number;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

// Default user ID to use when no authenticated user is found
const DEFAULT_USER_ID = 1;

export default function Campaigns() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { toast } = useToast();

  // Fetch campaigns with default user ID
  const { data: campaigns, isLoading, error, refetch } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchCampaigns({ ownerId: DEFAULT_USER_ID }),
  });

  // Handle create campaign
  const handleCreateCampaign = async (formData: any) => {
    try {
      const campaignData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        startDate: formData.start_date.toISOString(),
        endDate: formData.end_date.toISOString(),
        budget: formData.budget,
        ownerId: DEFAULT_USER_ID // Use default user ID
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
  const handleEditCampaign = async (formData: any) => {
    if (!selectedCampaign) return;
    try {
      const campaignData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        startDate: formData.start_date.toISOString(),
        endDate: formData.end_date.toISOString(),
        budget: formData.budget,
        ownerId: DEFAULT_USER_ID // Use default user ID
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>Add a new sales campaign.</DialogDescription>
              </DialogHeader>
              <CampaignForm
                onSubmit={handleCreateCampaign}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns?.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell>{campaign.name}</TableCell>
              <TableCell>{campaign.status}</TableCell>
              <TableCell>{format(new Date(campaign.startDate), 'MMM d, yyyy')}</TableCell>
              <TableCell>{format(new Date(campaign.endDate), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => { setSelectedCampaign(campaign); setIsEditDialogOpen(true); }}>
                  Edit
                </Button>
                <Button variant="outline" onClick={() => { setSelectedCampaign(campaign); setIsDeleteDialogOpen(true); }}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
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