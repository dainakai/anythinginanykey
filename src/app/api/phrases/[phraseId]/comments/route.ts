import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Define context type with Promise for params
interface RouteContext {
  params: Promise<{ phraseId: string }>; // Params is now a Promise
}

// Add a comment to a phrase
export async function POST(
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

  let content: string;
  try {
    const body = await request.json();
    if (typeof body.content !== 'string' || body.content.trim().length === 0 || body.content.length > 1000) { // Example length limit
      return NextResponse.json({ error: 'Invalid value for content. Must be a non-empty string up to 1000 characters.' }, { status: 400 });
    }
    content = body.content.trim();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    // Check if the phrase exists and is public (or owned by user?)
    // Users should only be able to comment on public phrases (or their own?)
    const phrase = await prisma.phrase.findUnique({
      where: { id: phraseId },
      select: { isPublic: true, userId: true },
    });

    if (!phrase) {
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }

    // Decide commenting policy: only public, or own private phrases too?
    // Current: Only public phrases are commentable by others.
    if (!phrase.isPublic && phrase.userId !== userId) {
      return NextResponse.json({ error: 'Cannot comment on a private phrase you do not own' }, { status: 403 });
    }

    // Create the comment
    const newComment = await prisma.comment.create({
      data: {
        content: content,
        userId: userId,
        phraseId: phraseId,
      },
      include: { // Include user details in the response
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json(newComment, { status: 201 });

  } catch (error) {
    console.error('Error adding comment:', error);
    // Handle potential errors, e.g., foreign key constraint if phraseId is invalid
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
