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
import { Search, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface CampaignTarget {
  id: number;
  campaign_id: number;
  contact_id: number;
  status: string;
  contact: Contact;
}

interface CampaignTargetsProps {
  campaignId: number;
}

export function CampaignTargets({ campaignId }: CampaignTargetsProps) {
  const [targets, setTargets] = useState<CampaignTarget[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  useEffect(() => {
    fetchTargets();
    fetchContacts();
  }, [campaignId]);

  const fetchTargets = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_targets')
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq('campaign_id', campaignId);

      if (error) throw error;
      setTargets(data || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleAddTarget = async () => {
    if (!selectedContactId) return;

    try {
      const { error } = await supabase
        .from('campaign_targets')
        .insert({
          campaign_id: campaignId,
          contact_id: parseInt(selectedContactId),
          status: 'pending',
        });

      if (error) throw error;

      setIsAddDialogOpen(false);
      setSelectedContactId('');
      fetchTargets();
    } catch (error) {
      console.error('Error adding target:', error);
    }
  };

  const handleRemoveTarget = async (targetId: number) => {
    try {
      const { error } = await supabase
        .from('campaign_targets')
        .delete()
        .eq('id', targetId);

      if (error) throw error;
      fetchTargets();
    } catch (error) {
      console.error('Error removing target:', error);
    }
  };

  const handleUpdateStatus = async (targetId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('campaign_targets')
        .update({ status: newStatus })
        .eq('id', targetId);

      if (error) throw error;
      fetchTargets();
    } catch (error) {
      console.error('Error updating target status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500',
      contacted: 'bg-blue-500',
      interested: 'bg-green-500',
      not_interested: 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const filteredTargets = targets.filter((target) =>
    target.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    target.contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search targets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Target
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Campaign Target</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select
                value={selectedContactId}
                onValueChange={setSelectedContactId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id.toString()}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddTarget}>Add Target</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTargets.map((target) => (
            <TableRow key={target.id}>
              <TableCell>{target.contact.name}</TableCell>
              <TableCell>{target.contact.email}</TableCell>
              <TableCell>{target.contact.phone}</TableCell>
              <TableCell>
                <Select
                  value={target.status}
                  onValueChange={(value) => handleUpdateStatus(target.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      <Badge className={getStatusColor(target.status)}>
                        {target.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTarget(target.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 