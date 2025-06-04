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
import { Search, Plus, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { format } from 'date-fns';

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
  const [newActivity, setNewActivity] = useState({
    type: '',
    description: '',
    scheduled_at: '',
    status: 'scheduled',
  });

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
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    try {
      const { error } = await supabase
        .from('campaign_activities')
        .insert({
          campaign_id: campaignId,
          ...newActivity,
        });

      if (error) throw error;

      setIsAddDialogOpen(false);
      setNewActivity({
        type: '',
        description: '',
        scheduled_at: '',
        status: 'scheduled',
      });
      fetchActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const handleUpdateStatus = async (activityId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('campaign_activities')
        .update({ status: newStatus })
        .eq('id', activityId);

      if (error) throw error;
      fetchActivities();
    } catch (error) {
      console.error('Error updating activity status:', error);
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
                type="datetime-local"
                value={newActivity.scheduled_at}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, scheduled_at: e.target.value })
                }
              />

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
                    handleUpdateStatus(activity.id, value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
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
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUpdateStatus(activity.id, 'completed')}
                >
                  Mark Complete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 