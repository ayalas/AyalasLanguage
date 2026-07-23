# ==========================================
# STAGE 1: Monorepo Frontend & Test Runner
# ==========================================
FROM node:22-alpine AS frontend-env
WORKDIR /src

# Set strict global low-memory resource tracking configurations
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV TURBO_TELEMETRY_DISABLED=1
ENV CI=true

# Install pnpm and turbo globally
RUN npm install -g pnpm turbo

# Copy workspace dependency trees to optimize layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/AyalasLanguageWeb/package.json ./apps/AyalasLanguageWeb/
COPY apps/AyalasLanguageWebAdmin/package.json ./apps/AyalasLanguageWebAdmin/
COPY apps/AyalasLanguageAPI/*.csproj ./apps/AyalasLanguageAPI/

# Run safe installation with single-thread fallback to protect RAM
RUN pnpm install --frozen-lockfile --child-concurrency=1

# Copy the remaining project source code
COPY . .

# CRITICAL RAM PROTECTION: Restrict Turbo to exactly 1 concurrent worker thread.
# This prevents Node threads from fighting over the 2GB server limit.
RUN turbo test --concurrency=1

# Compile production apps with strict single-thread constraints
RUN pnpm turbo build --concurrency=1

# ==========================================
# STAGE 2: Build and Publish .NET 9 Backend
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-publish
WORKDIR /src

COPY apps/AyalasLanguageAPI/ ./apps/AyalasLanguageAPI/
WORKDIR /src/apps/AyalasLanguageAPI

RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# ==========================================
# STAGE 3: Final Production Image Assembly
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS final
WORKDIR /app

ARG BUILD_ENV
ARG CLIENT_CONFIRM_URL

ENV ASPNETCORE_ENVIRONMENT=$BUILD_ENV
ENV EmailConfirmation:ClientAddress=$CLIENT_CONFIRM_URL
ENV ASPNETCORE_URLS=http://+:5000

USER root
RUN mkdir -p /app/data && chown -R $APP_UID:$APP_UID /app/data
USER $APP_UID

COPY --from=backend-publish /app/publish .
COPY --from=frontend-env /src/apps/AyalasLanguageWeb/dist ./dist
COPY --from=frontend-env /src/apps/AyalasLanguageWebAdmin/admin ./admin

EXPOSE 5000
ENTRYPOINT [ "dotnet", "AyalasLanguageAPI.dll" ]
