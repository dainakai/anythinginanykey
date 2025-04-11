## 概要
Issue #37 に対応し、認証機構をNextAuth.js + Prisma AdapterからSupabase Authへ移行しました。

## 実装内容
1. 関連パッケージの入れ替え
   - 削除: `next-auth`, `@next-auth/prisma-adapter`
   - 追加: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`

2. 認証関連ファイルの修正
   - NextAuth.js設定ファイル(`src/auth.ts`)を削除
   - Supabaseクライアント初期化ファイルを追加・修正
   - ミドルウェア(`src/middleware.ts`)を実装し認証保護を強化

3. Prismaスキーマ修正
   - 認証関連モデル(User, Account, Session, VerificationToken)を削除
   - UserProfileモデルを追加し、Supabaseユーザーと連携するように変更
   - リレーションの修正（各モデルからUserへの参照をUserProfileへ変更）

4. API・ページの修正
   - すべてのAPI routeをSupabase認証に対応するよう修正
   - ページコンポーネントでの認証情報取得方法を修正
   - ヘッダーコンポーネントのログイン/ログアウト処理を修正

5. マイグレーションスクリプト
   - データベース構造変更のためのマイグレーションファイルを追加
   - 既存データを新構造に移行するためのスクリプトを追加

6. ドキュメントの更新
   - README.mdに認証の変更点と注意事項を追記

## 動作確認
- ユーザー登録・ログイン・ログアウトの一連の処理
- 認証が必要なページの保護（未ログイン時のリダイレクト）
- APIエンドポイントの保護（認証必須のAPIへの未認証アクセス拒否）
- ユーザープロファイルの作成・更新

## 関連Issue
Closes #37