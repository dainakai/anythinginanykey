import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from "@/auth";
import { parseAbcNotation } from '@/lib/abcParser';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
) {
    // await request.text();
    const session = await auth();
    const phraseId = context.params.id;

    if (!phraseId) {
        return NextResponse.json({ error: 'Phrase ID is required' }, { status: 400 });
    }

    try {
        const phrase = await prisma.phrase.findUnique({
            where: { id: phraseId },
            include: {
                tags: { // Include associated tags
                    select: { name: true } // Only select tag names
                },
                user: { // Optionally include user info (be careful with sensitive data)
                    select: { id: true, name: true }
                }
            }
        });

        if (!phrase) {
            return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
        }

        // Authorization Check:
        // If the phrase is not public, only the owner can access it.
        // For now, assume all phrases require ownership check until public feature is implemented.
        if (!session || !session.user?.id || phrase.userId !== session.user.id) {
             // Check if user is logged in and owns the phrase
             // Consider making public phrases accessible later
             return NextResponse.json({ error: 'Forbidden or Not Found' }, { status: 403 }); // Or 404
        }

        // Exclude sensitive data if necessary before sending
        // const { userId, ...phraseData } = phrase; // Example

        return NextResponse.json(phrase);

    } catch (error) {
        console.error(`Error fetching phrase ${phraseId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
//   await request.text();
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const phraseId = context.params.id;

  if (!phraseId) {
    return NextResponse.json({ error: 'Phrase ID is required' }, { status: 400 });
  }

  try {
    // Find the phrase first to check ownership
    const phrase = await prisma.phrase.findUnique({
      where: { id: phraseId },
      select: { userId: true }, // Select only the userId for checking
    });

    // If phrase doesn't exist
    if (!phrase) {
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }

    // Authorization check: Ensure the user owns the phrase
    if (phrase.userId !== userId) {
      // Return 404 to avoid leaking information about phrase existence
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
      // Alternatively, return 403 Forbidden if you want to be more explicit
      // return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the phrase
    await prisma.phrase.delete({
      where: { id: phraseId },
    });

    console.log(`User ${userId} deleted phrase ${phraseId}`);

    // Return 204 No Content on successful deletion
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`Error deleting phrase ${phraseId} for user ${userId}:`, error);
    // Check if it's a Prisma error indicating record not found using a type guard
    if (
        error instanceof Error &&
        'code' in error && 
        typeof error.code === 'string' && 
        error.code === 'P2025'
    ) {
        // Handle case where record to delete is not found (already deleted, race condition)
        return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
    request: NextRequest,
    context: { params: { id: string } }
) {
    // For PUT, we need the body, so request.json() implicitly handles this.
    const session = await auth();

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const phraseId = context.params.id;

    if (!phraseId) {
        return NextResponse.json({ error: 'Phrase ID is required' }, { status: 400 });
    }

    try {
        // Reading the body here makes accessing params safe afterwards
        const body = await request.json();
        const { abcNotation, comment, tags: tagNames } = body;

        // --- Input Validation ---
        if (!abcNotation || typeof abcNotation !== 'string' || !abcNotation.trim()) {
            return NextResponse.json({ error: 'abcNotation is required and must be a non-empty string' }, { status: 400 });
        }
        if (comment !== undefined && comment !== null && typeof comment !== 'string') {
            return NextResponse.json({ error: 'comment must be a string or null' }, { status: 400 });
        }
        if (!Array.isArray(tagNames) || !tagNames.every(tag => typeof tag === 'string')) {
            return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 400 });
        }

        // --- Find Phrase and Check Ownership ---
        const existingPhrase = await prisma.phrase.findUnique({
            where: { id: phraseId },
            select: { userId: true },
        });

        if (!existingPhrase) {
            return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
        }

        if (existingPhrase.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden or Not Found' }, { status: 403 }); // Or 404
        }

        // --- Extract Original Key ---
        let originalKey = 'C'; // Default key
        const parsed = parseAbcNotation(abcNotation);
        if (parsed && parsed.header?.key) {
            originalKey = parsed.header.key;
        }

        // --- Process Tags --- (Similar to POST, using set for replacement)
        const tagConnectOrCreate = tagNames.map(name => ({
            where: { name },
            create: { name, type: 'user_defined', userId },
        }));

        // --- Update Phrase in DB ---
        const updatedPhrase = await prisma.phrase.update({
            where: { id: phraseId },
            data: {
                abcNotation,
                originalKey,
                comment: comment,
                tags: {
                    // Disconnect all existing tags first, then connect/create new ones
                    set: [], // Disconnect all first
                    connectOrCreate: tagConnectOrCreate, // Then connect/create
                }
            },
            include: { // Include updated tags in the response
                tags: true,
            }
        });

        console.log(`User ${userId} updated phrase ${phraseId}`);

        return NextResponse.json(updatedPhrase);

    } catch (error) {
        console.error(`Error updating phrase ${phraseId} for user ${userId}:`, error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
        } else if (error instanceof Error && error.name === 'PrismaClientValidationError') {
            return NextResponse.json({ error: 'Database validation error.', details: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// You might add GET and PUT/PATCH handlers here later for fetching/editing
