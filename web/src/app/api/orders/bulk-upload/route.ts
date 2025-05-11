/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import OrderModel from '@/models/order';
import CustomerModel from '@/models/customer';
import { z } from 'zod';
import Papa from 'papaparse';
import { auth } from '@/auth';

// Zod schema for a single order row from CSV
const csvOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required").trim(),
  customerEmail: z.string().email("Invalid customer email").trim().toLowerCase(),
  orderAmount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, "Order amount cannot be negative")
  ),
  orderDate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : String(val)),
    z.string().datetime({ offset: true, message: "Invalid date format for Order Date. Use ISO 8601." })
      .transform((val) => val ? new Date(val) : undefined)
  ),
  // Add more fields if needed
});

interface BulkUploadResult {
  successfulUploads: number;
  failedUploads: number;
  errors: { row: number; orderId?: string; message: string; details?: any }[];
  createdOrders: any[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('csvFile') as File | null;

    if (!file) {
      return NextResponse.json({ message: "No CSV file provided." }, { status: 400 });
    }

    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      return NextResponse.json({ message: "Invalid file type. Please upload a CSV file." }, { status: 400 });
    }

    const fileContent = await file.text();

    const result: BulkUploadResult = {
      successfulUploads: 0,
      failedUploads: 0,
      errors: [],
      createdOrders: [],
    };

    // Parse CSV content
    const parseOutput = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

    if (parseOutput.errors.length > 0) {
      result.errors.push({ row: -1, message: "CSV parsing error", details: parseOutput.errors });
      return NextResponse.json(result, { status: 400 });
    }

    const rows = parseOutput.data as any[];

    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i];
      const rowIndex = i + 2; // CSV row number (1-based, +1 for header)

      const validation = csvOrderSchema.safeParse(rowData);

      if (!validation.success) {
        result.failedUploads++;
        result.errors.push({
          row: rowIndex,
          orderId: rowData.orderId || 'N/A',
          message: "Validation failed for row.",
          details: validation.error.flatten().fieldErrors,
        });
        continue;
      }

      const { orderId, customerEmail, orderAmount, orderDate } = validation.data;

      try {
        // Check for existing order by orderId to avoid duplicates
        const existingOrder = await OrderModel.findOne({ orderId });
        if (existingOrder) {
          result.failedUploads++;
          result.errors.push({
            row: rowIndex,
            orderId,
            message: `Order with ID ${orderId} already exists. Skipped.`,
          });
          continue;
        }

        // Find customer by email
        const customer = await CustomerModel.findOne({ email: customerEmail });
        if (!customer) {
          result.failedUploads++;
          result.errors.push({
            row: rowIndex,
            orderId,
            message: `Customer with email ${customerEmail} not found. Skipped.`,
          });
          continue;
        }

        const newOrder = new OrderModel({
          orderId,
          customerId: customer._id,
          orderAmount,
          orderDate,
        });
        const savedOrder = await newOrder.save();
        result.successfulUploads++;
        result.createdOrders.push({
          orderId: savedOrder.orderId,
          customerEmail,
          orderAmount: savedOrder.orderAmount,
          orderDate: savedOrder.orderDate,
        });
      } catch (dbError: any) {
        result.failedUploads++;
        let errorMessage = "Database error.";
        if (dbError.code === 11000) {
          errorMessage = `Order with ID ${orderId} already exists (DB constraint). Skipped.`;
        } else if (dbError.message) {
          errorMessage = dbError.message;
        }
        result.errors.push({
          row: rowIndex,
          orderId,
          message: errorMessage,
          details: dbError.toString(),
        });
      }
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Error in bulk order upload API:", error);
    return NextResponse.json({ message: "Failed to process bulk upload", error: error.message }, { status: 500 });
  }
}