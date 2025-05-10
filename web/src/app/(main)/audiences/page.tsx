/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(main)/audiences/page.tsx
"use client";

import { useEffect, useState } from "react";
import { IAudienceSegment } from "@/models/audienceSegment"; // Adjust path
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle, Settings2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from 'date-fns'; // For date formatting

export default function ListAudiencesPage() {
  const [audienceSegments, setAudienceSegments] = useState<IAudienceSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSegmentRules, setSelectedSegmentRules] = useState<object | null>(null);

  useEffect(() => {
    const fetchAudienceSegments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/audiences"); // API route created above
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch audience segments");
        }
        setAudienceSegments(data.audienceSegments || []);
      } catch (error: any) {
        console.error("Fetch audience segments error:", error);
        toast(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudienceSegments();
  }, []);

  if (isLoading) {
    return <div className="container mx-auto p-8 text-center">Loading saved audience segments...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Users className="mr-3 h-8 w-8" /> Saved Audience Segments
        </h1>
        <Link href="/audiences/create"> 
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Segment/Campaign
          </Button>
        </Link>
      </div>

      <Dialog>
        {audienceSegments.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-xl text-gray-600">No saved audience segments found.</p>
            <p className="text-gray-500">Create reusable audience definitions to streamline campaign creation.</p>
          </div>
        ) : (
          <Table>
            <TableCaption>A list of your saved audience segments.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audienceSegments.map((segment) => (
                <TableRow key={segment._id as string}>
                  <TableCell className="font-medium">{segment.name}</TableCell>
                  <TableCell>{segment.description || "N/A"}</TableCell>
                  <TableCell>{format(new Date(segment.createdAt), "PPpp")}</TableCell>
                  <TableCell className="text-right">
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedSegmentRules(segment.rules)}
                        className="mr-2"
                      >
                        <Eye className="mr-1 h-4 w-4" /> View Rules
                      </Button>
                    </DialogTrigger>
                    {/* Add Edit/Delete buttons here if needed */}
                    {/* <Button variant="ghost" size="sm"><Settings2 className="mr-1 h-4 w-4" /> Edit</Button> */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
            <DialogTitle>Audience Segment Rules</DialogTitle>
            <DialogDescription>
                The JSON representation of the rules for this segment.
            </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
            {selectedSegmentRules ? (
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                {JSON.stringify(selectedSegmentRules, null, 2)}
                </pre>
            ) : (
                <p>No rules to display.</p>
            )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
