import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

// ユーザープロファイル情報の基本型
export interface UserProfileInfo {
  id: string;
  name: string;
}

// ユーザープロファイル情報をPrismaから取得する関数
export async function getUserProfilesFromDatabase(userIds: string[]): Promise<Record<string, UserProfileInfo>> {
  if (!userIds.length) return {};

  try {
    const profiles = await prisma.userProfile.findMany({
      where: {
        id: {
          in: userIds
        }
      }
    });

    // ユーザーIDをキーとするプロファイル情報のオブジェクトを作成
    const userProfiles: Record<string, UserProfileInfo> = {};
    
    profiles.forEach(profile => {
      userProfiles[profile.id] = {
        id: profile.id,
        name: profile.name || `ユーザー ${profile.id.substring(0, 6)}`
      };
    });

    return userProfiles;
  } catch (error) {
    console.error('Error fetching user profiles from database:', error);
    return {};
  }
}

// 現在のユーザーのプロファイル情報をSupabaseから取得
export async function getCurrentUserProfile(): Promise<UserProfileInfo | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.user_metadata?.name || `ユーザー ${user.id.substring(0, 6)}`
    };
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return null;
  }
}

// プロファイル情報をデータベースに保存または更新
export async function saveUserProfile(userId: string, name: string): Promise<UserProfileInfo | null> {
  if (!userId) return null;

  try {
    const updatedProfile = await prisma.userProfile.upsert({
      where: { id: userId },
      update: { name, updatedAt: new Date() },
      create: { id: userId, name }
    });

    return {
      id: updatedProfile.id,
      name: updatedProfile.name || `ユーザー ${updatedProfile.id.substring(0, 6)}`
    };
  } catch (error) {
    console.error('Error saving user profile to database:', error);
    return null;
  }
}

// 複数ユーザーのプロファイル情報を取得
// データベースに保存されていないユーザーには、IDから生成したデフォルト名を使用
export async function getUserProfiles(userIds: string[]): Promise<Record<string, UserProfileInfo>> {
  if (!userIds.length) return {};

  // データベースからプロファイル情報を取得
  const userProfiles = await getUserProfilesFromDatabase(userIds);
  
  // プロファイル情報が見つからないユーザーにはデフォルト名を設定
  userIds.forEach(userId => {
    if (!userProfiles[userId]) {
      userProfiles[userId] = {
        id: userId,
        name: `ユーザー ${userId.substring(0, 6)}`
      };
    }
  });

  return userProfiles;
}

// 単一ユーザーのプロファイル情報を取得
export async function getUserProfile(userId: string): Promise<UserProfileInfo | null> {
  if (!userId) return null;
  
  const profiles = await getUserProfiles([userId]);
  return profiles[userId] || null;
}