/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/campaigns/[campaignId]/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; 
import CommunicationLogModel from '@/models/communicationLog'; 
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { campaignId } =await params;

  if (!campaignId || !mongoose.Types.ObjectId.isValid(campaignId)) {
    return NextResponse.json({ message: 'Invalid Campaign ID format' }, { status: 400 });
  }

  try {
    await dbConnect();
    console.log(`Fetching logs for campaign ID: ${campaignId}`); 

    const logs = await CommunicationLogModel.find({ campaignId })
      .sort({ createdAt: -1 }) // Show newest logs first
      .populate('customerId', 'name email'); 

    return NextResponse.json({ logs }, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching logs for campaign ${campaignId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch logs', error: error.message }, { status: 500 });
  }
}
