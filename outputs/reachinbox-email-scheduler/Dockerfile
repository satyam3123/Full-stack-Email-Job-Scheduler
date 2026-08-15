FROM node:22-alpine AS build
WORKDIR /app

# Create destination directories first
RUN mkdir -p apps/api apps/web

# Copy package files from repository subfolder
COPY outputs/reachinbox-email-scheduler/package.json outputs/reachinbox-email-scheduler/package-lock.json ./
COPY outputs/reachinbox-email-scheduler/apps/api/package.json ./apps/api/
COPY outputs/reachinbox-email-scheduler/apps/web/package.json ./apps/web/

RUN npm ci --no-audit --no-fund

# Copy source code from subfolder
COPY outputs/reachinbox-email-scheduler/ .

ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy compiled artifacts using the correct api path
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/apps/web/dist ./apps/web/dist

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/index.js"]
