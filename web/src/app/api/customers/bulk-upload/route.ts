// app/api/customers/bulk-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CustomerModel from '@/models/customer';
import { z } from 'zod';
import Papa from 'papaparse'; // CSV parsing library
import { auth } from '@/auth';

// Zod schema for a single customer row from CSV (make it flexible)
// Ensure headers in CSV match these keys or map them.
const csvCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  totalSpends: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, "Total spends cannot be negative").optional()
  ),
  visitCount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(0, "Visit count cannot be negative").optional()
  ),
  lastActiveDate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : String(val)),
    z.string().datetime({ offset: true, message: "Invalid date format for Last Active Date. Use ISO 8601." }).optional()
         .transform((val) => val ? new Date(val) : undefined)
  ),
});

interface BulkUploadResult {
  successfulUploads: number;
  failedUploads: number;
  errors: { row: number; email?: string; message: string; details?: any }[];
  createdCustomers: any[]; // Or a more specific type
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    // TODO: Add authentication and authorization checks
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
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
      createdCustomers: [],
    };

    // Parse CSV content
    // `header: true` assumes the first row of CSV contains headers matching csvCustomerSchema keys
    const parseOutput = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    
    if (parseOutput.errors.length > 0) {
        result.errors.push({row: -1, message: "CSV parsing error", details: parseOutput.errors});
        return NextResponse.json(result, { status: 400 });
    }

    const rows = parseOutput.data as any[]; // Type assertion, be careful

    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i];
      const rowIndex = i + 2; // CSV row number (1-based, +1 for header)

      const validation = csvCustomerSchema.safeParse(rowData);

      if (!validation.success) {
        result.failedUploads++;
        result.errors.push({
          row: rowIndex,
          email: rowData.email || 'N/A',
          message: "Validation failed for row.",
          details: validation.error.flatten().fieldErrors,
        });
        continue;
      }

      const { name, email, totalSpends, visitCount, lastActiveDate } = validation.data;

      try {
        // Check for existing customer by email to avoid duplicates
        // Behavior for duplicates: update or skip. Here we skip and report.
        const existingCustomer = await CustomerModel.findOne({ email });
        if (existingCustomer) {
          result.failedUploads++;
          result.errors.push({
            row: rowIndex,
            email: email,
            message: `Customer with email ${email} already exists. Skipped.`,
          });
          continue;
        }

        const newCustomer = new CustomerModel({
          name,
          email,
          totalSpends: totalSpends ?? 0,
          visitCount: visitCount ?? 0,
          lastActiveDate: lastActiveDate,
        });
        const savedCustomer = await newCustomer.save();
        result.successfulUploads++;
        result.createdCustomers.push({ name: savedCustomer.name, email: savedCustomer.email }); // Push minimal info
      } catch (dbError: any) {
        result.failedUploads++;
        let errorMessage = "Database error.";
        if (dbError.code === 11000) { // Duplicate key error from DB (should be caught by findOne above ideally)
          errorMessage = `Customer with email ${email} already exists (DB constraint). Skipped.`;
        } else if (dbError.message) {
            errorMessage = dbError.message;
        }
        result.errors.push({
          row: rowIndex,
          email: email,
          message: errorMessage,
          details: dbError.toString(),
        });
      }
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Error in bulk customer upload API:", error);
    return NextResponse.json({ message: "Failed to process bulk upload", error: error.message }, { status: 500 });
  }
}
