import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { saveUserProfile } from '@/lib/userProfile';

export const runtime = 'edge';

// Update user profile (currently only name)
export async function PATCH(request: NextRequest) {
  // Supabaseを使用してユーザー認証情報を取得
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let nameToUpdate: string | undefined;

  try {
    const body = await request.json();

    // Validate name
    if (typeof body.name === 'string' && body.name.trim().length > 0) {
      nameToUpdate = body.name.trim();
    } else if (body.name !== undefined) { // Allow empty string if sent explicitly?
       // Policy decision: Allow setting name to empty or require non-empty?
       // Current: Requires non-empty if 'name' key is present.
       return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (nameToUpdate === undefined) {
         return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

  } catch (error) {
    console.error('Invalid profile request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    // Supabaseを使用してユーザー情報を更新
    const { error } = await supabase.auth.updateUser({
      data: {
        name: nameToUpdate,
      }
    });

    if (error) {
      throw error;
    }

    // データベースにもユーザープロファイル情報を保存
    await saveUserProfile(userId, nameToUpdate);

    // 更新後のユーザー情報を取得
    const { data: { user: updatedUser } } = await supabase.auth.getUser();

    // フロントエンドに必要な形式で返す
    return NextResponse.json({
      id: updatedUser?.id,
      name: updatedUser?.user_metadata?.name || nameToUpdate,
      email: updatedUser?.email,
      image: updatedUser?.user_metadata?.avatar_url
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
