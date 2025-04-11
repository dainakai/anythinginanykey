import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define context type with Promise for params
interface RouteContext {
  params: Promise<{ commentId: string }>; // Params is now a Promise
}

// Delete a comment
export async function DELETE(
    request: NextRequest, // Use NextRequest
    context: RouteContext // Use context object
) {
  const { params } = context; // Access params Promise from context
  const { commentId } = await params; // Await params to get the actual value

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!commentId) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
  }

  try {
    // Find the comment to verify ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true }, // Select only userId for verification
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if the logged-in user is the owner of the comment
    if (comment.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the comment
    await prisma.comment.delete({
      where: {
        id: commentId,
        // Add userId check again for extra safety
        // userId: userId,
      },
    });

    return new NextResponse(null, { status: 204 }); // Successfully deleted, no content to return

  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Handle case where the record to delete doesn't exist
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
