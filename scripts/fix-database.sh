#!/bin/bash

# UserProfileテーブルが存在しない問題を修正するスクリプト
echo "UserProfileテーブルの作成を開始します..."

# Prismaマイグレーションを実行
npx prisma migrate deploy

# データベース接続を確認
echo "マイグレーション完了。データベース接続を確認しています..."
npx prisma db seed

echo "データベース修正完了。アプリケーションを再起動してください。"