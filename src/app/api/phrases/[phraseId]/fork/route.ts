import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Define context type with Promise for params
interface RouteContext {
  params: Promise<{ phraseId: string }>; // Params is now a Promise
}

// Fork a phrase into the current user's library
export async function POST(
    request: NextRequest, // Use NextRequest
    context: RouteContext // Use context object
) {
  const { params } = context; // Access params Promise from context
  const { phraseId: originalPhraseId } = await params; // Await params to get the actual value

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!originalPhraseId) {
    return NextResponse.json({ error: 'Original Phrase ID is required' }, { status: 400 });
  }

  try {
    // Find the original phrase to fork
    const originalPhrase = await prisma.phrase.findUnique({
      where: {
        id: originalPhraseId,
      },
      include: {
        tags: true, // Include tags to copy them
      },
    });

    if (!originalPhrase) {
      return NextResponse.json({ error: 'Original phrase not found' }, { status: 404 });
    }

    // Optional: Check if the original phrase is public or if the user owns it?
    // Current logic allows forking any existing phrase ID if known.
    // If only public phrases should be forkable:
    // if (!originalPhrase.isPublic && originalPhrase.userId !== userId) {
    //   return NextResponse.json({ error: 'Cannot fork a private phrase you do not own' }, { status: 403 });
    // }

    // Create the new phrase (forked copy)
    const forkedPhrase = await prisma.phrase.create({
      data: {
        abcNotation: originalPhrase.abcNotation,
        originalKey: originalPhrase.originalKey,
        comment: originalPhrase.comment, // Copy comment
        isPublic: false, // Forked phrases are private by default
        starCount: 0,    // Reset star count for the fork
        forkedFromId: originalPhraseId, // Link to the original phrase
        userId: userId, // Associate with the current user
        // Connect the same tags as the original phrase
        tags: {
          connect: originalPhrase.tags.map(tag => ({ id: tag.id })),
        },
      },
      include: {
          tags: true // Include tags in the response
      }
    });

    return NextResponse.json(forkedPhrase, { status: 201 });

  } catch (error) {
    console.error('Error forking phrase:', error);
    // Add more specific error handling if needed
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
