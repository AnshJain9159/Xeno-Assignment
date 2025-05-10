// app/(main)/campaigns/[campaignId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ICampaign } from '@/models/campaign'; // Adjust path
import { ICommunicationLog } from '@/models/communicationLog'; // Adjust path
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Dummy function to fetch campaign details - implement this API route
async function fetchCampaignDetails(id: string): Promise<{ campaign: ICampaign | null; logs: ICommunicationLog[] }> {
    // In a real app, you'd have an API endpoint like /api/campaigns/[campaignId]
    // For now, this is a placeholder.
    // console.log(`Fetching details for campaign ${id}... (API not yet implemented)`);
    const campaignRes = await fetch(`/api/campaigns/${id}`);
    const logsRes = await fetch(`/api/campaigns/${id}/logs`);
    if (!campaignRes.ok) throw new Error("Failed to fetch campaign details");
    const campaignData = await campaignRes.json();
    const logsData = await logsRes.json();
    return { campaign: campaignData.campaign, logs: logsData.logs };
    // return { campaign: null, logs: [] }; // Placeholder
}


export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<ICampaign | null>(null);
  const [logs, setLogs] = useState<ICommunicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      const loadDetails = async () => {
        setIsLoading(true);
        try {
          // You'll need to create an API endpoint: GET /api/campaigns/[campaignId]
          // And potentially another for logs: GET /api/campaigns/[campaignId]/logs
          // For now, this is a conceptual structure.
          toast("Campaign detail API not fully implemented yet.");
          const { campaign: campaignData, logs: logsData } = await fetchCampaignDetails(campaignId);
          setCampaign(campaignData);
          setLogs(logsData);
        } catch (error: any) {
          console.error("Fetch campaign details error:", error);
          toast(error.message);
        } finally {
          setIsLoading(false);
        }
      };
      loadDetails();
    }
  }, [campaignId]);

  if (isLoading) {
    return <div className="container mx-auto p-8 text-center">Loading campaign details...</div>;
  }

  if (!campaign && !isLoading) { // Check !isLoading to avoid showing "not found" during initial load
    return <div className="container mx-auto p-8 text-center">Campaign not found or API not ready.</div>;
  }
  
  // This part will only render if campaign data is successfully fetched.
  // Since fetchCampaignDetails is a placeholder, this UI won't show much yet.
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {campaign && (
        <>
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                <CardDescription>
                    Status: <Badge variant={campaign.status === 'COMPLETED' ? 'success' : 'default'}>{campaign.status}</Badge> | 
                    Audience: {campaign.audienceSize} | 
                    Sent: {campaign.sentCount} | 
                    Failed: {campaign.failedCount}
                </CardDescription>
                <p className="text-sm text-muted-foreground">Created: {format(new Date(campaign.createdAt), "PPpp")}</p>
            </CardHeader>
            <CardContent>
                <h3 className="font-semibold mb-1">Message Template:</h3>
                <p className="text-sm bg-gray-100 p-2 rounded">{campaign.messageTemplate}</p>
                
                <h3 className="font-semibold mt-4 mb-1">Audience Rules:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(campaign.audienceRules, null, 2)}
                </pre>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Communication Logs ({logs.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                <p>No communication logs yet for this campaign.</p>
                ) : (
                <ul className="space-y-2">
                    {logs.map(log => (
                    <li key={log._id as string} className="text-sm border p-2 rounded">
                        Customer ID: {log.customerId} | Status: <Badge variant={log.status === 'SENT' || log.status === 'DELIVERED' ? 'success' : (log.status === 'FAILED' ? 'destructive' : 'secondary')}>{log.status}</Badge>
                        <p>Message: {log.message}</p>
                        {log.sentAt && <p>Sent: {format(new Date(log.sentAt), "Pp")}</p>}
                        {log.failedAt && <p>Failed: {format(new Date(log.failedAt), "Pp")} - {log.failureReason}</p>}
                    </li>
                    ))}
                </ul>
                )}
            </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
