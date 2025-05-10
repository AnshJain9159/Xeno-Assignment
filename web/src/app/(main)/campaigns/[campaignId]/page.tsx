/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(main)/campaigns/[campaignId]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import { ICampaign } from '@/models/campaign'; 
import { ICommunicationLog } from '@/models/communicationLog';
import { toast } from 'sonner'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge'; 
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowLeft, RefreshCw, SendIcon } from 'lucide-react'; 

async function fetchCampaignDetails(id: string): Promise<{ campaign: ICampaign | null; logs: ICommunicationLog[] }> {
  console.log(`Frontend: Fetching details for campaign ${id}`);
  try {
    const campaignRes = await fetch(`/api/campaigns/${id}`);
    const logsRes = await fetch(`/api/campaigns/${id}/logs`);

    if (!campaignRes.ok) {
      const errorData = await campaignRes.json().catch(() => ({ message: "Failed to fetch campaign details" }));
      throw new Error(errorData.message);
    }
    if (!logsRes.ok) {
      const errorData = await logsRes.json().catch(() => ({ message: "Failed to fetch campaign logs" }));
      throw new Error(errorData.message);
    }

    const campaignData = await campaignRes.json();
    const logsData = await logsRes.json();
    return { campaign: campaignData.campaign, logs: logsData.logs };
  } catch (error: any) {
    console.error(`Frontend: Error in fetchCampaignDetails for ${id}:`, error);
    throw error; 
  }
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<ICampaign | null>(null);
  const [logs, setLogs] = useState<ICommunicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false); // For "Send Campaign" button

  // Ref to store the interval ID
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadDetails = useCallback(async (showLoadingSpinner = true) => {
    if (!campaignId) return;
    if (showLoadingSpinner) setIsLoading(true);
    try {
      const { campaign: campaignData, logs: logsData } = await fetchCampaignDetails(campaignId);
      setCampaign(campaignData);
      setLogs(logsData);
      if (!campaignData) {
        toast.error("Campaign not found.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load campaign details.");
      setCampaign(null); // Clear campaign data on error
      setLogs([]);
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadDetails(true); // Initial load with spinner

    // Clear existing interval if campaignId changes or component unmounts
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Start polling only if campaignId is valid and campaign is in a state that might change
    if (campaignId && (!campaign || (campaign.status !== 'COMPLETED' && campaign.status !== 'FAILED'))) {
      console.log("Frontend: Starting polling interval");
      pollIntervalRef.current = setInterval(() => {
        console.log("Frontend: Polling for updates...");
        loadDetails(false); // Subsequent polls without full loading spinner
      }, 5000); // Poll every 5 seconds
    }

    // Cleanup function to clear interval when component unmounts or campaignId changes
    return () => {
      if (pollIntervalRef.current) {
        console.log("Frontend: Clearing polling interval");
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [campaignId, loadDetails, campaign?.status]); // Re-run if campaign status changes to stop polling for COMPLETED/FAILED

  const handleSendCampaign = async () => {
    if (!campaignId || (campaign && (campaign.status === "SENDING" || campaign.status === "COMPLETED"))) {
        toast.info(`Campaign is already ${campaign?.status?.toLowerCase() || 'in a non-sendable state'}.`);
        return;
    }
    setIsSending(true);
    try {
      toast.info("Attempting to start campaign delivery...");
      const res = await fetch(`/api/campaigns/${campaignId}/deliver`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to trigger delivery");
      }
      toast.success(data.message || "Campaign delivery process initiated!");
      // Manually trigger a refresh of details after starting delivery
      await loadDetails(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger delivery");
    } finally {
      setIsSending(false);
    }
  };


  if (isLoading && !campaign) { // Show main loader only on initial load if no campaign data yet
    return <div className="container mx-auto p-8 text-center">Loading campaign details...</div>;
  }

  if (!campaign && !isLoading) {
    return (
        <div className="container mx-auto p-8 text-center">
            <p>Campaign not found or an error occurred.</p>
            <Button onClick={() => router.push('/campaigns')} variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
            </Button>
        </div>
    );
  }
  
  // Type assertion for badge variant
  const getStatusBadgeVariant = (status: ICampaign['status']): typeof badgeVariants['arguments']['variant'] => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'SENDING': return 'default'; // Or a specific "warning" or "info" if you define them
      case 'DRAFT': return 'secondary';
      case 'FAILED': return 'destructive';
      case 'SCHEDULED': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {campaign && (
        <>
        <div className="flex justify-between items-center">
            <Button onClick={() => router.push('/campaigns')} variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
            </Button>
            <div className="flex items-center gap-2">
                <Button
                    onClick={handleSendCampaign}
                    disabled={isSending || campaign.status === "SENDING" || campaign.status === "COMPLETED" || campaign.status === "FAILED"}
                >
                    <SendIcon className="mr-2 h-4 w-4" />
                    {campaign.status === "SENDING" ? "Processing..." : 
                     campaign.status === "COMPLETED" ? "Completed" :
                     campaign.status === "FAILED" ? "Failed - Retry?" : // Consider a retry logic/button
                     "Send/Resume Campaign"}
                </Button>
                <Button onClick={() => loadDetails(false)} variant="outline" size="icon" title="Refresh Data" disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading && !campaign ? 'animate-spin' : ''}`} />
                </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                    <span>Status: <Badge variant={getStatusBadgeVariant(campaign.status)}>{campaign.status}</Badge></span>
                    <span>Audience: {campaign.audienceSize ?? 0}</span> 
                    <span>Sent: {campaign.sentCount ?? 0}</span> 
                    <span>Failed: {campaign.failedCount ?? 0}</span>
                </CardDescription>
                <p className="text-sm text-muted-foreground">Created: {format(new Date(campaign.createdAt), "PPpp")}</p>
            </CardHeader>
            <CardContent>
                <h3 className="font-semibold mb-1">Message Template:</h3>
                <p className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-md whitespace-pre-wrap">{campaign.messageTemplate}</p>
                
                <h3 className="font-semibold mt-4 mb-1">Audience Rules:</h3>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto">
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
                <p>No communication logs yet for this campaign. They will appear as messages are processed.</p>
                ) : (
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {logs.map(log => (
                    <div key={log._id as string} className="text-sm border p-3 rounded-md bg-background">
                        <div className="flex justify-between items-start">
                            <span className="text-xs text-muted-foreground break-all">Customer ID: {String(log.customerId)}</span>
                            <Badge variant={log.status === 'SENT' || log.status === 'DELIVERED' ? 'default' : (log.status === 'FAILED' ? 'destructive' : 'secondary')}>{log.status}</Badge>
                        </div>
                        <p className="my-1 text-muted-foreground whitespace-pre-wrap break-words">Message: &quot;{log.message}&quot;</p>
                        <div className="text-xs text-muted-foreground space-x-2">
                            {log.sentAt && <span>Sent: {format(new Date(log.sentAt), "Pp")}</span>}
                            {log.failedAt && <span>Failed: {format(new Date(log.failedAt), "Pp")} - {log.failureReason}</span>}
                            {!log.sentAt && !log.failedAt && log.createdAt && <span>Logged: {format(new Date(log.createdAt), "Pp")}</span>}
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
