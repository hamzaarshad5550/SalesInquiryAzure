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
  const [newMetric, setNewMetric] = useState({
    metric_type: '',
    value: '',
  });

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
      fetchMetrics();
    } catch (error) {
      console.error('Error adding metric:', error);
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
    const labels: { [key: string]: string } = {
      leads: 'Leads Generated',
      conversions: 'Conversions',
      revenue: 'Revenue ($)',
      engagement: 'Engagement Rate (%)',
    };
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

      <div className="flex justify-end">
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