# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
# install all deps (dev+prod) for build
RUN npm ci

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app
ARG BACKEND_ORIGIN
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs \
 && adduser -S nextjs -u 1001

# copy only what we need to run next start
COPY package*.json ./
# install only prod deps for runtime
RUN npm ci --omit=dev

# copy build output and public assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
USER nextjs
CMD ["npm", "run", "start"]
