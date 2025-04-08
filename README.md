# Anything in AnyKey

ジャズなどのインプロヴィゼーションを行うミュージシャン向けのフレーズ管理・共有サービス「Anything in AnyKey」のリポジトリです。

## 特徴

- ABC notation形式でのフレーズ登録・管理
- 全12キーへの自動移調表示
- タグによるフレーズの分類・検索
- ユーザー定義タグの管理 (追加・削除)
- プリセットタグの提供
- Googleアカウントによる認証

## 技術スタック

- **フレームワーク:** Next.js (App Router)
- **言語:** TypeScript
- **データベース:** PostgreSQL
- **ORM:** Prisma
- **認証:** NextAuth.js (Auth.js v5)
- **UI:** Tailwind CSS
- **楽譜描画:** abcjs
- **コンテナ:** Docker, Docker Compose

## 開発環境セットアップ

### 必要なもの

- Node.js (v20推奨)
- Docker Desktop
- Google Cloud Platformアカウント (OAuth認証情報用)

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
    - `POSTGRES_PASSWORD`: 任意のパスワード (デフォルト: `password`)
    - `GOOGLE_CLIENT_ID`: Google Cloud Console で取得したクライアントID
    - `GOOGLE_CLIENT_SECRET`: Google Cloud Console で取得したクライアントシークレット
    - `NEXTAUTH_SECRET`: 任意のランダムな文字列 (例: `openssl rand -hex 32` で生成)
    - `NEXTAUTH_URL`: `http://localhost:3000` (ローカル開発環境の場合)

3.  **Dockerコンテナのビルドと起動:**
    ```bash
    docker-compose up --build -d
    ```
    初回起動時にはデータベースのマイグレーションが自動的に実行されます。

4.  **(初回のみ) プリセットタグの投入:**
    アプリケーションで共通利用するプリセットタグをデータベースに登録します。
    ```bash
    npm run seed
    ```
    (このコマンドは Docker コンテナ内で Seed スクリプトを実行します)

5.  **アクセス:**
    ブラウザで `http://localhost:3000` にアクセスします。

### 便利なコマンド

- **コンテナの停止:** `docker-compose down`
- **データベースのリセット:**
  ```bash
  docker-compose down -v # ボリュームごと削除
  docker-compose up --build -d
  npm run seed # プリセットタグ再投入
  ```
- **Prisma Studio (データベースGUI):**
  `docker-compose.yml` で `web` サービスのポート `5555` が公開されています。
  ```bash
  docker-compose exec web npx prisma studio
  ```
  その後、ブラウザで `http://localhost:5555` にアクセスします。

## Cloudflare Pages へのデプロイ

このアプリケーションは Cloudflare Pages と Supabase を利用してデプロイできます。

### 1. 前提条件

-   Cloudflare アカウント
-   Supabase アカウント (PostgreSQLデータベース用)
-   Google Cloud Platform アカウント (OAuth認証情報用)

### 2. Supabase の設定

1.  **プロジェクト作成:** Supabase で新規プロジェクトを作成します（無料プランで開始可能）。
2.  **接続URIの取得:** 作成したプロジェクトの「Settings」>「Database」>「Connection string」>「URI」タブから、**必ずパスワードを含んだ状態の** 接続URIをコピーします。これが後述する `DATABASE_URL` 環境変数になります。
3.  **コネクションの選択** Direct Connection以外を選択してください。

### 3. Cloudflare Pages の設定

1.  **リポジトリ連携:** Cloudflare ダッシュボードから「Workers & Pages」>「アプリケーションを作成」>「Pages」>「Gitリポジトリに接続」を選択し、このGitHubリポジトリを選択します。
2.  **ビルド設定:**
    *   **プロダクションブランチ:** デプロイしたいブランチ (例: `main`) を選択します。
    *   **フレームワークプリセット:** 「Next.js」を選択します。
    *   **ビルドコマンド:** `npm run build` (または `prisma generate && next build`)
    *   **ビルド出力ディレクトリ:** `.next`
    *   **環境変数 (ビルド環境と運用環境):**
        *   `DATABASE_URL`: 手順2で取得したSupabaseの接続URIを設定します。
        *   `NEXTAUTH_URL`: Cloudflare Pages でデプロイ後に割り当てられるURL (例: `https://your-project-name.pages.dev`) を設定します。
        *   `NEXTAUTH_SECRET`: 新しいランダムな文字列 (例: `openssl rand -hex 32` で生成) を設定します。ローカルと同じである必要はありません。
        *   `GOOGLE_CLIENT_ID`: ローカルの `.env` と同じ Google Client ID を設定します。
        *   `GOOGLE_CLIENT_SECRET`: ローカルの `.env` と同じ Google Client Secret を設定します。
        *   `NODE_VERSION`: プロジェクトで使用しているNode.jsのバージョン (例: `20`) を指定しておくと安定します。
        *   その他、アプリケーションが必要とする環境変数があれば追加します。

### 4. Google OAuth 設定の更新

Google Cloud Console の認証情報設定画面で、Cloudflare Pages のデプロイURLからリダイレクトされるURIを「承認済みのリダイレクト URI」に追加します。
通常は `https://<your-project-name.pages.dev>/api/auth/callback/google` の形式です。

### 5. 初回デプロイとデータベース初期化

1.  **デプロイ実行:** Cloudflare Pages で「保存してデプロイする」をクリックします。ビルドとデプロイが開始されます。
2.  **データベースマイグレーション:** **デプロイ完了後**、ご自身の**ローカルマシン**のターミナルから、以下のコマンドを実行して本番データベース (Supabase) のスキーマを作成します。**`<Supabase接続URI>` は手順2で取得したものに置き換えてください。**
    ```bash
    DATABASE_URL="<Supabase接続URI>" npx prisma migrate deploy
    ```
3.  **プリセットタグ投入:** 同様に、ローカルマシンから以下のコマンドを実行して、初期データを投入します。（`prisma/seed.ts` が実行されます）
    ```bash
    DATABASE_URL="<Supabase接続URI>" npx prisma db seed
    ```
4.  **動作確認:** デプロイされたURL (`https://your-project-name.pages.dev`) にアクセスし、アプリケーションが正しく表示され、Googleログインやデータベースへのアクセス（フレーズ表示など）が機能するか確認します。

## 機能追加・更新時のデプロイフロー

1.  **ローカルでの開発:**
    *   コードを修正します。
    *   データベースのスキーマ変更が必要な場合は `prisma/schema.prisma` を編集します。
2.  **ローカルでのマイグレーション (スキーマ変更時):**
    *   `prisma/schema.prisma` を編集した場合、ローカルの開発環境に対してマイグレーションを実行します。
        ```bash
        npx prisma migrate dev --name <分かりやすいマイグレーション名>
        ```
    *   これにより `prisma/migrations` ディレクトリに新しいSQLファイルが生成されます。
3.  **Git 操作:**
    *   変更したコード (`.ts`, `.tsx` ファイルなど)、`prisma/schema.prisma` (変更した場合)、`prisma/migrations` 内の新しいマイグレーションファイル、をすべてGitにコミットし、GitHubにプッシュします。
4.  **Cloudflare Pages での自動デプロイ:**
    *   GitHubへのプッシュをトリガーとして、Cloudflare Pages が自動的に新しいコードでビルドとデプロイを実行します。
5.  **本番データベースへのマイグレーション適用 (スキーマ変更時):**
    *   **Cloudflare Pages のデプロイが完了した後**、スキーマ変更を行った場合は、初回デプロイ時と同様に**ローカルマシン**から本番データベース (Supabase) へマイグレーションを適用します。
        ```bash
        DATABASE_URL="<Supabase接続URI>" npx prisma migrate deploy
        ```
    *   **注意:** `prisma migrate deploy` は `prisma/migrations` に記録されている未適用のマイグレーションを実行します。ローカルで `prisma migrate dev` を実行し忘れたり、生成されたファイルをコミットし忘れると、本番DBは更新されません。
6.  **動作確認:**
    *   デプロイされたURLにアクセスし、更新内容が正しく反映されているか確認します。

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
