FROM node:20-slim

# Install openssl, ca-certificates, and netcat
RUN apt-get update && apt-get install -y openssl ca-certificates netcat-traditional && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY prisma ./prisma/
RUN npx prisma generate

# Copy the entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]