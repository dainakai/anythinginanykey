# Anything in AnyKey 実装タスク一覧

## 1. 初期セットアップとインフラ構築

### PR-001: プロジェクト基本設定
- Next.js + TypeScriptプロジェクトの初期設定
- ESLint, Prettierの設定
- GitHubワークフローの設定
- 開発環境のDockerfile作成

### PR-002: データベース設計と初期マイグレーション
- PostgreSQLのセットアップ
- Prismaの導入と初期設定
- 以下のモデルの作成とマイグレーション:
  ```prisma
  model User {
    id        String   @id @default(cuid())
    email     String   @unique
    name      String?
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    phrases   Phrase[]
  }

  model Phrase {
    id           String   @id @default(cuid())
    abcNotation  String
    originalKey  String
    comment      String?
    isPublic     Boolean  @default(false)
    starCount    Int      @default(0)
    forkedFromId String?
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
    userId       String
    user         User     @relation(fields: [userId], references: [id])
    tags         Tag[]
  }

  model Tag {
    id        String   @id @default(cuid())
    name      String   @unique
    type      String   // "preset" or "user_defined"
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    userId    String?
    phrases   Phrase[]
  }
  ```

### PR-003: 認証システムの実装
- NextAuth.jsの導入
- Google OAuth2.0の設定
- ログイン/ログアウトフローの実装
- 認証状態の管理とミドルウェアの実装

## 2. コアフレーズ機能の実装

### PR-004: ABC Notation基本機能
- abcjsライブラリの導入
- ABC Notationパーサーの実装
- 楽譜レンダリングコンポーネントの作成
- 以下の基本的なABCヘッダー処理の実装:
  - X: インデックス番号
  - T: タイトル
  - M: 拍子
  - L: デフォルトの音符長
  - K: キー

### PR-005: フレーズ登録機能
- フレーズ入力フォームの作成
- ABC Notationエディタの実装
- リアルタイムプレビュー機能
- バリデーション機能
- APIエンドポイントの実装

### PR-006: フレーズ表示機能
- フレーズ詳細ページの実装
- 楽譜表示コンポーネントの作成
- コード進行の表示
- メタデータ（作成者、作成日時等）の表示
- コメント表示機能
- フレーズ編集ボタンの追加 ([id]/edit ページへのリンク)
- フレーズ削除ボタンの追加 (削除API呼び出し)

### PR-007: 移調機能の実装
- abcjsのvisualTranspose機能の実装
- 12キーへの自動移調処理
- 異名同音の適切な処理（※詳細な仕様の追加検討が必要）
- キー選択UIの実装

## 3. フレーズ管理・共有機能

### PR-008: フレーズライブラリ機能
- ユーザー別フレーズ一覧の実装 (`/dashboard`)
- ページネーション機能
- タグ選択によるフィルタリング機能
- ソート機能（新着順、古い順）
- **追加機能:**
    - フレーズ一覧ページへの「新規作成」ボタン追加
    - フレーズカード内のタグをクリックしてフィルタリングする機能
    - フレーズプレビューの楽譜表示改善（見切れ防止、短いフレーズの改行調整）

### PR-009: タグ管理システム
- プリセットタグの実装
- ユーザー定義タグの作成機能
- タグによるフィルタリング機能
- タグ管理インターフェース

### PR-010: フレーズ共有機能
- 公開/非公開設定の実装
- グローバルフレーズ一覧の作成
- フォーク機能の実装
- スター機能の実装

## 4. UI/UX改善

### PR-011: レスポンシブデザイン対応
- モバイルファーストのレイアウト実装
- タッチ操作の最適化
- 画面回転対応
- モバイルでのABC Notation入力の最適化

### PR-012: ユーザーインターフェース改善
- ダークモード対応
- アニメーション効果の追加
- ローディング状態の実装
- エラーハンドリングUIの改善

### PR-013: チュートリアル・ヘルプ機能
- ABC Notation入力ガイドの作成
- 初回ユーザー向けチュートリアルの実装
- ヘルプページの作成
- ツールチップの実装

## 5. パフォーマンスと最適化

### PR-014: パフォーマンス最適化
- フロントエンドのコード分割
- 画像最適化
- キャッシング戦略の実装
- APIレスポンスの最適化

### PR-015: SEO対応
- メタタグの最適化
- OGP対応
- サイトマップの生成
- パフォーマンスメトリクスの改善

## 6. 追加機能

### PR-XXX: PDFエクスポート機能 (Issue #23)
- PDF生成ライブラリの選定と導入
- 「PDFで表示」ボタンの実装
- PDF生成ロジックの実装
- 新しいタブでのPDF表示

## 注意事項
- 各PRの実装詳細は、実装時に追加の検討が必要な場合があります
- 特に異名同音の処理やABC Notationの詳細な仕様については、実装前に追加の技術検証が必要です
- モバイル対応については、実際のユーザーテストを基に調整が必要になる可能性があります