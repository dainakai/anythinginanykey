import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { saveUserProfile } from '@/lib/userProfile';

// ユーザーがログインした後にプロファイル情報を自動更新するためのAPIルート
export async function GET() {
  try {
    // サーバーサイドでSupabaseクライアントを作成
    const supabase = await createClient();
    
    // 現在のユーザー情報を取得
    const { data: { user } } = await supabase.auth.getUser();
    
    // ユーザーがログインしていない場合は401エラーを返す
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ユーザーのプロファイル情報をデータベースに保存
    if (user.user_metadata?.name) {
      await saveUserProfile(user.id, user.user_metadata.name);
    }

    return NextResponse.json({ 
      success: true,
      message: 'ユーザープロファイルが更新されました',
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || null
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'プロファイル更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}