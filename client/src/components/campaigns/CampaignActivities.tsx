import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search, Plus, Calendar, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface CampaignActivity {
  id: number;
  campaign_id: number;
  type: string;
  description: string;
  scheduled_at: string;
  status: string;
}

interface CampaignActivitiesProps {
  campaignId: number;
}

export function CampaignActivities({ campaignId }: CampaignActivitiesProps) {
  const [activities, setActivities] = useState<CampaignActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CampaignActivity | null>(null);
  const [newActivity, setNewActivity] = useState({
    type: '',
    description: '',
    scheduled_at: '',
    status: 'scheduled',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, [campaignId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_activities')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activities.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    try {
      const scheduledAtISO = newActivity.scheduled_at ? new Date(newActivity.scheduled_at).toISOString() : null;

      const { error } = await supabase
        .from('campaign_activities')
        .insert({
          campaign_id: campaignId,
          type: newActivity.type,
          description: newActivity.description,
          scheduled_at: scheduledAtISO,
          status: newActivity.status,
        });

      if (error) throw error;

      setIsAddDialogOpen(false);
      setNewActivity({
        type: '',
        description: '',
        scheduled_at: '',
        status: 'scheduled',
      });
      toast({
        title: "Activity added",
        description: "The activity has been added successfully.",
      });
      fetchActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: "Error",
        description: "Failed to add activity.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateActivity = async () => {
    if (!selectedActivity) return;
    try {
      const scheduledAtISO = selectedActivity.scheduled_at ? new Date(selectedActivity.scheduled_at).toISOString() : null;

      const { error } = await supabase
        .from('campaign_activities')
        .update({
          type: selectedActivity.type,
          description: selectedActivity.description,
          scheduled_at: scheduledAtISO,
          status: selectedActivity.status,
        })
        .eq('id', selectedActivity.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      setSelectedActivity(null);
      toast({
        title: "Activity updated",
        description: "The activity has been updated successfully.",
      });
      fetchActivities();
    } catch (error) {
      console.error('Error updating activity:', error);
      toast({
        title: "Error",
        description: "Failed to update activity.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteActivity = async () => {
    if (!selectedActivity) return;
    try {
      const { error } = await supabase
        .from('campaign_activities')
        .delete()
        .eq('id', selectedActivity.id);

      if (error) throw error;

      setIsDeleteDialogOpen(false);
      setSelectedActivity(null);
      toast({
        title: "Activity deleted",
        description: "The activity has been deleted successfully.",
      });
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-500',
      in_progress: 'bg-yellow-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const filteredActivities = activities.filter((activity) =>
    activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDatetimeLocal = (isoString: string | undefined) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Campaign Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select
                value={newActivity.type}
                onValueChange={(value) =>
                  setNewActivity({ ...newActivity, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Activity description"
                value={newActivity.description}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, description: e.target.value })
                }
              />

              <Input
                label="Scheduled At"
                type="datetime-local"
                value={newActivity.scheduled_at}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, scheduled_at: e.target.value })
                }
              />

              <Select
                value={newActivity.status}
                onValueChange={(value) =>
                  setNewActivity({ ...newActivity, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddActivity}>Add Activity</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Scheduled At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredActivities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell className="capitalize">{activity.type}</TableCell>
              <TableCell>{activity.description}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {format(new Date(activity.scheduled_at), 'MMM d, yyyy HH:mm')}
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={activity.status}
                  onValueChange={(value) =>
                    setActivities(activities.map(a => a.id === activity.id ? {...a, status: value} : a))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedActivity(activity); setIsEditDialogOpen(true); }}
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { setSelectedActivity(activity); setIsDeleteDialogOpen(true); }}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && filteredActivities.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No activities recorded yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Campaign Activity</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4 py-4">
              <Select
                value={selectedActivity.type}
                onValueChange={(value) =>
                  setSelectedActivity({ ...selectedActivity, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Activity description"
                value={selectedActivity.description}
                onChange={(e) =>
                  setSelectedActivity({ ...selectedActivity, description: e.target.value })
                }
              />

              <Input
                label="Scheduled At"
                type="datetime-local"
                value={formatDatetimeLocal(selectedActivity.scheduled_at)}
                onChange={(e) =>
                  setSelectedActivity({ ...selectedActivity, scheduled_at: e.target.value })
                }
              />

              <Select
                value={selectedActivity.status}
                onValueChange={(value) =>
                  setSelectedActivity({ ...selectedActivity, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateActivity}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteActivity}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 