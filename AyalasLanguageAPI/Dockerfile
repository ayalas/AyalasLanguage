# ==========================================
# STAGE 1: Build the Frontend (NPM)
# ==========================================
FROM node:22-alpine AS frontend-build
WORKDIR /src

# Copy package files first to leverage Docker caching
COPY AyalasLanguageWeb/package*.json ./
RUN npm install

# Copy the rest of the frontend source code and build it
COPY AyalasLanguageWeb/ .
RUN npm run build


# ==========================================
# STAGE 2: Build and Publish the .NET Backend
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS publish
WORKDIR /src

# Copy and restore .NET dependencies
COPY AyalasLanguageAPI/*.csproj ./AyalasLanguageAPI/
RUN dotnet restore ./AyalasLanguageAPI/AyalasLanguageAPI.csproj

# Copy the rest of the backend source and publish it
COPY AyalasLanguageAPI/ ./AyalasLanguageAPI/
WORKDIR /src/AyalasLanguageAPI
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false


# ==========================================
# STAGE 3: Final Combined Runtime Image
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS final
WORKDIR /app

ARG BUILD_ENV

ENV ASPNETCORE_ENVIRONMENT=$BUILD_ENV

# Setup data directory with correct permissions
USER root
RUN mkdir -p /app/data && chown -R $APP_UID:$APP_UID /app/data
USER $APP_UID

# 1. Copy the compiled .NET Backend binaries
COPY --from=publish /app/publish .

# 2. Copy the compiled Frontend static files
# (Adjust "dist" or "build" depending on what your npm framework outputs)
COPY --from=frontend-build /src/dist /app/dist

ENTRYPOINT [ "dotnet", "AyalasLanguageAPI.dll" ]