import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CampaignModel from "@/models/campaign";
import { auth } from "@/auth";
export async function GET(
  request: NextRequest,
  context: { params: { campaignId: string } }
) {
  await dbConnect();

  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { params } = await context;
  const { campaignId } = params;

  try {
    const campaign = await CampaignModel.findById(campaignId).lean();
    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching campaign", error: error.message }, { status: 500 });
  }
}