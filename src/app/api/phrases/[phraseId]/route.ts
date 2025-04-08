import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phraseId } = params;
  if (!phraseId) {
    return NextResponse.json({ error: 'Phrase ID is required' }, { status: 400 });
  }

  let dataToUpdate: Partial<Prisma.PhraseUpdateInput> = {};
  try {
    const body = await request.json();

    // Validate and add fields to update (abcNotation, originalKey, comment, tags)
    if (typeof body.abcNotation === 'string' && body.abcNotation.trim().length > 0) {
        dataToUpdate.abcNotation = body.abcNotation.trim();
    } else {
        return NextResponse.json({ error: 'abcNotation is required and cannot be empty.' }, { status: 400 });
    }
    if (typeof body.originalKey === 'string' && body.originalKey.trim().length > 0) {
        dataToUpdate.originalKey = body.originalKey.trim();
    } else {
        return NextResponse.json({ error: 'originalKey is required and cannot be empty.' }, { status: 400 });
    }
    if (body.comment !== undefined) { // Allow empty string or null
        dataToUpdate.comment = typeof body.comment === 'string' ? body.comment.trim() : null;
    }

    // Handle tags (assuming tags are sent as an array of strings)
    if (Array.isArray(body.tags)) {
        // This requires more complex logic:
        // 1. Find or create tags based on the provided names.
        // 2. Disconnect existing tags and connect the new set.
        // This is often done within a transaction.
        // For simplicity here, we might only update text fields initially.
        // A separate endpoint for tag management might be better.
        // console.warn("Tag update in PUT request is complex and not fully implemented here.");
        // TODO: Implement tag updates if required via this endpoint
    } else if (body.tags !== undefined) {
        return NextResponse.json({ error: 'tags must be an array of strings.' }, { status: 400 });
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Delete a phrase
export async function DELETE(request: Request, { params }: Params) {
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
