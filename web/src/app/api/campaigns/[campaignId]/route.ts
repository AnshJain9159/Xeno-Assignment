// app/api/campaigns/[campaignId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; 
import CampaignModel from '@/models/campaign'; 
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { campaignId } = await params;

  if (!campaignId || !mongoose.Types.ObjectId.isValid(campaignId)) {
    return NextResponse.json({ message: 'Invalid Campaign ID format' }, { status: 400 });
  }

  try {
    await dbConnect();
    console.log(`Fetching campaign with ID: ${campaignId}`); // Server-side log

    const campaign = await CampaignModel.findById(campaignId)
    .populate('createdBy', 'name email'); // Uncomment if you have a createdBy field and want to populate it

    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign }, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching campaign ${campaignId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch campaign', error: error.message }, { status: 500 });
  }
}
