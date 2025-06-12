// client/src/components/campaigns/CampaignForm.tsx
import React, { useState, useCallback } from 'react';
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
import { uploadFile, getFileUrl } from '../../lib/supabase';
import { FileUpload } from '../ui/file-upload';
import { useToast } from "@/hooks/use-toast";

// Utility function for delaying execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional().default(''),
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  end_date: z.date({
    required_error: 'End date is required',
  }),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'planning']),
  budget: z.string().transform((val) => val ? parseFloat(val) || 0 : 0),
  campaign_type: z.string().optional().default(''),
  target_audience: z.string().optional().default('').transform((val) => val ? val.split(',').map(s => s.trim()) : []),
  products: z.string().optional().default('').transform((val) => val ? val.split(',').map(s => s.trim()) : []),
  locations: z.string().optional().default('').transform((val) => val ? val.split(',').map(s => s.trim()) : []),
  marketing_channels: z.string().optional().default('').transform((val) => val ? val.split(',').map(s => s.trim()) : []),
  compliance_notes: z.string().optional().default(''),
  approved_by: z.string().optional().default('').transform((val) => val ? parseInt(val, 10) : undefined),
  approval_date: z.date().optional().nullable(),
  actual_spend: z.string().optional().default('').transform((val) => val ? parseFloat(val) || 0 : 0),
  thumbnail_url: z.union([
    z.string().url("Invalid URL").optional().or(z.literal("")),
    z.instanceof(File).refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "File size must be less than 5MB"
    ).refine(
      (file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      "File must be an image (JPEG, PNG, GIF, or WebP)"
    )
  ]).optional().default(''),
  tags: z.string().optional().default('').transform((val) => val ? val.split(',').map(s => s.trim()) : []),
  rich_description: z.string().optional().default(''),
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
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    // Initialize preview URL from initialData if available
    if (initialData?.thumbnail_url) {
      return initialData.thumbnail_url.replace(/^@/, '');
    }
    return null;
  });

  const defaultValues: CampaignFormInput = {
    name: initialData?.name || '',
    description: initialData?.description || '',
    start_date: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
    end_date: initialData?.endDate ? new Date(initialData.endDate) : new Date(),
    status: (initialData?.status || 'draft') as 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled' | 'planning',
    budget: initialData?.budget?.toString() || '0',
    campaign_type: initialData?.campaign_type || '',
    target_audience: Array.isArray(initialData?.target_audience) ? initialData.target_audience.join(', ') : '',
    products: Array.isArray(initialData?.products) ? initialData.products.join(', ') : '',
    locations: Array.isArray(initialData?.locations) ? initialData.locations.join(', ') : '',
    marketing_channels: Array.isArray(initialData?.marketing_channels) ? initialData.marketing_channels.join(', ') : '',
    compliance_notes: initialData?.compliance_notes || '',
    approved_by: initialData?.approved_by?.toString() || '',
    approval_date: initialData?.approval_date ? new Date(initialData.approval_date) : null,
    actual_spend: initialData?.actual_spend?.toString() || '0',
    thumbnail_url: (() => {
      const url = initialData?.thumbnail_url;
      if (typeof url === 'string' && url) {
        // Remove any leading '@' symbol if present
        const cleanedUrl = url.startsWith('@') ? url.substring(1) : url;
        
        // Handle Google Drive URL conversion
        if (cleanedUrl.includes("drive.google.com")) {
          try {
            const parsedUrl = new URL(cleanedUrl);
            if (parsedUrl.hostname === 'drive.google.com' && parsedUrl.searchParams.has('id')) {
              const id = parsedUrl.searchParams.get('id');
              return `https://drive.google.com/uc?export=download&id=${id}`;
            }
          } catch (e) {
            console.warn("Invalid Google Drive URL in initialData:", cleanedUrl, e);
          }
        }
        return cleanedUrl; // Return the cleaned URL (could be Supabase or other valid URL)
      }
      return ''; // Default to empty string if no URL or not a string
    })(),
    tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : '',
    rich_description: initialData?.rich_description || '',
    last_status_update: initialData?.last_status_update ? new Date(initialData.last_status_update) : null,
  };

  const form = useForm<CampaignFormInput>({
    resolver: zodResolver(campaignSchema),
    defaultValues,
  });

  // Handle immediate image preview
  const handleImagePreview = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      
      // Generate a unique filename with timestamp and random string
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const filePath = `${timestamp}_${randomString}.${fileExtension}`;

      // Store the generated filePath for logging
      console.log("[DEBUG] Generated filePath:", filePath);

      // Upload the file
      const uploadResult = await uploadFile('campaign-thumbnails', filePath, file);
      
      if (!uploadResult) {
        throw new Error('Upload failed');
      }

      // Get the public URL immediately and clean it up
      const publicUrl = await getFileUrl('campaign-thumbnails', filePath);
      
      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Verify the URL contains our generated filename
      if (!publicUrl.includes(filePath)) {
        console.error("[ERROR] URL mismatch - Generated:", filePath, "URL contains:", publicUrl);
        throw new Error('URL verification failed - filename mismatch');
      }

      // Clean up the URL by removing any double slashes and ensuring consistent format
      const cleanedUrl = publicUrl.replace(/([^:]\/)\/+/g, '$1');

      // Log the final URL for debugging
      console.log("[DEBUG] Final cleaned URL:", cleanedUrl);

      toast({
        title: "Image uploaded successfully",
        description: "The campaign thumbnail has been uploaded.",
      });

      return cleanedUrl;
    } catch (error) {
      console.error("[ERROR] Image upload failed:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(async (data) => {
        try {
          let finalThumbnailUrl = '';

          // Handle file upload if a new file is selected
          if (data.thumbnail_url instanceof File) {
            // Store the original file for logging
            console.log("[DEBUG] Uploading file:", data.thumbnail_url.name);
            finalThumbnailUrl = await handleImageUpload(data.thumbnail_url);
            // Log the final URL that will be stored in the database
            console.log("[DEBUG] URL to be stored in database:", finalThumbnailUrl);
          } else if (typeof data.thumbnail_url === 'string' && data.thumbnail_url) {
            // Clean up existing URL by removing any double slashes and @ symbol
            finalThumbnailUrl = data.thumbnail_url
              .replace(/^@/, '')
              .replace(/([^:]\/)\/+/g, '$1');
          }

          const dataToSubmit: CampaignFormOutput = {
            ...data,
            thumbnail_url: finalThumbnailUrl,
            description: data.description || '',
            campaign_type: data.campaign_type || '',
            budget: typeof data.budget === 'string' ? parseFloat(data.budget) || 0 : data.budget || 0,
            target_audience: typeof data.target_audience === 'string' ? data.target_audience.split(',').map(s => s.trim()) : [],
            products: typeof data.products === 'string' ? data.products.split(',').map(s => s.trim()) : [],
            locations: typeof data.locations === 'string' ? data.locations.split(',').map(s => s.trim()) : [],
            marketing_channels: typeof data.marketing_channels === 'string' ? data.marketing_channels.split(',').map(s => s.trim()) : [],
            compliance_notes: data.compliance_notes || '',
            approved_by: typeof data.approved_by === 'string' ? parseInt(data.approved_by, 10) || undefined : data.approved_by,
            actual_spend: typeof data.actual_spend === 'string' ? parseFloat(data.actual_spend) || 0 : data.actual_spend || 0,
            tags: typeof data.tags === 'string' ? data.tags.split(',').map(s => s.trim()) : [],
            rich_description: data.rich_description || '',
          };

          onSubmit(dataToSubmit);
        } catch (error) {
          console.error("[ERROR] Form submission failed:", error);
          toast({
            title: "Error",
            description: "Failed to submit the form. Please try again.",
            variant: "destructive",
          });
        }
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
              <FormLabel>Campaign Thumbnail</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <FileUpload
                    value={field.value}
                    onChange={async (file) => {
                      if (file instanceof File) {
                        // Show immediate preview
                        handleImagePreview(file);
                      }
                      field.onChange(file);
                    }}
                    onError={(error) => {
                      console.error("[ERROR] File upload error:", error);
                      form.setError('thumbnail_url', { message: error });
                      toast({
                        title: "Upload error",
                        description: error,
                        variant: "destructive",
                      });
                    }}
                    className="w-full"
                    aspectRatio={16/9}
                    minWidth={800}
                    minHeight={450}
                    maxWidth={3840}
                    maxHeight={2160}
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="text-sm text-muted-foreground">
                      Uploading image...
                    </div>
                  )}
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-48 rounded-md object-cover"
                      />
                    </div>
                  )}
                </div>
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
                    value={field.value || '0'}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      field.onChange(value);
                    }}
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
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9, ]/g, '');
                      field.onChange(value);
                    }}
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
                    value={field.value || ''}
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
                    value={field.value || ''}
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
                    placeholder="Enter approver ID"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      field.onChange(value);
                    }}
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
                    value={field.value || '0'}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      field.onChange(value);
                    }}
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