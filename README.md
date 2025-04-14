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

### Prisma Accelerateの設定

1. プロジェクトで`@prisma/extension-accelerate`を使用:
   ```bash
   npm install @prisma/extension-accelerate
   ```

2. Prismaクライアントを`--no-engine`フラグで生成:
   ```bash
   npx prisma generate --no-engine
   ```

3. Prismaクライアントの初期化方法:
   ```typescript
   import { PrismaClient } from '@prisma/client/edge'
   import { withAccelerate } from '@prisma/extension-accelerate'

   const prisma = new PrismaClient().$extends(withAccelerate())
   ```

4. クエリでキャッシュを活用（オプション）:
   ```typescript
   await prisma.userProfile.findMany({
     where: { /* 条件 */ },
     cacheStrategy: { ttl: 60 }, // 60秒間キャッシュ
   });
   ```

### デプロイ手順

1. Cloudflare Dashboardでプロジェクトを作成
2. ビルド設定:
   - ビルドコマンド: `npm run build:cloudflare`
   - ビルド出力ディレクトリ: `.vercel/output/static` (next-on-pagesのデフォルト出力先)
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

## プリセットタグのシード実行

`/prisma/seed.ts` で定義されているプリセットタグをデータベースに投入するには、以下の手順を実行します。

1.  **本番環境の接続設定**: 本番環境のデータベース接続情報 (`DATABASE_URL`) を環境変数として設定します。Cloudflare環境の場合は、環境変数設定ページで行います。特にCloudflare D1を使用する場合は `prisma/schema.prisma` の設定を確認してください。
2.  **Prisma Migrateの実行**: データベーススキーマを最新に保つため、以下のコマンドを実行します。
    ```bash
    npx prisma migrate deploy
    ```
3.  **Seedスクリプト実行準備**:
    - `package.json` に `prisma:seed` スクリプトと `prisma.seed` 設定があることを確認します。
      ```json
      {
        "scripts": {
          // ...
          "prisma:seed": "prisma db seed"
        },
        "prisma": {
          "seed": "ts-node --compiler-options {\\\"module\\\":\\\"CommonJS\\\"} prisma/seed.ts"
        }
      }
      ```
    - 開発依存関係として `ts-node` をインストールします。
      ```bash
      npm install -D ts-node @types/node
      ```
4.  **Seedスクリプトの実行**: 本番データベースに接続した状態で以下のコマンドを実行します。
    ```bash
    npx prisma db seed
    ```
    **注意**: このコマンドは本番DBにアクセスできる環境で実行してください。Cloudflareのビルドプロセス中に実行するか、ローカルから本番DBに接続して実行します。

## データベース構造

Supabase認証への移行に伴い、以下のテーブル構造になっています：

- `UserProfile`: ユーザープロファイル情報（Supabaseユーザーと連携）
- `Phrase`: フレーズデータ
- `Tag`: タグ情報
- `Star`: スター（お気に入り）情報
- `Comment`: コメント情報