# ==========================================
# STAGE 1: Unified Build Environment (SDK + Node)
# ==========================================
# We use the alpine version to match your final runtime and keep size down
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

# 4. Install frontend dependencies
ENV CI=true
RUN pnpm install --frozen-lockfile

# 5. Copy the rest of the source (Backend + Frontend)
COPY . .

# 6. Run Turbo commands (Now has access to both 'dotnet' and 'node')
RUN pnpm turbo test
RUN pnpm turbo build

# 7. Publish .NET Backend
WORKDIR /src/apps/AyalasLanguageAPI
RUN dotnet restore
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

# Set up permissions
USER root
RUN mkdir -p /app/data && chown -R $APP_UID:$APP_UID /app/data
USER $APP_UID

# Copy Backend artifacts
COPY --from=build-env /app/publish .

# Copy Frontend artifacts (from the unified build-env)
COPY --from=build-env /src/apps/AyalasLanguageWeb/dist ./dist
COPY --from=build-env /src/apps/AyalasLanguageWebAdmin/admin ./admin

EXPOSE 5000
ENTRYPOINT [ "dotnet", "AyalasLanguageAPI.dll" ]