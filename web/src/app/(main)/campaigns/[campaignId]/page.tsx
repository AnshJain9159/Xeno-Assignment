/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import type { ICampaign } from "@/models/campaign"
import type { ICommunicationLog } from "@/models/communicationLog"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge, type badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import {
  ArrowLeft,
  RefreshCw,
  SendIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
  Search,
  Filter,
  Loader2,
} from "lucide-react"
import CampaignSummary from "@/components/campaignSummary"
import CampaignTags from "@/components/campaignAutotag"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
async function fetchCampaignDetails(id: string): Promise<{ campaign: ICampaign | null; logs: ICommunicationLog[] }> {
  console.log(`Frontend: Fetching details for campaign ${id}`)
  try {
    const campaignRes = await fetch(`/api/campaigns/${id}`)
    const logsRes = await fetch(`/api/campaigns/${id}/logs`)

    if (!campaignRes.ok) {
      const errorData = await campaignRes.json().catch(() => ({ message: "Failed to fetch campaign details" }))
      throw new Error(errorData.message)
    }
    if (!logsRes.ok) {
      const errorData = await logsRes.json().catch(() => ({ message: "Failed to fetch campaign logs" }))
      throw new Error(errorData.message)
    }

    const campaignData = await campaignRes.json()
    const logsData = await logsRes.json()
    return { campaign: campaignData.campaign, logs: logsData.logs }
  } catch (error: any) {
    console.error(`Frontend: Error in fetchCampaignDetails for ${id}:`, error)
    throw error
  }
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.campaignId as string

  const [campaign, setCampaign] = useState<ICampaign | null>(null)
  const [logs, setLogs] = useState<ICommunicationLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { data: session, status } = useSession();
  
    useEffect(() => {
      if (status !== "authenticated") {
        toast.error("You must be signed in to view this page.")
        setTimeout(() => {
            router.push("/sign-in");
        }, 750);
        
      }
    }, [status]);
  // Ref to store the interval ID
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadDetails = useCallback(
    async (showLoadingSpinner = true) => {
      if (!campaignId) return
      if (showLoadingSpinner) setIsLoading(true)
      setIsRefreshing(true)
      try {
        const { campaign: campaignData, logs: logsData } = await fetchCampaignDetails(campaignId)
        setCampaign(campaignData)
        setLogs(logsData)
        if (!campaignData) {
          toast.error("Campaign not found.")
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load campaign details.")
        setCampaign(null)
        setLogs([])
      } finally {
        if (showLoadingSpinner) setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [campaignId],
  )

  useEffect(() => {
    loadDetails(true)

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    if (campaignId && (!campaign || (campaign.status !== "COMPLETED" && campaign.status !== "FAILED"))) {
      pollIntervalRef.current = setInterval(() => {
        loadDetails(false)
      }, 5000)
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [campaignId, campaign?.status, loadDetails])

  const handleSendCampaign = async () => {
    if (!campaignId || (campaign && (campaign.status === "SENDING" || campaign.status === "COMPLETED"))) {
      toast.info(`Campaign is already ${campaign?.status?.toLowerCase() || "in a non-sendable state"}.`)
      return
    }
    setIsSending(true)
    try {
      toast.info("Attempting to start campaign delivery...")
      const res = await fetch(`/api/campaigns/${campaignId}/deliver`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Failed to trigger delivery")
      }
      toast.success(data.message || "Campaign delivery process initiated!")
      await loadDetails(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger delivery")
    } finally {
      setIsSending(false)
    }
  }

  // Filter logs based on search query and status filter
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(log.customerId).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading && !campaign) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading campaign details...</p>
        </div>
      </div>
    )
  }

  if (!campaign && !isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="max-w-md mx-auto text-center bg-muted/30 p-8 rounded-lg border border-dashed">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Campaign Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The campaign you&apos;re looking for doesn&apos;t exist or an error occurred.
          </p>
          <Button onClick={() => router.push("/campaigns")} variant="default">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
          </Button>
        </div>
      </div>
    )
  }

  // Type assertion for badge variant
  const getStatusBadgeVariant = (status: ICampaign["status"]): (typeof badgeVariants)["arguments"]["variant"] => {
    switch (status) {
      case "COMPLETED":
        return "success"
      case "SENDING":
        return "default"
      case "DRAFT":
        return "secondary"
      case "FAILED":
        return "destructive"
      case "SCHEDULED":
        return "outline"
      default:
        return "secondary"
    }
  }

  // Calculate progress percentage
  const progressPercentage = campaign ? Math.round(((campaign.sentCount || 0) / (campaign.audienceSize || 1)) * 100) : 0

  // Get status icon
  const getStatusIcon = (status: ICampaign["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "SENDING":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case "DRAFT":
        return <Clock className="h-5 w-5 text-gray-500" />
      case "FAILED":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "SCHEDULED":
        return <Clock className="h-5 w-5 text-orange-500" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {campaign && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Button onClick={() => router.push("/campaigns")} variant="outline" size="sm" className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold">{campaign.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusBadgeVariant(campaign.status)} className="text-xs">
                  <span className="flex items-center gap-1">
                    {getStatusIcon(campaign.status)}
                    {campaign.status}
                  </span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                onClick={handleSendCampaign}
                disabled={
                  isSending ||
                  campaign.status === "SENDING" ||
                  campaign.status === "COMPLETED" ||
                  campaign.status === "FAILED"
                }
                className="flex-1 md:flex-none"
              >
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendIcon className="mr-2 h-4 w-4" />}
                {campaign.status === "SENDING"
                  ? "Processing..."
                  : campaign.status === "COMPLETED"
                    ? "Completed"
                    : campaign.status === "FAILED"
                      ? "Failed - Retry?"
                      : "Send Campaign"}
              </Button>
              <Button
                onClick={() => loadDetails(false)}
                variant="outline"
                size="icon"
                title="Refresh Data"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Campaign Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Audience Size</h3>
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-bold">{campaign.audienceSize?.toString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total targeted customers</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Messages Sent</h3>
                  <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-3xl font-bold">{typeof campaign.sentCount === "number" ? campaign.sentCount.toString() : "0"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(((campaign.sentCount || 0) / (campaign.audienceSize || 1)) * 100).toFixed(1)}% of audience
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Failed Deliveries</h3>
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-3xl font-bold">{typeof campaign.failedCount === "number" ? campaign.failedCount.toString() : "0"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(((campaign.failedCount || 0) / (campaign.audienceSize || 1)) * 100).toFixed(1)}% failure rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {campaign.status === "SENDING" && (
            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Campaign Progress</h3>
                  <span className="text-sm font-medium">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {campaign.sentCount?.toString() || 0} of{typeof campaign.audienceSize === "number" ? campaign.audienceSize.toString() : "0"} messages
                  sent
                </p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Campaign Details</TabsTrigger>
              <TabsTrigger value="logs">Communication Logs</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Campaign Information</CardTitle>
                  <CardDescription>Details about this campaign&apos;s configuration and targeting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Message Template</h3>
                    <div className="bg-muted/30 p-4 rounded-md border whitespace-pre-wrap text-sm">
                      {campaign.messageTemplate}
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="audience-rules">
                      <AccordionTrigger className="text-sm font-semibold">Audience Rules</AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-muted/30 p-4 rounded-md border overflow-x-auto">
                          <pre className="text-xs">{JSON.stringify(campaign.audienceRules, null, 2)}</pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <CampaignTags campaignId={campaignId} initialTags={campaign?.tags} />
            </TabsContent>

            <TabsContent value="logs" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Communication Logs</CardTitle>
                  <CardDescription>
                    Detailed logs of all messages sent in this campaign ({logs.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 mb-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by customer ID or message content..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Statuses</SelectItem>
                          <SelectItem value="SENT">Sent</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 rounded-md border border-dashed">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No communication logs found matching your criteria</p>
                      {logs.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("")
                            setStatusFilter("ALL")
                          }}
                          className="mt-4"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                      {filteredLogs.map((log) => (
                        <Card key={log._id as string} className="border shadow-sm overflow-hidden">
                          <CardHeader className="py-3 px-4 bg-muted/20 flex flex-row items-center justify-between">
                            <div>
                              <span className="text-xs font-medium">Customer ID: </span>
                              <span className="text-xs text-muted-foreground">{String(log.customerId)}</span>
                            </div>
                            <Badge
                              variant={
                                log.status === "SENT" || log.status === "DELIVERED"
                                  ? "default"
                                  : log.status === "FAILED"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="ml-auto"
                            >
                              {log.status}
                            </Badge>
                          </CardHeader>
                          <CardContent className="py-3 px-4">
                            <p className="text-sm whitespace-pre-wrap break-words">{log.message}</p>
                          </CardContent>
                          <CardFooter className="py-2 px-4 bg-muted/10 text-xs text-muted-foreground">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {log.sentAt && <span>Sent: {format(new Date(log.sentAt), "MMM d, yyyy h:mm a")}</span>}
                              {log.failedAt && (
                                <span className="text-destructive">
                                  Failed: {format(new Date(log.failedAt), "MMM d, yyyy h:mm a")}
                                  {log.failureReason && ` - ${log.failureReason}`}
                                </span>
                              )}
                              {!log.sentAt && !log.failedAt && log.createdAt && (
                                <span>Created: {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}</span>
                              )}
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-0">
              <CampaignSummary campaignId={campaignId} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
