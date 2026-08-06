# ==========================================
# STAGE 1: Unified Build Environment (SDK + Node)
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build-env
WORKDIR /src

# 1. Install Node.js and pnpm from the official Node image
COPY --from=node:22-alpine /usr/lib /usr/lib
COPY --from=node:22-alpine /usr/local/lib /usr/local/lib
COPY --from=node:22-alpine /usr/local/include /usr/local/include
COPY --from=node:22-alpine /usr/local/bin /usr/local/bin

# 2. Setup pnpm and turbo
RUN npm install -g pnpm turbo

# 3. Copy monorepo configuration for frontend caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/AyalasLanguageWeb/package.json ./apps/AyalasLanguageWeb/
COPY apps/AyalasLanguageWebAdmin/package.json ./apps/AyalasLanguageWebAdmin/

# 4. Install frontend dependencies (Cached Layer)
ENV CI=true
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------
# NEW STEP: .NET Restore (Cached Layer)
# Copy all .csproj files and restore BEFORE copying full source.
# This prevents network errors during the test phase.
# ---------------------------------------------------
COPY AyalasLanguage.sln ./
COPY apps/AyalasLanguageAPI/*.csproj ./apps/AyalasLanguageAPI/
COPY dotnet-libs/AyalasLanguageAPI.Data/*.csproj ./dotnet-libs/AyalasLanguageAPI.Data/
COPY dotnet-libs/AyalasLanguageAPI.Data.Migrations.SQLite/*.csproj ./dotnet-libs/AyalasLanguageAPI.Data.Migrations.SQLite/
COPY dotnet-libs/AyalasLanguageAPI.Data.Migrations.MySQL/*.csproj ./dotnet-libs/AyalasLanguageAPI.Data.Migrations.MySQL/
COPY dotnet-libs/AyalasLanguageJobs/*.csproj ./dotnet-libs/AyalasLanguageJobs/

RUN dotnet restore
# ---------------------------------------------------

# 5. Copy the rest of the source (Backend + Frontend)
COPY . .

# 6. Run Turbo commands 
# Now that 'dotnet restore' was run above, these will use the cached packages
RUN pnpm turbo test
RUN pnpm turbo build

# 7. Publish .NET Backend
WORKDIR /src/apps/AyalasLanguageAPI
# Adding --no-restore because we already did it in step 4.5
RUN dotnet publish -c Release -o /app/publish --no-restore /p:UseAppHost=false

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

# Set up permissions
USER root
RUN mkdir -p /app/data && chown -R $APP_UID:$APP_UID /app/data
USER $APP_UID

# Copy Backend artifacts
COPY --from=build-env /app/publish .

# Copy Frontend artifacts
COPY --from=build-env /src/apps/AyalasLanguageWeb/dist ./dist
COPY --from=build-env /src/apps/AyalasLanguageWebAdmin/admin ./admin

EXPOSE 5000
ENTRYPOINT [ "dotnet", "AyalasLanguageAPI.dll" ]