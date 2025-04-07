# anythinginanykeys

## 開発環境 (Docker)

このプロジェクトは Docker Compose を使用して開発環境を構築・実行できます。

### 起動方法

1.  プロジェクトルートに `.env` ファイルを作成し、以下の環境変数を設定します。サンプルとして `.env.example` があればそれをコピーして編集してください。
    *   `DATABASE_URL`: PostgreSQL データベースの接続URL (例: `postgresql://user:password@db:5432/mydatabase`)
    *   `GOOGLE_CLIENT_ID`: Google Cloud Console で取得したクライアント ID
    *   `GOOGLE_CLIENT_SECRET`: Google Cloud Console で取得したクライアントシークレット
    *   `NEXTAUTH_SECRET`: `openssl rand -hex 32` などで生成したランダムな文字列
2.  以下のコマンドを実行します。

    ```bash
    docker compose up --build
    ```

これにより、依存関係のインストール、Prisma Client の生成、データベースマイグレーションの適用、Next.js 開発サーバーの起動が自動で行われます。アプリケーションは `http://localhost:3000` でアクセス可能になります。

### データベースの確認 (Prisma Studio)

開発中にデータベースの内容を確認するには、Prisma Studio が便利です。

1.  `docker compose up` を実行しているターミナルとは**別のターミナル**を開きます。
2.  以下のコマンドを実行して、`web` コンテナ内で Prisma Studio を起動します。

    ```bash
    docker compose exec web npx prisma studio
    ```

3.  ブラウザで `http://localhost:5555` にアクセスします。

### 動作の仕組み

`docker compose up` を実行すると、以下の処理が順に行われます。

1.  `Dockerfile` に基づいて Docker イメージがビルドされます。
    *   Node.js 環境のセットアップ
    *   npm 依存関係のインストール
    *   Prisma Client の生成 (`npx prisma generate`)
2.  コンテナが起動します。
3.  `entrypoint.sh` スクリプトが実行されます。
    *   データベースマイグレーションが適用されます (`npx prisma migrate dev`)。
4.  Next.js 開発サーバーが起動します (`npm run dev`)。

## 主な機能 (開発中)

### フレーズ登録

-   URL: `/phrases/new`
-   ログイン後、ABC Notation 形式でフレーズ、コメント、タグ（カンマ区切り）を入力して登録できます。
-   入力された ABC Notation はリアルタイムでプレビュー表示され、構文エラーやレンダリングエラーがある場合はエラーメッセージが表示され、登録ボタンが無効になります。
-   登録されたフレーズとタグはデータベースに保存されます。
