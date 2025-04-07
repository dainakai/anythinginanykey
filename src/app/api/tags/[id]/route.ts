import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// DELETE /api/tags/[id] - Delete a user-defined tag
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const tagId = params.id;

  if (!session?.user?.id) {
    // Require authentication to delete tags
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!tagId) {
    return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
  }

  try {
    // First, check if the tag exists and is user-defined
    const tagToDelete = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tagToDelete) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // IMPORTANT: Prevent deletion of preset tags
    if (tagToDelete.type === 'preset') {
      return NextResponse.json({ error: 'Preset tags cannot be deleted' }, { status: 403 }); // 403 Forbidden
    }

    // Note: The relation between Phrase and Tag is many-to-many.
    // Deleting a tag does NOT delete the phrases associated with it.
    // Prisma handles disconnecting the relation automatically when the tag is deleted.

    // Delete the user-defined tag
    await prisma.tag.delete({
      where: { id: tagId },
    });

    // Use 204 No Content for successful deletions where no body is returned
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`Error deleting tag ${tagId}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if necessary, e.g., P2025 (Record to delete does not exist)
      // which can happen in race conditions or if ID is invalid, despite the initial check.
      if (error.code === 'P2025') {
           return NextResponse.json({ error: 'Tag not found or already deleted' }, { status: 404 });
      }
      // Log other potential Prisma errors
      console.error('Prisma Error Code:', error.code);
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
