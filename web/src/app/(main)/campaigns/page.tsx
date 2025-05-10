/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(main)/campaigns/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ICampaign } from "@/models/campaign"; // Adjust path
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListChecks } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns'; // For date formatting

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/campaigns");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch campaigns");
        }
        setCampaigns(data.campaigns || []);
      } catch (error: any) {
        console.error("Fetch campaigns error:", error);
        toast(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const getStatusBadgeVariant = (status: ICampaign['status']) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'SENDING': return 'default';
      case 'DRAFT': return 'secondary';
      case 'FAILED': return 'destructive';
      case 'SCHEDULED': return 'outline';
      default: return 'secondary';
    }
  };


  if (isLoading) {
    return <div className="container mx-auto p-8 text-center">Loading campaigns...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <ListChecks className="mr-2 h-8 w-8" /> Campaign History
        </h1>
        <Link href="/campaigns/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-xl text-gray-600">No campaigns found.</p>
          <p className="text-gray-500">Start by creating a new campaign!</p>
        </div>
      ) : (
        <Table className="w-full ">
          <TableCaption>A list of your recent campaigns.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Audience</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Failed</TableHead>
              <TableHead>Created At</TableHead>
              {/* <TableHead>Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign._id as string}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{campaign.audienceSize}</TableCell>
                <TableCell className="text-right">{campaign.sentCount}</TableCell>
                <TableCell className="text-right">{campaign.failedCount}</TableCell>
                <TableCell>{format(new Date(campaign.createdAt), "PPpp")}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/campaigns/${campaign._id}`}>View Details</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
