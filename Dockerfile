FROM node:20-alpine AS builder
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci --omit=dev
COPY app ./

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 4000
CMD ["node", "server.js"]