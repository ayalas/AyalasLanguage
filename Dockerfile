# ==========================================
# STAGE 1: Unified Build Environment (SDK + Node)
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build-env
WORKDIR /src

# 1. Install Node.js and pnpm
COPY --from=node:22-alpine /usr/lib /usr/lib
COPY --from=node:22-alpine /usr/local/lib /usr/local/lib
COPY --from=node:22-alpine /usr/local/include /usr/local/include
COPY --from=node:22-alpine /usr/local/bin /usr/local/bin

RUN npm install -g pnpm turbo

# 3. Copy monorepo configuration (including the NEW mobile app)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/AyalasLanguageWeb/package.json ./apps/AyalasLanguageWeb/
COPY apps/AyalasLanguageWebAdmin/package.json ./apps/AyalasLanguageWebAdmin/
COPY apps/ayalaslanguageapp/package.json ./apps/ayalaslanguageapp/ 

# 4. Install frontend dependencies
ENV CI=true
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------
# .NET Restore
# ---------------------------------------------------
COPY AyalasLanguage.sln ./
RUN dotnet sln AyalasLanguage.sln remove extras/Tryouts/Tryouts.csproj

COPY apps/AyalasLanguageAPI/*.csproj ./apps/AyalasLanguageAPI/
COPY dotnet-libs/AyalasLanguageAPI.Data/*.csproj ./dotnet-libs/AyalasLanguageAPI.Data/
COPY dotnet-libs/AyalasLanguageAPI.Data.Migrations.SQLite/*.csproj ./dotnet-libs/AyalasLanguageAPI.Data.Migrations.SQLite/
COPY dotnet-libs/AyalasLanguageAPI.Data.Migrations.MySQL/*.csproj ./dotnet-libs/AyalasLanguageAPI.Data.Migrations.MySQL/
COPY dotnet-libs/AyalasLanguageJobs/*.csproj ./dotnet-libs/AyalasLanguageJobs/

RUN dotnet restore

# 5. Copy full source
COPY . .

# 6. Run Turbo builds
# This will build the Public Web, Admin Web, and now the Mobile Web (Expo)
RUN pnpm turbo test
RUN STACK_ENV=${STACK_ENV} \
    EXPO_PUBLIC_STACK_ENV=${STACK_ENV} \
    NODE_ENV=production \
    pnpm turbo build

# 7. Publish .NET Backend
WORKDIR /src/apps/AyalasLanguageAPI
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

USER root
RUN mkdir -p /app/data && chown -R $APP_UID:$APP_UID /app/data
USER $APP_UID

# Copy Backend artifacts
COPY --from=build-env /app/publish .

# Copy Frontend artifacts
# 1. Public (Root)
COPY --from=build-env /src/apps/AyalasLanguageWeb/dist ./dist
# 2. Admin (/admin)
COPY --from=build-env /src/apps/AyalasLanguageWebAdmin/admin ./admin
# 3. Mobile (/mobile)
COPY --from=build-env /src/apps/ayalaslanguageapp/static ./mobile 

EXPOSE 5000
ENTRYPOINT [ "dotnet", "AyalasLanguageAPI.dll" ]