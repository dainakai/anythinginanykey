# Anything in Any Keys

オリジナルフレーズを任意のキーで演奏できるようにするアプリケーションです。

## プロジェクト構成

このプロジェクトはNext.js、Supabase（認証）、およびPrisma（データベース）を使用しています。

## セットアップと実行方法

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルドと本番環境での実行
npm run build
npm start

# Dockerでの実行
docker-compose up --build
```

## セットアップに関する注意事項

初回実行時に以下のエラーが発生した場合：
```
ERROR: relation "public.UserProfile" does not exist
```

以下のコマンドを実行してデータベースマイグレーションを適用してください：

```bash
# 手動でのマイグレーション適用
npx prisma migrate deploy

# または、開発環境でのマイグレーション
npx prisma migrate dev
```

## 認証について

このプロジェクトはSupabase認証を使用しています。Next-Auth認証システムからの移行が完了しています。

ミドルウェア（`src/middleware.ts`）は以下の役割を担います：
- ユーザーの認証状態をチェック
- 未認証ユーザーをログインページにリダイレクト

ユーザープロファイルの更新は、ログイン成功時に `/api/auth/profile` APIルートで行われます。これは、Next.jsのミドルウェア（Edge Runtime）ではPrisma Clientを直接使用できないためです。

## 技術的な制約事項

- **Edge RuntimeとPrisma**: Next.jsのミドルウェア、Edge API Routes、Edge Functionsなどの環境では、標準のPrisma Clientは動作しません。これらの環境でデータベースアクセスが必要な場合は、以下のいずれかを検討してください：
  - API Routesを使用してデータベース操作を行う
  - Prisma Accelerateを使用する（本プロジェクトではCloudflareデプロイのためこの方法を採用）

## Cloudflareへのデプロイ

このプロジェクトはCloudflare Pagesへのデプロイに対応しています。

### 事前準備

1. Cloudflareアカウントを作成し、Cloudflare Pagesを有効化
2. GitリポジトリをCloudflareと連携
3. **Prisma Accelerateのセットアップ**
   - Prisma Data Platformのアカウント作成: https://cloud.prisma.io
   - 新しいプロジェクトを作成
   - Prisma Accelerate設定を取得（接続文字列）

### デプロイ手順

1. Cloudflare Dashboardでプロジェクトを作成
2. ビルド設定:
   - ビルドコマンド: `npm run build`
   - ビルド出力ディレクトリ: `.next`
   - Node.jsバージョン: 20.x以上

3. 環境変数の設定:
   以下の環境変数をCloudflare Pagesのプロジェクト設定で追加:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<SupabaseのURL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<SupabaseのAnonymousキー>
   DATABASE_URL=<Prisma Accelerate接続文字列>
   DIRECT_URL=<Supabase Postgres直接接続文字列>
   NODE_ENV=production
   ```

   **注**: DATABASE_URLはPrisma Accelerateの接続文字列を使用します（`prisma://<project-id>...`の形式）

4. "保存してデプロイ"をクリック

### Supabaseの設定

1. Supabaseプロジェクトで認証リダイレクトURLを設定:
   - Supabaseダッシュボード > Authentication > URL Configuration
   - Site URL: `https://<あなたのCloudflareサブドメイン>.pages.dev`
   - Redirect URLs: `https://<あなたのCloudflareサブドメイン>.pages.dev/api/auth/callback`

2. データベース接続文字列:
   - DIRECT_URL: Supabase PostgreSQLへの直接接続文字列（Prisma Accelerateのフォールバック用）
     例: `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`

## 開発ガイドライン

1. 新機能を開発する前に、必ず既存のコードパターンを確認してください
2. Supabase認証を活用し、認証関連の実装はSupabaseクライアントを使用してください
3. データモデルの変更を行う場合は、Prismaスキーマを更新し、マイグレーションを行ってください
4. ミドルウェア内ではPrisma Clientを使用しないでください

## 注意点

- Prismaモデルの変更を行った場合は、`npx prisma migrate dev`を実行してマイグレーションファイルを生成してください
- 環境変数は`.env.local`に設定する必要があります
- Supabaseの認証設定は、SupabaseダッシュボードのAuth設定で行ってください

## データベース構造

Supabase認証への移行に伴い、以下のテーブル構造になっています：

- `UserProfile`: ユーザープロファイル情報（Supabaseユーザーと連携）
- `Phrase`: フレーズデータ
- `Tag`: タグ情報
- `Star`: スター（お気に入り）情報
- `Comment`: コメント情報