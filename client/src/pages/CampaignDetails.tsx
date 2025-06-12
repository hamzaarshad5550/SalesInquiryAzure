import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { format } from 'date-fns';
import { Calendar, Users, BarChart2, ArrowLeft } from 'lucide-react';
import { CampaignTargets } from '../components/campaigns/CampaignTargets';
import { CampaignActivities } from '../components/campaigns/CampaignActivities';
import { CampaignMetrics } from '../components/campaigns/CampaignMetrics';

interface Campaign {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'planning';
  budget?: number;
  owner_id: number;
  created_at: string;
  updated_at: string;
  campaign_type?: string;
  target_audience?: string[];
  products?: string[];
  locations?: string[];
  marketing_channels?: string[];
  compliance_notes?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approval_date?: string;
  actual_spend?: number;
  performance_metrics?: {
    views?: number;
    engagements?: number;
    conversions?: number;
  };
  thumbnail_url?: string;
  tags?: string[];
  rich_description?: any;
  audience_criteria?: any;
  status_automation?: any;
  last_status_update?: string;
}

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCampaign(data as Campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold mb-4">Campaign not found</h2>
        <Button onClick={() => navigate('/campaigns')}>Back to Campaigns</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/campaigns')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{campaign.name}</h1>
        <Badge className={getStatusColor(campaign.status)}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </Badge>
        {campaign.approval_status && (
          <Badge className={getApprovalStatusColor(campaign.approval_status)}>
            {campaign.approval_status.charAt(0).toUpperCase() + campaign.approval_status.slice(1)}
          </Badge>
        )}
      </div>

      {campaign.thumbnail_url && (
        <div className="w-full h-64 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
          <img src={campaign.thumbnail_url} alt={campaign.name} className="h-full w-full object-cover" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Description:</p>
            <p>{campaign.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Campaign Type:</p>
              <p>{campaign.campaign_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Status:</p>
              <p>{campaign.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Start Date:</p>
              <p>{format(new Date(campaign.start_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm font-medium">End Date:</p>
              <p>{format(new Date(campaign.end_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Budget:</p>
              <p>${campaign.budget?.toLocaleString() || '0'}</p>
            </div>
             <div>
              <p className="text-sm font-medium">Actual Spend:</p>
              <p>${campaign.actual_spend?.toLocaleString() || '0'}</p>
            </div>
             <div>
              <p className="text-sm font-medium">Tags:</p>
              <p>{campaign.tags?.join(', ') || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Targeting & Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
              <p className="text-sm font-medium">Target Audience:</p>
              <p>{campaign.target_audience?.join(', ') || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Associated Products:</p>
              <p>{campaign.products?.join(', ') || 'N/A'}</p>
            </div>
             <div>
              <p className="text-sm font-medium">Target Locations:</p>
              <p>{campaign.locations?.join(', ') || 'N/A'}</p>
            </div>
             <div>
              <p className="text-sm font-medium">Marketing Channels:</p>
              <p>{campaign.marketing_channels?.join(', ') || 'N/A'}</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approval & Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
              <p className="text-sm font-medium">Approval Status:</p>
              <p>{campaign.approval_status || 'Pending'}</p>
            </div>
             <div>
              <p className="text-sm font-medium">Approved By:</p>
              <p>{campaign.approved_by ? campaign.approved_by.toLocaleString() : 'N/A'}</p>
            </div>
             <div>
              <p className="text-sm font-medium">Approval Date:</p>
              <p>{campaign.approval_date ? format(new Date(campaign.approval_date), 'MMM d, yyyy') : 'N/A'}</p>
            </div>
             <div>
              <p className="text-sm font-medium">Compliance Notes:</p>
              <p>{campaign.compliance_notes || 'N/A'}</p>
            </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
              <p className="text-sm font-medium">Performance Metrics Preview:</p>
              <p>{campaign.performance_metrics ? JSON.stringify(campaign.performance_metrics) : 'N/A'}</p>
            </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="targets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        <TabsContent value="targets">
          <CampaignTargets campaignId={campaign.id} />
        </TabsContent>
        <TabsContent value="activities">
          <CampaignActivities campaignId={campaign.id} />
        </TabsContent>
        <TabsContent value="metrics">
          <CampaignMetrics campaignId={campaign.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 