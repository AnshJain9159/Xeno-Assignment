// app/api/dummy-vendor/send/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

function randomStatus(): 'SENT' | 'FAILED' {
  return Math.random() < 0.9 ? "SENT" : "FAILED";
}

export async function POST(req: NextRequest) {
  console.log("Dummy Vendor API: Received request");
  try {
    const { customerId, message, communicationLogId, callbackUrl, customerEmail } = await req.json();

    if (!customerId || !message || !communicationLogId || !callbackUrl) {
      console.log("Dummy Vendor API: Missing required fields", { customerId, message, communicationLogId, callbackUrl });
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    console.log(`Dummy Vendor API: Processing message for log ${communicationLogId}, customer ${customerId}, email: ${customerEmail}`);

    // Simulate delay (1-2 seconds)
    const delay = 1000 + Math.random() * 1000;
    console.log(`Dummy Vendor API: Simulating delay of ${delay.toFixed(0)}ms for log ${communicationLogId}`);
    await new Promise((resolve) => setTimeout(resolve, delay));

    const status = randomStatus();
    const vendorMessageId = `vendor_${communicationLogId}_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const payload: any = {
      communicationLogId,
      status,
      vendorMessageId,
      timestamp,
    };

    if (status === "FAILED") {
      payload.failureReason = "Simulated delivery failure by vendor";
    }

    console.log(`Dummy Vendor API: Sending callback to ${callbackUrl} for log ${communicationLogId} with status ${status}`);
    
    try {
        const callbackResponse = await fetch(callbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!callbackResponse.ok) {
            const errorBody = await callbackResponse.text();
            console.error(`Dummy Vendor API: Callback to ${callbackUrl} failed for log ${communicationLogId}. Status: ${callbackResponse.status}. Body: ${errorBody}`);
        } else {
            console.log(`Dummy Vendor API: Callback successful for log ${communicationLogId}.`);
        }
    } catch (callbackError: any) {
        console.error(`Dummy Vendor API: Error sending callback to ${callbackUrl} for log ${communicationLogId}: ${callbackError.message}`);
    }
    

    return NextResponse.json({ message: "Message processing simulated by vendor", status, vendorMessageId }, { status: 200 });
  } catch (error: any) {
    console.error("Dummy Vendor API: Internal error:", error.message);
    return NextResponse.json({ message: "Internal server error in dummy vendor", error: error.message }, { status: 500 });
  }
}
