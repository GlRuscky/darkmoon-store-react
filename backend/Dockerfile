FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY src ./src
ENV PORT=3000 DB_PATH=/app/data/darkmoon.db
EXPOSE 3000
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.ts"]
