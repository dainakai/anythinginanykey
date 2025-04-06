FROM node:20-slim

# Install openssl, ca-certificates, and netcat
RUN apt-get update && apt-get install -y openssl ca-certificates netcat-traditional && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package files first
COPY package*.json ./
# Install dependencies using cache
RUN npm install --legacy-peer-deps

# Copy prisma schema
COPY prisma ./prisma/
# Generate prisma client (uses installed node_modules)
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Copy the entrypoint script (moved after code copy)
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]

EXPOSE 3000

# Use npm run dev (or build + start for production)
CMD ["npm", "run", "dev"]