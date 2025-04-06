# anythinginanykeys

## 開発環境 (Docker)

このプロジェクトは Docker Compose を使用して開発環境を構築・実行できます。

### 起動方法

1.  PostgreSQL データベースがローカルまたは別の Docker コンテナで稼働していることを確認してください。(`docker-compose.yml` でデータベースサービスを定義している場合は不要です)。
2.  `.env` ファイルに必要な環境変数 (特に `DATABASE_URL`) が設定されていることを確認してください。
3.  以下のコマンドを実行します。

    ```bash
    docker-compose up --build
    ```

これにより、依存関係のインストール、Prisma Client の生成、データベースマイグレーションの適用、Next.js 開発サーバーの起動が自動で行われます。アプリケーションは `http://localhost:3000` でアクセス可能になります。

### 動作の仕組み

`docker-compose up` を実行すると、以下の処理が順に行われます。

1.  `Dockerfile` に基づいて Docker イメージがビルドされます。
    *   Node.js 環境のセットアップ
    *   npm 依存関係のインストール
    *   Prisma Client の生成 (`npx prisma generate`)
2.  コンテナが起動します。
3.  `entrypoint.sh` スクリプトが実行されます。
    *   データベースマイグレーションが適用されます (`npx prisma migrate dev`)。
4.  Next.js 開発サーバーが起動します (`npm run dev`)。
