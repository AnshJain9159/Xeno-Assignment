// app/api/campaigns/[campaignId]/deliver/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; 
import CampaignModel, { ICampaign } from '@/models/campaign'; 
import CustomerModel, { ICustomer } from '@/models/customer'; 
import CommunicationLogModel from '@/models/communicationLog'; 
import mongoose from 'mongoose'; 
import buildMongoQuery from '@/lib/queryBuilder'; 
import { auth } from "@/auth"; 

// Helper function to personalize message
function personalizeMessage(template: string, customer: ICustomer): string {
    return template
        .replace(/{{name}}/gi, customer.name)
        .replace(/{{email}}/gi, customer.email)
        .replace(/{{totalSpends}}/gi, String(customer.totalSpends ?? 0)) // Handle potential undefined
        .replace(/{{visitCount}}/gi, String(customer.visitCount ?? 0)); // Handle potential undefined
}

const DUMMY_VENDOR_API_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/dummy-vendor/send`;
const DELIVERY_RECEIPT_CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/delivery-receipts`;

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { campaignId } = params;
  console.log(`[Deliver API] Received request for campaignId: ${campaignId}`);

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json({ message: "Server configuration error: App URL not set." }, { status: 500 });
  }
  console.log(`[Deliver API] DUMMY_VENDOR_API_URL: ${DUMMY_VENDOR_API_URL}`);
  console.log(`[Deliver API] DELIVERY_RECEIPT_CALLBACK_URL: ${DELIVERY_RECEIPT_CALLBACK_URL}`);


  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    console.log("[Deliver API] Invalid Campaign ID format");
    return NextResponse.json({ message: "Invalid Campaign ID format" }, { status: 400 });
  }

  try {
    console.log("[Deliver API] Connecting to database...");
    await dbConnect();
    console.log("[Deliver API] Database connected.");

    // console.log("[Deliver API] Checking authentication...");
    const session = await auth();

    if (!session || !session.user) { 
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.log("[Deliver API] User authenticated:", session.user.email);

    console.log(`[Deliver API] Fetching campaign ${campaignId}...`);
    const campaign = await CampaignModel.findById(campaignId);

    if (!campaign) {
      console.log(`[Deliver API] Campaign ${campaignId} not found.`);
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }
    console.log(`[Deliver API] Found campaign: ${campaign.name}, Status: ${campaign.status}`);

    if (campaign.status === 'SENDING' || campaign.status === 'COMPLETED') {
      console.log(`[Deliver API] Campaign ${campaignId} is already ${campaign.status.toLowerCase()}.`);
      return NextResponse.json(
        { message: `Campaign is already ${campaign.status.toLowerCase()} or has been completed.` },
        { status: 409 }
      );
    }

    console.log(`[Deliver API] Updating campaign ${campaignId} status to SENDING.`);
    campaign.status = 'SENDING';
    campaign.sentCount = 0;
    campaign.failedCount = 0;
    campaign.audienceSize = 0; 
    await campaign.save();
    console.log(`[Deliver API] Campaign ${campaignId} status updated.`);

    console.log(`[Deliver API] Building MongoDB query for campaign ${campaignId} rules...`);
    let mongoQuery;
    try {
        mongoQuery = buildMongoQuery(campaign.audienceRules);
    } catch (queryBuilderError: any) {
        console.error(`[Deliver API] Error in buildMongoQuery for campaign ${campaignId}:`, queryBuilderError.message);
        campaign.status = 'FAILED'; 
        campaign.failureReason = "Error processing audience rules."; 
        await campaign.save();
        return NextResponse.json({ message: "Error processing audience rules.", error: queryBuilderError.message }, { status: 500 });
    }
    console.log(`[Deliver API] MongoDB query for campaign ${campaignId}:`, JSON.stringify(mongoQuery));

    let customersInSegment: ICustomer[] = [];
    if (Object.keys(mongoQuery).length > 0) {
        console.log(`[Deliver API] Fetching customers for campaign ${campaignId} with specific rules...`);
        customersInSegment = await CustomerModel.find(mongoQuery).lean();
    } else if (campaign.audienceRules && campaign.audienceRules.conditions.length === 0 && (!campaign.audienceRules.groups || campaign.audienceRules.groups.length === 0)) {
        console.log(`[Deliver API] No specific rules for campaign ${campaignId}, fetching all customers...`);
        customersInSegment = await CustomerModel.find({}).lean();
    } else {
        console.log(`[Deliver API] Query is empty but rules are present for campaign ${campaignId}, likely means no customers match or rules are invalid. Treating as empty segment.`);
        // This case might indicate an issue with rule interpretation or data.
    }
    console.log(`[Deliver API] Found ${customersInSegment.length} customers in segment for campaign ${campaignId}.`);

    if (customersInSegment.length === 0) {
      console.log(`[Deliver API] No customers in segment for campaign ${campaignId}. Marking as COMPLETED.`);
      campaign.status = 'COMPLETED';
      campaign.audienceSize = 0;
      await campaign.save();
      return NextResponse.json({ message: "No customers found in the audience. Campaign marked as completed.", campaign }, { status: 200 });
    }
    
    campaign.audienceSize = customersInSegment.length;
    await campaign.save();
    console.log(`[Deliver API] Campaign ${campaignId} audience size updated to ${campaign.audienceSize}.`);

    let successfullyInitiatedSends = 0;
    console.log(`[Deliver API] Starting to process ${customersInSegment.length} customers for campaign ${campaignId}...`);

    for (const customer of customersInSegment) {
      console.log(`[Deliver API] Processing customer ${customer._id} for campaign ${campaignId}.`);
      const personalizedMessageContent = personalizeMessage(campaign.messageTemplate, customer);

      let logEntry;
      try {
        logEntry = await CommunicationLogModel.findOneAndUpdate(
          { campaignId: campaign._id, customerId: customer._id },
          {
            $set: {
              message: personalizedMessageContent,
              status: 'PENDING',
              sentAt: undefined,
              failedAt: undefined,
              failureReason: undefined,
              deliveredAt: undefined,
              vendorMessageId: undefined,
              // Ensure campaign.createdBy is valid if used here.
              // If campaign.createdBy is an ObjectId, it's fine. If it's a populated object, you need campaign.createdBy._id
              createdBy: campaign.createdBy ? (campaign.createdBy as any)._id || campaign.createdBy : undefined,
            },
            $setOnInsert: {
              campaignId: campaign._id,
              customerId: customer._id,
              createdAt: new Date(),
            }
          },
          { upsert: true, new: true, runValidators: true }
        );
        console.log(`[Deliver API] CommunicationLog upserted for customer ${customer._id}, log ID ${logEntry._id}.`);
      } catch (logError: any) {
        console.error(`[Deliver API] Error upserting CommunicationLog for customer ${customer._id}, campaign ${campaignId}:`, logError.message, logError.stack);
        // Decide if you want to skip this customer or halt the campaign
        continue; // Skip to next customer
      }


      const vendorPayload = {
        customerId: customer._id?.toString(), 
        customerEmail: customer.email,
        message: personalizedMessageContent,
        communicationLogId: logEntry._id?.toString(), 
        callbackUrl: DELIVERY_RECEIPT_CALLBACK_URL,
      };

      console.log(`[Deliver API] Preparing to call dummy vendor for log ${logEntry._id}. Payload:`, JSON.stringify(vendorPayload));

      // Fire-and-forget fetch
      fetch(DUMMY_VENDOR_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorPayload),
      })
      .then(async vendorResponse => {
          console.log(`[Deliver API] Vendor API call for log ${logEntry._id} completed with status: ${vendorResponse.status}`);
          if (!vendorResponse.ok) {
              const errorData = await vendorResponse.json().catch(() => ({message: "Unknown vendor error, non-JSON response"}));
              console.error(`[Deliver API] Dummy vendor API call FAILED for log ${logEntry._id}. Status: ${vendorResponse.status}. Error:`, errorData.message);
              logEntry.status = 'FAILED';
              logEntry.failureReason = `Vendor API error: ${vendorResponse.status} - ${errorData.message || 'Failed to dispatch'}`;
              logEntry.failedAt = new Date();
              await logEntry.save();
              await CampaignModel.updateOne({ _id: campaign._id }, { $inc: { failedCount: 1 } });
          } else {
              const successData = await vendorResponse.json().catch(() => ({message: "Vendor success, non-JSON response"}));
              console.log(`[Deliver API] Message for log ${logEntry._id} dispatched to vendor successfully. Vendor response:`, successData.message);
          }
      })
      .catch(fetchError => {
          console.error(`[Deliver API] Network error calling dummy vendor API for log ${logEntry._id}:`, fetchError.message, fetchError.stack);
          logEntry.status = 'FAILED';
          logEntry.failureReason = `Network error: ${fetchError.message}`;
          logEntry.failedAt = new Date();
          // Use a block for .then() to ensure proper async handling if needed
          logEntry.save().then(() => {
               CampaignModel.updateOne({ _id: campaign._id }, { $inc: { failedCount: 1 } }).catch(dbError => console.error(`[Deliver API] DB Error updating failedCount for campaign ${campaign._id} after fetch error:`, dbError));
          }).catch(saveError => console.error(`[Deliver API] DB Error saving log ${logEntry._id} after fetch error:`, saveError));
      });
      
      successfullyInitiatedSends++;
    }

    console.log(`[Deliver API] Finished processing customers for campaign ${campaignId}. Initiated sends: ${successfullyInitiatedSends}.`);
    return NextResponse.json(
      {
        message: `Campaign delivery process initiated for ${successfullyInitiatedSends} of ${customersInSegment.length} customers. Check logs for status.`,
        campaignId: campaign.id.toString(),
        initiatedSends: successfullyInitiatedSends,
        audienceSize: customersInSegment.length,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`[Deliver API] CRITICAL ERROR triggering campaign delivery for ${campaignId}:`, error.message, error.stack);
    const campaignToRevert = await CampaignModel.findById(campaignId);
    if (campaignToRevert && campaignToRevert.status === 'SENDING') {
        console.log(`[Deliver API] Reverting campaign ${campaignId} status to FAILED due to critical error.`);
        campaignToRevert.status = 'FAILED';
        campaignToRevert.failureReason = "Critical error during delivery initiation."; // Add if field exists
        await campaignToRevert.save();
    }
    return NextResponse.json({ message: "Failed to trigger campaign delivery", error: error.message }, { status: 500 });
  }
}
