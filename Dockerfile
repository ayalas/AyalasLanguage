# ==========================================
# STAGE 1: Monorepo Frontend & Test Runner
# ==========================================
FROM node:22-alpine AS frontend-env
WORKDIR /src

# Install pnpm and turbo globally
RUN npm install -g pnpm turbo

# Copy workspace-wide dependency trees to optimize layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/AyalasLanguageWeb/package.json ./apps/AyalasLanguageWeb/
COPY apps/AyalasLanguageWebAdmin/package.json ./apps/AyalasLanguageWebAdmin/
COPY apps/AyalasLanguageAPI/*.csproj ./apps/AyalasLanguageAPI/

# Run safe installation
RUN pnpm install --frozen-lockfile

# Copy the remaining project source code
COPY . .

# CRITICAL: Validate TypeScript, syntax rules, and execute Turbo tests
# If this command breaks, the entire Docker build will cleanly abort.
RUN turbo test

# Build frontends via Turborepo
RUN pnpm turbo build

# ==========================================
# STAGE 2: Build and Publish .NET 9 Backend
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-publish
WORKDIR /src

# Copy project files from root context
COPY apps/AyalasLanguageAPI/ ./apps/AyalasLanguageAPI/
WORKDIR /src/apps/AyalasLanguageAPI

# Restore and publish the self-contained production assemblies
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

# Configure execution folder privileges for non-root systems
USER root
RUN mkdir -p /app/data && chown -R $APP_UID:$APP_UID /app/data
USER $APP_UID

# 1. Pull the compiled .NET binaries
COPY --from=backend-publish /app/publish .

# 2. Map the User Web Front-End Static assets into the server delivery footprint
COPY --from=frontend-env /src/apps/AyalasLanguageWeb/dist ./dist

# 3. Map the Admin Portal Web static assets into the server delivery footprint
COPY --from=frontend-env /src/apps/AyalasLanguageWebAdmin/admin ./admin

EXPOSE 5000
ENTRYPOINT [ "dotnet", "AyalasLanguageAPI.dll" ]
