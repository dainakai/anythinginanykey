import { /*NextRequest,*/ NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const runtime = 'edge';

// DELETE /api/tags/[id] - Delete a user-defined tag
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Supabase認証を使用してユーザー情報を取得
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // paramsをawaitして取得
  const { id: tagId } = await params;

  if (!user?.id) {
    // Require authentication to delete tags
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  if (!tagId) {
    return NextResponse.json({ error: 'タグIDが必要です' }, { status: 400 });
  }

  try {
    // First, check if the tag exists and is user-defined
    const tagToDelete = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tagToDelete) {
      return NextResponse.json({ error: 'タグが見つかりません' }, { status: 404 });
    }

    // IMPORTANT: Prevent deletion of preset tags
    if (tagToDelete.type === 'preset') {
      return NextResponse.json({ error: 'プリセットタグは削除できません' }, { status: 403 }); // 403 Forbidden
    }

    // Check if the tag belongs to the authenticated user
    if (tagToDelete.userId && tagToDelete.userId !== user.id) {
      return NextResponse.json({ error: 'このタグを削除する権限がありません' }, { status: 403 });
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
           return NextResponse.json({ error: 'タグが見つからないか、すでに削除されています' }, { status: 404 });
      }
      // Log other potential Prisma errors
      console.error('Prisma Error Code:', error.code);
    }

    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
