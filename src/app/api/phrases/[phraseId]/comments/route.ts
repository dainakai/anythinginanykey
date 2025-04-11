import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/lib/userProfile';

export const runtime = 'edge';

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

  // Supabaseを使用してユーザー認証情報を取得
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

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
  } catch (_error) {
    console.error('Invalid comments request body:', _error);
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
      }
    });

    // ユーザープロファイル情報を取得
    const userProfile = await getUserProfile(userId);

    // Add user details 
    const commentWithUser = {
      ...newComment,
      user: {
        id: userId,
        name: userProfile?.name || `ユーザー ${userId.substring(0, 6)}`,
        image: null
      }
    };

    return NextResponse.json(commentWithUser, { status: 201 });

  } catch (error) {
    console.error('Error adding comment:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle potential errors like foreign key constraints, etc.
      if (error.code === 'P2003') { // Foreign key constraint failed (e.g., phrase doesn't exist)
          return NextResponse.json({ error: 'Phrase not found or invalid reference.' }, { status: 404 });
      }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
