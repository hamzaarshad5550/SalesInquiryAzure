// client/src/components/campaigns/CampaignForm.tsx
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Calendar } from '../ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  end_date: z.date({
    required_error: 'End date is required',
  }),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'planning']),
  budget: z.coerce.number(),
  campaign_type: z.string().optional(),
  target_audience: z.string().optional().transform((val) => val ? val.split(',').map(s => s.trim()) : []),
  products: z.string().optional().transform((val) => val ? val.split(',').map(s => s.trim()) : []),
  locations: z.string().optional().transform((val) => val ? val.split(',').map(s => s.trim()) : []),
  marketing_channels: z.string().optional().transform((val) => val ? val.split(',').map(s => s.trim()) : []),
  success_metrics: z.any().optional(),
  media_assets: z.any().optional(),
  compliance_notes: z.string().optional(),
  approved_by: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  approval_date: z.date().optional().nullable(),
  actual_spend: z.coerce.number().optional(),
  thumbnail_url: z.string().url("Invalid URL").optional().or(z.literal("")).transform((val) => {
    if (val && val.includes("drive.google.com/uc?export=view&id=")) {
      const urlParams = new URLSearchParams(val.split('?')[1]);
      const id = urlParams.get('id');
      if (id) {
        return `https://drive.google.com/uc?export=download&id=${id}`;
      }
    }
    return val;
  }),
  tags: z.string().optional().transform((val) => val ? val.split(',').map(s => s.trim()) : []),
  rich_description: z.string().optional(),
  last_status_update: z.date().optional().nullable(),
});

export type CampaignFormOutput = z.infer<typeof campaignSchema>;
export type CampaignFormInput = z.input<typeof campaignSchema>;

interface CampaignFormProps {
  initialData?: {
    id?: number;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: string;
    budget?: number;
    campaign_type?: string;
    target_audience?: string[];
    products?: string[];
    locations?: string[];
    marketing_channels?: string[];
    success_metrics?: any;
    media_assets?: any;
    compliance_notes?: string;
    approved_by?: number;
    approval_date?: string | null;
    actual_spend?: number;
    thumbnail_url?: string;
    tags?: string[];
    rich_description?: string;
    last_status_update?: string | null;
  };
  onSubmit: (data: CampaignFormOutput) => void;
  onCancel: () => void;
}

export function CampaignForm({ initialData, onSubmit, onCancel }: CampaignFormProps) {
  const defaultValues: CampaignFormInput = {
    name: initialData?.name || '',
    description: initialData?.description || '',
    start_date: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
    end_date: initialData?.endDate ? new Date(initialData.endDate) : new Date(),
    status: (initialData?.status || 'draft') as 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled' | 'planning',
    budget: initialData?.budget?.toString() || '0',
    campaign_type: initialData?.campaign_type || '',
    target_audience: initialData?.target_audience?.join(', ') || '',
    products: initialData?.products?.join(', ') || '',
    locations: initialData?.locations?.join(', ') || '',
    marketing_channels: initialData?.marketing_channels?.join(', ') || '',
    success_metrics: initialData?.success_metrics || undefined,
    media_assets: initialData?.media_assets || undefined,
    compliance_notes: initialData?.compliance_notes || '',
    approved_by: initialData?.approved_by?.toString() || '',
    approval_date: initialData?.approval_date ? new Date(initialData.approval_date) : null,
    actual_spend: initialData?.actual_spend?.toString() || '0',
    thumbnail_url: initialData?.thumbnail_url || '',
    tags: initialData?.tags?.join(', ') || '',
    rich_description: initialData?.rich_description || '',
    last_status_update: initialData?.last_status_update ? new Date(initialData.last_status_update) : null,
  };

  const form = useForm<CampaignFormInput>({
    resolver: zodResolver(campaignSchema),
    defaultValues: defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => {
        onSubmit(data as CampaignFormOutput);
      })} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter campaign name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thumbnail_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Thumbnail / Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter image URL" {...field} />
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
                <Textarea placeholder="Enter campaign description" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rich_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rich Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter detailed campaign description (e.g., eligibility, terms)" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter campaign budget"
                    {...field}
                    value={field.value?.toString() || ''}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="campaign_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="web_banner">Web Banner</SelectItem>
                    <SelectItem value="print">Print</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags or Categories (comma-separated)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Health, Wellness, Prescription"
                    {...field}
                    value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                    onChange={e => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="target_audience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Patient Segments (comma-separated)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Seniors, Children, Diabetics"
                    {...field}
                    value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                    onChange={e => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="products"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Associations (comma-separated)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Vitamin D, Zinc, Cold Relief Kits"
                    {...field}
                    value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                    onChange={e => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="compliance_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compliance Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter any compliance related notes" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="approved_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approved By</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter approver user ID"
                    {...field}
                    value={field.value?.toString() || ''}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="actual_spend"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Spend</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter actual spend"
                    {...field}
                    value={field.value?.toString() || ''}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </Form>
  );
}