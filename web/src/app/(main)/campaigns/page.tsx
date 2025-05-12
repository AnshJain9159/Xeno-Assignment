/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useEffect, useState } from "react"
import type { ICampaign } from "@/models/campaign"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, ListChecks, Search, Filter, ArrowUpDown, BarChart2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<ICampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const { data: session, status } = useSession();
    const router = useRouter()
    
      useEffect(() => {
        if (status !== "authenticated") {
          toast.error("You must be signed in to view this page.")
          setTimeout(() => {
              router.push("/sign-in");
          }, 750);
          
        }
      }, [status,router]);
  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/campaigns")
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch campaigns")
        }
        setCampaigns(data.campaigns || [])
      } catch (error: any) {
        console.error("Fetch campaigns error:", error)
        toast(error.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCampaigns()
  }, [])

  const getStatusBadgeVariant = (status: ICampaign["status"]) => {
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

  // Filter campaigns based on search query and status filter
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate campaign statistics
  const campaignStats = {
    total: campaigns.length,
    completed: campaigns.filter((c) => c.status === "COMPLETED").length,
    sending: campaigns.filter((c) => c.status === "SENDING").length,
    draft: campaigns.filter((c) => c.status === "DRAFT").length,
    failed: campaigns.filter((c) => c.status === "FAILED").length,
    totalAudience: campaigns.reduce((sum, c) => sum + (c.audienceSize || 0), 0),
    totalSent: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0),
    totalFailed: campaigns.reduce((sum, c) => sum + (c.failedCount || 0), 0),
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <ListChecks className="mr-2 h-8 w-8 text-primary" /> Campaign History
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track all your customer communication campaigns</p>
        </div>
        <Link href="/campaigns/create">
          <Button className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Campaign
          </Button>
        </Link>
      </div>

      {/* Campaign Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{campaignStats.total}</div>
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaignStats.completed} completed, {campaignStats.draft} drafts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Audience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{campaignStats.totalAudience.toString()}</div>
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{campaignStats.totalSent.toString()}</div>
              <SendIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((campaignStats.totalSent / campaignStats.totalAudience) * 100 || 0).toFixed(1)}% delivery rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{campaignStats.totalFailed.toString()}</div>
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((campaignStats.totalFailed / campaignStats.totalAudience) * 100 || 0).toFixed(1)}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
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
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="SENDING">Sending</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="table" className="mt-0">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <BarChart2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-xl font-medium text-muted-foreground">No campaigns found</p>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("ALL")
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="rounded-md border shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[250px]">
                      <div className="flex items-center gap-1">
                        Name <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Audience</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Created <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign._id as string} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getStatusBadgeVariant(campaign.status) as
                              | "default"
                              | "destructive"
                              | "outline"
                              | "secondary"
                              | "success"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{campaign.audienceSize?.toString() || 0}</TableCell>
                      <TableCell className="text-right">{campaign.sentCount?.toString() || 0}</TableCell>
                      <TableCell className="text-right">{campaign.failedCount?.toString() || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild className="h-8">
                          <Link href={`/campaigns/${campaign._id}`}>View Details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cards" className="mt-0">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <BarChart2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-xl font-medium text-muted-foreground">No campaigns found</p>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("ALL")
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign._id as string} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 bg-muted/20">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <Badge
                        variant={
                          getStatusBadgeVariant(campaign.status) as
                            | "default"
                            | "destructive"
                            | "outline"
                            | "secondary"
                            | "success"
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-muted/20 rounded-md">
                        <p className="text-xs text-muted-foreground">Audience</p>
                        <p className="font-medium">{campaign.audienceSize?.toString() || 0}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded-md">
                        <p className="text-xs text-muted-foreground">Sent</p>
                        <p className="font-medium">{campaign.sentCount?.toString() || 0}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded-md">
                        <p className="text-xs text-muted-foreground">Failed</p>
                        <p className="font-medium">{campaign.failedCount?.toString() || 0}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/campaigns/${campaign._id}`}>View Campaign Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Add missing icon components
function Users(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function SendIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

function AlertCircle(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}
