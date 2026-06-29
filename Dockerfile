# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Distroless Production
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app

# Kopieer alleen de noodzakelijke bestanden van de builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Stel de poort in
EXPOSE 3000

CMD ["src/index.js"]