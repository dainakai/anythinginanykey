import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define context type with Promise for params
interface RouteContext {
  params: Promise<{ phraseId: string }>; // Params is now a Promise
}

// Update the public status of a phrase
export async function PATCH(
    request: NextRequest, // Use NextRequest
    context: RouteContext // Use context object
) {
  const { params } = context; // Access params Promise from context
  const { phraseId } = await params; // Await params to get the actual value

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!phraseId) {
    return NextResponse.json({ error: 'Phrase ID is required' }, { status: 400 });
  }

  let isPublic: boolean;
  try {
    const body = await request.json();
    if (typeof body.isPublic !== 'boolean') {
      return NextResponse.json({ error: 'Invalid value for isPublic. Must be boolean.' }, { status: 400 });
    }
    isPublic = body.isPublic;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    console.error('Invalid request body for publish:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    // Verify the phrase exists and belongs to the user
    const phrase = await prisma.phrase.findUnique({
      where: {
        id: phraseId,
      },
      select: { // Only select necessary fields
        userId: true,
      },
    });

    if (!phrase) {
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }

    if (phrase.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the phrase's public status
    const updatedPhrase = await prisma.phrase.update({
      where: {
        id: phraseId,
        // Optional: Add userId here as well for extra security,
        // although we already checked ownership above.
        // userId: userId
      },
      data: {
        isPublic: isPublic,
      },
    });

    return NextResponse.json(updatedPhrase);
  } catch (error) {
    console.error('Error updating publish status:', error);
    // Rename error to _error if unused
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors if needed
    }
    // console.error('Error updating publish status:', _error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
