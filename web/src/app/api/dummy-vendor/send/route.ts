/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

function randomStatus() {
  return Math.random() < 0.9 ? "SENT" : "FAILED";
}

export async function POST(req: NextRequest) {
  
  try {
    const { customerId, message, communicationLogId, callbackUrl } = await req.json();

    if (!customerId || !message || !communicationLogId || !callbackUrl) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Simulate delay (1-2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

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
      payload.failureReason = "Simulated delivery failure";
    }

    // POST to callbackUrl
    await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ message: "Message sent to vendor", status }, { status: 200 });
  } catch (error) {
    console.error("Dummy vendor error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}