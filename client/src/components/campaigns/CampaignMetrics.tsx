import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus } from 'lucide-react';
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface CampaignMetric {
  id: number;
  campaign_id: number;
  metric_type: string;
  value: number;
  recorded_at: string;
}

interface CampaignMetricsProps {
  campaignId: number;
}

export function CampaignMetrics({ campaignId }: CampaignMetricsProps) {
  const [metrics, setMetrics] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<CampaignMetric | null>(null);
  const [newMetric, setNewMetric] = useState({
    metric_type: '',
    value: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, [campaignId]);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetric = async () => {
    try {
      const { error } = await supabase
        .from('campaign_metrics')
        .insert({
          campaign_id: campaignId,
          metric_type: newMetric.metric_type,
          value: parseFloat(newMetric.value),
          recorded_at: new Date().toISOString(),
        });

      if (error) throw error;

      setIsAddDialogOpen(false);
      setNewMetric({
        metric_type: '',
        value: '',
      });
      toast({
        title: "Metric added",
        description: "The metric has been added successfully.",
      });
      fetchMetrics();
    } catch (error) {
      console.error('Error adding metric:', error);
       toast({
        title: "Error",
        description: "Failed to add metric.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMetric = async () => {
     if (!selectedMetric) return;
     try {
       const { error } = await supabase
         .from('campaign_metrics')
         .update({
           metric_type: selectedMetric.metric_type,
           value: selectedMetric.value,
         })
         .eq('id', selectedMetric.id);

       if (error) throw error;

       setIsEditDialogOpen(false);
       setSelectedMetric(null);
        toast({
        title: "Metric updated",
        description: "The metric has been updated successfully.",
      });
       fetchMetrics();
     } catch (error) {
       console.error('Error updating metric:', error);
        toast({
        title: "Error",
        description: "Failed to update metric.",
        variant: "destructive",
      });
     }
   };

  const handleDeleteMetric = async () => {
    if (!selectedMetric) return;
    try {
      const { error } = await supabase
        .from('campaign_metrics')
        .delete()
        .eq('id', selectedMetric.id);

      if (error) throw error;

      setIsDeleteDialogOpen(false);
      setSelectedMetric(null);
       toast({
        title: "Metric deleted",
        description: "The metric has been deleted successfully.",
      });
      fetchMetrics();
    } catch (error) {
      console.error('Error deleting metric:', error);
       toast({
        title: "Error",
        description: "Failed to delete metric.",
        variant: "destructive",
      });
    }
  };

  const getMetricData = () => {
    const metricTypes = Array.from(new Set(metrics.map((m) => m.metric_type)));
    const dates = Array.from(
      new Set(metrics.map((m) => new Date(m.recorded_at).toLocaleDateString()))
    );

    return dates.map((date) => {
      const data: any = { date };
      metricTypes.forEach((type) => {
        const metric = metrics.find(
          (m) =>
            m.metric_type === type &&
            new Date(m.recorded_at).toLocaleDateString() === date
        );
        data[type] = metric?.value || 0;
      });
      return data;
    });
  };

  const getMetricColor = (metricType: string) => {
    const colors: { [key: string]: string } = {
      leads: '#2563eb',
      conversions: '#16a34a',
      revenue: '#9333ea',
      engagement: '#ea580c',
    };
    return colors[metricType] || '#64748b';
  };

  const getMetricLabel = (metricType: string) => {
    const labels: { [key: string]: string } = (
      { leads: 'Leads Generated',
        conversions: 'Conversions',
        revenue: 'Revenue ($)',
        engagement: 'Engagement Rate (%)',}
    );
    return labels[metricType] || metricType;
  };

  const getLatestMetricValue = (metricType: string) => {
    const latestMetric = [...metrics]
      .filter((m) => m.metric_type === metricType)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
    return latestMetric?.value || 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['leads', 'conversions', 'revenue', 'engagement'].map((metricType) => (
          <Card key={metricType} className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              {getMetricLabel(metricType)}
            </h3>
            <p className="text-2xl font-bold">
              {metricType === 'revenue'
                ? `$${getLatestMetricValue(metricType).toLocaleString()}`
                : metricType === 'engagement'
                ? `${getLatestMetricValue(metricType)}%`
                : getLatestMetricValue(metricType)}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
         <h2 className="text-xl font-semibold">All Recorded Metrics</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Metric
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Campaign Metric</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select
                value={newMetric.metric_type}
                onValueChange={(value) =>
                  setNewMetric({ ...newMetric, metric_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select metric type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Leads Generated</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="engagement">Engagement Rate</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Enter value"
                value={newMetric.value}
                onChange={(e) =>
                  setNewMetric({ ...newMetric, value: e.target.value })
                }
              />

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddMetric}>Add Metric</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table to display all recorded metrics */}
       <Card className="p-4">
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Recorded At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => (
              <TableRow key={metric.id}>
                <TableCell>{getMetricLabel(metric.metric_type)}</TableCell>
                 <TableCell>
                  {metric.metric_type === 'revenue'
                    ? `$${metric.value.toLocaleString()}`
                    : metric.metric_type === 'engagement'
                    ? `${metric.value}%`
                    : metric.value}
                </TableCell>
                <TableCell>{format(new Date(metric.recorded_at), 'MMM d, yyyy HH:mm')}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedMetric(metric); setIsEditDialogOpen(true); }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => { setSelectedMetric(metric); setIsDeleteDialogOpen(true); }}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
             {!loading && metrics.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No metrics recorded yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
       </Card>

       {/* Edit Metric Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Edit Campaign Metric</DialogTitle>
           </DialogHeader>
           {selectedMetric && (
             <div className="space-y-4 py-4">
                <Select
                  value={selectedMetric.metric_type}
                  onValueChange={(value) =>
                    setSelectedMetric({ ...selectedMetric, metric_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">Leads Generated</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="engagement">Engagement Rate</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Enter value"
                  value={selectedMetric.value}
                  onChange={(e) =>
                     setSelectedMetric({ ...selectedMetric, value: parseFloat(e.target.value) || 0 })
                  }
                />
               <div className="flex justify-end gap-4">
                 <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                 <Button onClick={handleUpdateMetric}>Save Changes</Button>
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>

       {/* Delete Metric Dialog */}
       <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Delete Metric</DialogTitle>
             <DialogDescription>
               Are you sure you want to delete this metric?
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
             <Button variant="destructive" onClick={handleDeleteMetric}>Delete</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

      <Card className="p-6">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getMetricData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {Array.from(new Set(metrics.map((m) => m.metric_type))).map(
                (metricType) => (
                  <Line
                    key={metricType}
                    type="monotone"
                    dataKey={metricType}
                    stroke={getMetricColor(metricType)}
                    name={getMetricLabel(metricType)}
                  />
                )
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
} 