import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CommunicationLogModel from "@/models/communicationLog";
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
    const logs = await CommunicationLogModel.find({ campaignId }).lean();
    return NextResponse.json({ logs }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching logs", error: error.message }, { status: 500 });
  }
}