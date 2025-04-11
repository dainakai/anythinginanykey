import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
// import { cookies } from 'next/headers'; // 未使用のため削除
import { createClient } from '@/utils/supabase/server';
// import { publishPhrase } from '@/lib/phrase'; // 未使用のため削除

export const runtime = 'edge';

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

  let isPublic: boolean;
  try {
    const body = await request.json();
    if (typeof body.isPublic !== 'boolean') {
      return NextResponse.json({ error: 'Invalid value for isPublic. Must be boolean.' }, { status: 400 });
    }
    isPublic = body.isPublic;
  } catch (error) {
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
        userId: userId // Ensuring ownership again
      },
      data: {
        isPublic: isPublic,
      },
    });

    return NextResponse.json(updatedPhrase);
  } catch (error) {
    console.error('Error updating publish status:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors if needed
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
