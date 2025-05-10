/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CommunicationLogModel from "@/models/communicationLog";
import CampaignModel from "@/models/campaign";
// import { auth } from "@/auth";


export async function POST(req: NextRequest) {
  await dbConnect();
  // const session = await auth();
  // if (!session) {
  //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  // }
  try {
    const { communicationLogId, status, vendorMessageId, timestamp, failureReason } = await req.json();

    if (!communicationLogId || !status || !vendorMessageId || !timestamp) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Update CommunicationLog
    const logUpdate: any = {
      status,
      vendorMessageId,
    };
    if (status === "SENT") {
      logUpdate.sentAt = timestamp;
    } else {
      logUpdate.failedAt = timestamp;
      logUpdate.failureReason = failureReason || "Unknown";
    }

    const log = await CommunicationLogModel.findByIdAndUpdate(
      communicationLogId,
      { $set: logUpdate },
      { new: true }
    );

    if (!log) {
      return NextResponse.json({ message: "CommunicationLog not found" }, { status: 404 });
    }

    // Atomically increment sentCount or failedCount on Campaign
    const campaignUpdate: any = {};
    if (status === "SENT") {
      campaignUpdate.$inc = { sentCount: 1 };
    } else {
      campaignUpdate.$inc = { failedCount: 1 };
    }

    const campaign = await CampaignModel.findByIdAndUpdate(
      log.campaignId,
      campaignUpdate,
      { new: true }
    );

    // Optionally: Check if all logs for this campaign are processed
    if (campaign) {
      const totalLogs = campaign.sentCount + campaign.failedCount;
      if (totalLogs >= campaign.audienceSize) {
        // All processed, update status to COMPLETED
        if (campaign.status !== "COMPLETED") {
          campaign.status = "COMPLETED";
          await campaign.save();
        }
      }
    }

    return NextResponse.json({ message: "Delivery receipt processed" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}