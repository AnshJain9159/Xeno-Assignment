import { NextResponse } from 'next/server';
import '@/lib/db'; // Ensures Mongoose connection is established
import AudienceSegmentModel from '@/models/audienceSegment';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: { segmentId: string } }
) {
  const { segmentId } = await params;

  if (!segmentId || !mongoose.Types.ObjectId.isValid(segmentId)) {
    return NextResponse.json({ message: 'Invalid segment ID provided.' }, { status: 400 });
  }

  try {
    const audienceSegment = await AudienceSegmentModel.findById(segmentId).lean();

    if (!audienceSegment) {
      return NextResponse.json({ message: 'Audience segment not found.' }, { status: 404 });
    }

    // The frontend expects the data under an 'audienceSegment' key
    return NextResponse.json({ audienceSegment }, { status: 200 });
  } catch (error) {
    console.error('Error fetching audience segment by ID:', error);
    let errorMessage = 'Internal server error while fetching audience segment.';
    // It's good practice to not expose raw error messages to the client in production
    // For development, you might want more details, but for now, a generic message is safer.
    // if (error instanceof Error) {
    //     errorMessage = error.message;
    // }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 