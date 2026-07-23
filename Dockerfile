# ==========================================
# STAGE 1: Full Monorepo Build & Test Environment
# ==========================================
# We start with the .NET 9 SDK image so the dotnet CLI is natively available
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env
WORKDIR /src

ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV TURBO_TELEMETRY_DISABLED=1
ENV CI=true

# Install Node.js, npm, and build prerequisites directly into the Alpine image
RUN apk add --no-cache nodejs npm

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

# 1. Execute Turbo Test (Now both Node and Dotnet are present to handle all projects)
RUN turbo test --concurrency=1

# 2. Execute Turbo Build to compile everything (React frontends + .NET API)
RUN pnpm turbo build --concurrency=1

# 3. Publish the .NET Backend directly using the built-in assets
WORKDIR /src/apps/AyalasLanguageAPI
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# ==========================================
# STAGE 2: Final Production Image Assembly
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

# 1. Pull the compiled .NET binaries
COPY --from=build-env /app/publish .

# 2. Map the User Web Front-End Static assets into the server delivery footprint
COPY --from=build-env /src/apps/AyalasLanguageWeb/dist ./dist

# 3. Map the Admin Portal Web static assets into the server delivery footprint
COPY --from=build-env /src/apps/AyalasLanguageWebAdmin/admin ./admin

EXPOSE 5000
ENTRYPOINT [ "dotnet", "AyalasLanguageAPI.dll" ]
