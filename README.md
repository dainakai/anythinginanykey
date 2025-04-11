# Anything in AnyKey

ジャズなどのインプロヴィゼーションを行うミュージシャン向けのフレーズ管理・共有サービス「Anything in AnyKey」のリポジトリです。

## 特徴

- ABC notation形式でのフレーズ登録・管理
- 全12キーへの自動移調表示
- タグによるフレーズの分類・検索
- ユーザー定義タグの管理 (追加・削除)
- プリセットタグの提供
- Googleアカウントによる認証 (Supabase Auth 経由)

## 技術スタック

- **フレームワーク:** Next.js (App Router)
- **言語:** TypeScript
- **データベース:** PostgreSQL (ローカル開発時は Docker, 本番は Supabase DB)
- **ORM:** Prisma
- **認証:** Supabase Auth (@supabase/supabase-js, @supabase/auth-helpers-nextjs)
- **UI:** Tailwind CSS
- **楽譜描画:** abcjs
- **コンテナ:** Docker, Docker Compose (ローカル開発環境)

## 開発環境セットアップ

### 必要なもの

- Node.js (v20推奨)
- Docker Desktop (ローカル DB 利用時)
- Supabase アカウント (認証、データベース用)

### 手順

1.  **リポジトリのクローン:**
    ```bash
    git clone https://github.com/dainakai/anythinginanykeys.git
    cd anythinginanykeys
    ```

2.  **環境変数の設定:**
    `.env.example` をコピーして `.env` ファイルを作成します。
    ```bash
    cp .env.example .env
    ```
    `.env` ファイルを開き、以下の項目を設定してください:

    **Supabase 関連:**
    - `NEXT_PUBLIC_SUPABASE_URL`: あなたの Supabase プロジェクトの URL (Project Settings > API)
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: あなたの Supabase プロジェクトの `anon` public キー (Project Settings > API)
    - `SUPABASE_SERVICE_ROLE_KEY`: (オプション) あなたの Supabase プロジェクトの `service_role` secret キー (Project Settings > API)。サーバーサイドで管理者権限が必要な場合に使用します。

    **データベース接続:**
    Supabase プロジェクトのデータベースを使用する場合:
    - `DATABASE_URL`: Supabase データベースの接続文字列 (Project Settings > Database > Connection string > URI)。Prisma が直接データベースにアクセスするために使用します。
    ローカルの Docker PostgreSQL コンテナを使用する場合 (デフォルト):
    - `DATABASE_URL="postgresql://user:password@db:5432/mydatabase?schema=public"`
    - `POSTGRES_PASSWORD`: 任意のパスワード (デフォルト: `password`)。上記 `DATABASE_URL` と合わせてください。

3.  **依存関係のインストール:**
    ```bash
    npm install
    ```

4.  **Dockerコンテナの起動 (ローカル DB 利用時):**
    ローカルの PostgreSQL データベースを使用する場合のみ実行します。
    ```bash
    docker-compose up --build -d
    ```

5.  **データベースマイグレーション:**
    Supabase DB またはローカル DB に対してスキーマを適用します。
    ```bash
    # Supabase DB または localhost:5433 (docker-compose.yml 参照) に接続できる状態で実行
    npx prisma migrate dev
    ```
    *注意:* マイグレーションを `web` コンテナ内で実行したい場合は `docker-compose exec web npx prisma migrate dev` を使用します。

6.  **(初回のみ) プリセットタグの投入:**
    アプリケーションで共通利用するプリセットタグをデータベースに登録します。
    ```bash
    npm run seed
    ```
    (ローカル DB の場合、`docker-compose exec web npm run seed` でコンテナ内で実行します)

7.  **開発サーバーの起動:**
    ```bash
    npm run dev
    ```

8.  **アクセス:**
    ブラウザで `http://localhost:3000` にアクセスします。

### 便利なコマンド

- **コンテナの停止 (ローカル DB):** `docker-compose down`
- **ローカル DB のリセット:**
  ```bash
  docker-compose down -v # ボリュームごと削除
  docker-compose up --build -d
  docker-compose exec web npx prisma migrate reset --force # スキーマ再適用
  docker-compose exec web npm run seed # プリセットタグ再投入
  ```
- **Prisma Studio (データベースGUI):**
  Supabase DB の場合は Supabase Studio を使用します。
  ローカル DB の場合:
  `docker-compose.yml` で `web` サービスのポート `5555` が公開されています。
  ```bash
  docker-compose exec web npx prisma studio
  ```
  その後、ブラウザで `http://localhost:5555` にアクセスします。

## 機能概要

- **ダッシュボード (`/dashboard`):**
  - ログインユーザーが登録したフレーズを一覧表示します。
  - フレーズの公開/非公開設定を切り替えられます。
  - フレーズのページネーション、ソート（新着順/古い順）、タグによるフィルタリング（「タグなし」含む）が可能です。
  - 各フレーズカードのタグをクリックしてもフィルタリングできます。
  - 「新しいフレーズを作成」ボタンからフレーズ登録ページへ遷移します。
  - 「タグを管理」ボタンからタグ管理ページへ遷移します。
  - 「スター付きフレーズ」ボタンからスター一覧ページへ遷移します。
  - プロフィール名（表示名）を編集できます。
- **グローバルライブラリ (`/global`):**
  - 他のユーザーが公開設定しているフレーズを一覧表示します。
  - ページネーション、ソート（新着順/スター数順）、タグによるフィルタリングが可能です。
  - 各フレーズカードに作者情報、スター数、フォークボタンが表示されます。
  - スターボタンでフレーズにスターを付けたり外したりできます（ログイン時）。
  - フォークボタンでフレーズを自分のライブラリにコピーできます（ログイン時、自分のフレーズ以外）。
- **スター付きフレーズ一覧 (`/dashboard/starred`):**
  - ログインユーザーがスターを付けたフレーズを一覧表示します。
  - ページネーション、ソート（スター登録順/スター数順/作成日順）、タグによるフィルタリングが可能です。
  - 各フレーズカードにスター解除ボタン、フォークボタン（自分のフレーズ以外）が表示されます。
- **フレーズ詳細 (`/phrases/[id]`):**
  - フレーズの ABC Notation、メタデータ（キー、コメント、タグ等）、作者情報を表示します。
  - 全12キーに移調された楽譜を表示します。
  - ログインユーザーはフレーズにスターを付けたり外したり、コメントを投稿したりできます。
  - 自分のコメントは削除できます。
  - 自分が所有者の場合のみ、編集ボタン、削除ボタンが表示されます。
  - 自分が所有者でない場合、フォークボタンが表示されます。
- **フレーズ登録 (`/phrases/new`):**
  - ABC Notation、コメント、タグ（カンマ区切り）を入力して新しいフレーズを作成します。
  - ABC Notation のリアルタイムプレビューと構文チェックが行われます。
  - タグ入力時には既存のタグがサジェストされます。
- **フレーズ編集 (`/phrases/[id]/edit`):**
  - 既存のフレーズ情報を編集します。
  - 登録時と同様のプレビュー、バリデーション、タグサジェスト機能があります。
- **タグ管理 (`/dashboard/tags`):**
  - プリセットタグとユーザー定義タグを一覧表示します。
  - 新しいユーザー定義タグを作成できます。
  - ユーザー定義タグを削除できます（関連するフレーズは削除されません）。

## 今後の開発予定

Issue や `docs/tasks.md` を参照してください。
