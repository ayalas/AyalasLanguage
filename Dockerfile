# ==========================================
# STAGE 1: Build the Frontend (Local Context)
# ==========================================
FROM node:22-alpine AS frontend-env
WORKDIR /src
RUN npm install -g pnpm turbo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/AyalasLanguageWeb/package.json ./apps/AyalasLanguageWeb/
COPY apps/AyalasLanguageWebAdmin/package.json ./apps/AyalasLanguageWebAdmin/
RUN pnpm install --frozen-lockfile
COPY . .
RUN turbo test
RUN pnpm turbo build

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
