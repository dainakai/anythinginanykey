import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { parseAbcNotation } from '@/lib/abcParser'; // Import the parser

// Get phrase details
export async function GET(
  request: NextRequest,
  { params }: { params: { phraseId: string } }
) {
  const session = await auth();
  const userId = session?.user?.id; // Get user ID if logged in
  const { phraseId } = params;

  if (!phraseId) {
    return NextResponse.json({ error: 'Phrase ID is required' }, { status: 400 });
  }

  try {
    const phrase = await prisma.phrase.findUnique({
      where: {
        id: phraseId,
      },
      include: {
        tags: true,
        user: { // Author info
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        comments: { // Include comments
          orderBy: { createdAt: 'asc' }, // Oldest first
          include: {
            user: { // Comment author info
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        // Include star count (already in model), maybe also if the current user starred it?
        // stars: userId ? { where: { userId: userId }, select: { userId: true } } : false
      },
    });

    if (!phrase) {
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }

    // If phrase is not public, only the owner can view it
    if (!phrase.isPublic && phrase.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Add a field to indicate if the current logged-in user has starred this phrase
    let userHasStarred = false;
    if (userId) {
        const star = await prisma.star.findUnique({
            where: {
                userId_phraseId: {
                    userId: userId,
                    phraseId: phraseId
                }
            },
            select: { userId: true } // Only need to know if it exists
        });
        userHasStarred = !!star;
    }

    // Return the phrase details along with the star status for the current user
    return NextResponse.json({ ...phrase, userHasStarred });

  } catch (error) {
    console.error('Error fetching phrase details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update phrase details
export async function PUT(
  request: NextRequest,
  { params }: { params: { phraseId: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phraseId } = params;
  if (!phraseId) {
    return NextResponse.json({ error: 'Phrase ID is required' }, { status: 400 });
  }

  let dataToUpdate: Prisma.PhraseUpdateInput = {}; // Use PhraseUpdateInput for better typing
  let originalKey: string = 'C'; // Default key
  let tagNames: string[] = [];

  try {
    const body = await request.json();

    // --- Validate abcNotation ---
    if (typeof body.abcNotation === 'string' && body.abcNotation.trim().length > 0) {
        dataToUpdate.abcNotation = body.abcNotation.trim();
        // --- Extract Original Key from abcNotation ---
        const parsed = parseAbcNotation(dataToUpdate.abcNotation as string); // Use the validated abcNotation
        if (parsed && parsed.header?.key) {
            originalKey = parsed.header.key;
        }
        dataToUpdate.originalKey = originalKey; // Add extracted key to data to be updated
    } else {
        return NextResponse.json({ error: 'abcNotation is required and cannot be empty.' }, { status: 400 });
    }

    // --- Validate comment (optional) ---
    if (body.comment !== undefined) {
        dataToUpdate.comment = typeof body.comment === 'string' ? body.comment.trim() : null;
    }

    // --- Validate tags (optional) ---
    if (Array.isArray(body.tags)) {
        if (!body.tags.every((tag: any) => typeof tag === 'string')) {
             return NextResponse.json({ error: 'tags must be an array of strings.' }, { status: 400 });
        }
        tagNames = body.tags; // Store tag names for processing later
    } else if (body.tags !== undefined) {
        return NextResponse.json({ error: 'tags must be an array of strings.' }, { status: 400 });
    }

    // REMOVED validation for body.originalKey here

    if (!dataToUpdate.abcNotation) { // Check if essential data is present
      return NextResponse.json({ error: 'No valid abcNotation provided for update' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    // Verify ownership before updating
    const phrase = await prisma.phrase.findUnique({
      where: { id: phraseId },
      select: { userId: true },
    });

    if (!phrase) {
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }

    if (phrase.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // --- Process Tags --- (Connect/Create Logic)
    const tagConnectOrCreate = tagNames.map(name => ({
        where: { name },
        create: { name, type: 'user_defined', userId }, // Assuming user-defined tags for now
    }));

    // Add tag update logic to dataToUpdate
    dataToUpdate.tags = {
        set: [], // Disconnect all existing tags first
        connectOrCreate: tagConnectOrCreate, // Then connect/create the new set
    };


    // Perform the update
    const updatedPhrase = await prisma.phrase.update({
      where: {
        id: phraseId,
        userId: userId // Ensure ownership again
      },
      data: dataToUpdate,
      include: { tags: true } // Include tags in the response
    });

    return NextResponse.json(updatedPhrase);
  } catch (error) {
    console.error('Error updating phrase:', error);
     if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON format in request body' }, { status: 400 });
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json({ error: 'Database validation error.', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Delete a phrase
export async function DELETE(
  request: NextRequest,
  { params }: { params: { phraseId: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phraseId } = params;
  if (!phraseId) {
    return NextResponse.json({ error: 'Phrase ID is required' }, { status: 400 });
  }

  try {
    // Verify ownership before deleting
    const phrase = await prisma.phrase.findUnique({
      where: { id: phraseId },
      select: { userId: true },
    });

    if (!phrase) {
      // If already deleted, maybe return success? Or 404.
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }

    if (phrase.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Perform the delete
    // Note: Related Stars and Comments will be cascaded deleted due to schema definition
    await prisma.phrase.delete({
      where: {
        id: phraseId,
        userId: userId // Ensure ownership again
      },
    });

    return NextResponse.json({ message: 'Phrase deleted successfully' }, { status: 200 }); // Or 204 No Content
  } catch (error) {
    console.error('Error deleting phrase:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Handle case where the record to delete doesn't exist (might happen in race conditions)
        return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
