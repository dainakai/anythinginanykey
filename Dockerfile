FROM node:20-slim

# Install openssl, ca-certificates, and netcat
RUN apt-get update && apt-get install -y openssl ca-certificates netcat-traditional && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Set NODE_ENV to development to install devDependencies
ENV NODE_ENV=development

# Install dependencies including devDependencies
RUN npm cache clean --force && npm install --legacy-peer-deps

# Prisma Accelerate対応のための追加パッケージをインストール
# RUN npm install @prisma/extension-accelerate@0.6.3 --save-exact

# Copy prisma schema
COPY prisma ./prisma/
# Force cache invalidation for generate step by re-copying schema
COPY prisma/schema.prisma ./prisma/schema.prisma
# Generate prisma client with --no-engine flag for Accelerate
RUN npx prisma generate --no-engine

# Copy the rest of the application code
COPY . .

# Copy the entrypoint script (moved after code copy)
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]

EXPOSE 3000

# Use npm run dev (or build + start for production)
CMD ["npm", "run", "dev"]