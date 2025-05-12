/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import type { IAudienceSegment } from "@/models/audienceSegment"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, PlusCircle, Eye, Search, Filter, ArrowUpDown, BarChart2, Calendar, Info } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function ListAudiencesPage() {
  const [audienceSegments, setAudienceSegments] = useState<IAudienceSegment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSegmentRules, setSelectedSegmentRules] = useState<object | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
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
    const fetchAudienceSegments = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/audiences")
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch audience segments")
        }
        setAudienceSegments(data.audienceSegments || [])
      } catch (error: any) {
        console.error("Fetch audience segments error:", error)
        toast(error.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAudienceSegments()
  }, [])

  // Filter and sort segments
  const filteredSegments = audienceSegments
    .filter((segment) => segment.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name)
      }
      return 0
    })

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading saved audience segments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Users className="mr-2 h-8 w-8 text-primary" /> Audience Segments
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage reusable audience segments for your campaigns</p>
        </div>
        <Link href="/audiences/create">
          <Button className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Segment
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Total Segments</h3>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{audienceSegments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Reusable audience definitions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Latest Segment</h3>
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xl font-bold truncate">
              {audienceSegments.length > 0
                ? audienceSegments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                    .name
                : "No segments yet"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {audienceSegments.length > 0
                ? `Created ${format(
                    new Date(
                      audienceSegments.sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                      )[0].createdAt,
                    ),
                    "MMM d, yyyy",
                  )}`
                : "Create your first segment"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Campaign Ready</h3>
              <BarChart2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-3xl font-bold">{audienceSegments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Segments available for campaigns</p>
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
              placeholder="Search segments..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog>
          <TabsContent value="table" className="mt-0">
            {filteredSegments.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-xl font-medium text-muted-foreground">No audience segments found</p>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "Create reusable audience definitions to streamline campaign creation"}
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/audiences/create">Create Your First Segment</Link>
                  </Button>
                )}
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
                      <TableHead>Description</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Created <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSegments.map((segment) => (
                      <TableRow key={segment._id as string} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{segment.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{segment.description || "No description"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(segment.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSegmentRules(segment.rules)}
                              className="h-8"
                            >
                              <Eye className="mr-1 h-4 w-4" /> View Rules
                            </Button>
                          </DialogTrigger>
                          <Button variant="outline" size="sm" asChild className="h-8">
                            <Link href={`/campaigns/create?segmentId=${segment._id}`}>
                              <PlusCircle className="mr-1 h-4 w-4" /> Use in Campaign
                            </Link>
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
            {filteredSegments.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-xl font-medium text-muted-foreground">No audience segments found</p>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "Create reusable audience definitions to streamline campaign creation"}
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/audiences/create">Create Your First Segment</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSegments.map((segment) => (
                  <Card key={segment._id as string} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 bg-muted/20">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{segment.name}</CardTitle>
                        <Badge variant="outline" className="ml-auto">
                          Segment
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(segment.createdAt), "MMM d, yyyy")}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {segment.description || "No description provided"}
                      </p>
                      <div className="flex flex-col space-y-2">
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSegmentRules(segment.rules)}
                            className="w-full"
                          >
                            <Eye className="mr-1 h-4 w-4" /> View Rules
                          </Button>
                        </DialogTrigger>
                        <Button variant="default" size="sm" asChild className="w-full">
                          <Link href={`/campaigns/create?segmentId=${segment._id}`}>
                            <PlusCircle className="mr-1 h-4 w-4" /> Use in Campaign
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" /> Audience Segment Rules
              </DialogTitle>
              <DialogDescription>
                The JSON representation of the rules for this segment. These rules define which customers will be
                included in this audience.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {selectedSegmentRules ? (
                <div className="bg-muted/30 p-4 rounded-md border overflow-x-auto">
                  <pre className="text-sm">{JSON.stringify(selectedSegmentRules, null, 2)}</pre>
                </div>
              ) : (
                <p>No rules to display.</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">What do these rules mean?</h3>
              <p className="text-sm text-muted-foreground">
                These rules determine which customers will be included in your audience segment. The rules use logical
                operators (AND/OR) to combine conditions based on customer attributes like spending, activity, and
                demographics.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  )
}
