import { createClient } from '../server';

// Supabaseからユーザープロファイルを取得する関数
export async function getUserProfiles(userIds: string[]) {
  if (!userIds.length) return {};

  const supabase = await createClient();
  
  // ユーザーIDごとにデフォルトのプロファイル情報を作成
  const userProfiles: Record<string, { id: string; name: string; email?: string; image?: string }> = {};
  
  for (const userId of userIds) {
    // 各ユーザーのデフォルト情報を設定
    userProfiles[userId] = {
      id: userId,
      name: `ユーザー ${userId.substring(0, 6)}`,
      image: undefined
    };
    
    // 現在のユーザーの場合は、セッションから情報を取得
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      userProfiles[userId] = {
        id: userId,
        name: user.user_metadata?.name || `ユーザー ${userId.substring(0, 6)}`,
        email: user.email,
        image: user.user_metadata?.avatar_url
      };
    }
  }

  return userProfiles;
}

// 単一ユーザーのプロファイルを取得
export async function getUserProfile(userId: string) {
  if (!userId) return null;
  
  const profiles = await getUserProfiles([userId]);
  return profiles[userId] || null;
}