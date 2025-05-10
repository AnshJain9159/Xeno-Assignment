// app/api/webhooks/delivery-receipts/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; 
import CommunicationLogModel from "@/models/communicationLog"; 
import CampaignModel from "@/models/campaign"; 
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  console.log("Delivery Receipt Webhook: Received request");
  try {
    await dbConnect();
    const body = await req.json();
    console.log("Delivery Receipt Webhook: Parsed body:", body);

    const { communicationLogId, status, vendorMessageId, timestamp, failureReason } = body;

    if (!communicationLogId || !status || !vendorMessageId || !timestamp) {
      console.log("Delivery Receipt Webhook: Missing required fields");
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(communicationLogId)) {
        console.log("Delivery Receipt Webhook: Invalid communicationLogId format");
        return NextResponse.json({ message: "Invalid communicationLogId format" }, { status: 400 });
    }

    // Update the CommunicationLog
    const log = await CommunicationLogModel.findById(communicationLogId);
    if (!log) {
      console.log(`Delivery Receipt Webhook: Log not found for ID ${communicationLogId}`);
      return NextResponse.json({ message: "Log not found" }, { status: 404 });
    }

    console.log(`Delivery Receipt Webhook: Updating log ${communicationLogId} to status ${status}`);
    log.status = status;
    log.vendorMessageId = vendorMessageId;

    const parsedTimestamp = new Date(timestamp); // Ensure timestamp is a Date object

    if (status === "SENT" || status === "DELIVERED") { // Assuming DELIVERED is also a success status from vendor
      log.sentAt = parsedTimestamp;
      log.failedAt = undefined;
      log.failureReason = undefined;
    } else if (status === "FAILED") {
      log.failedAt = parsedTimestamp;
      log.failureReason = failureReason || "Unknown failure from vendor";
      log.sentAt = undefined;
    } else {
        console.warn(`Delivery Receipt Webhook: Received unhandled status "${status}" for log ${communicationLogId}`);
    }
    await log.save();

    if (log.campaignId && (status === "SENT" || status === "DELIVERED" || status === "FAILED")) {
        const update = (status === "SENT" || status === "DELIVERED")
        ? { $inc: { sentCount: 1 } }
        : { $inc: { failedCount: 1 } };
        
        console.log(`Delivery Receipt Webhook: Updating campaign ${log.campaignId} counts.`);
        await CampaignModel.updateOne({ _id: log.campaignId }, update);

        // Optionally: Check if all logs are processed, and mark campaign as COMPLETED
        const campaign = await CampaignModel.findById(log.campaignId);
        if (campaign && campaign.audienceSize > 0) { // Only check if audienceSize is known and positive
            const totalLogsForCampaign = await CommunicationLogModel.countDocuments({ campaignId: log.campaignId });
            // Ensure we are comparing against the campaign's audience size for completion,
            // or total logs if audience size might change or not be perfectly in sync.
            // For robustness, using total logs that *should* have been created.
            if (campaign.audienceSize === (campaign.sentCount + campaign.failedCount)) {
                if (campaign.status !== "COMPLETED") {
                    console.log(`Delivery Receipt Webhook: Marking campaign ${log.campaignId} as COMPLETED.`);
                    await CampaignModel.updateOne({ _id: log.campaignId }, { status: "COMPLETED" });
                }
            }
        }
    } else {
        console.warn(`Delivery Receipt Webhook: Log ${communicationLogId} is missing campaignId or status is not SENT/FAILED/DELIVERED. Counts not updated.`);
    }
    

    return NextResponse.json({ message: "Log updated successfully via webhook" }, { status: 200 });
  } catch (error: any) {
    console.error("Delivery Receipt Webhook: Internal error:", error.message, error.stack);
    return NextResponse.json({ message: "Internal server error in webhook", error: error.message }, { status: 500 });
  }
}
