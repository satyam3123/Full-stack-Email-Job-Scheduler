FROM node:22-alpine AS build
WORKDIR /app

# Copy package files from correct subfolders
COPY outputs/reachinbox-email-scheduler/package.json outputs/reachinbox-email-scheduler/package-lock.json ./
COPY outputs/reachinbox-email-scheduler/apps/server/package.json outputs/reachinbox-email-scheduler/apps/server/package.json
COPY outputs/reachinbox-email-scheduler/apps/web/package.json outputs/reachinbox-email-scheduler/apps/web/package.json

RUN npm ci --no-audit --no-fund
COPY outputs/reachinbox-email-scheduler/ .

ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/server ./apps/server
COPY --from=build /app/apps/web/dist ./apps/web/dist

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/server/prisma/schema.prisma && node apps/server/dist/index.js"]
