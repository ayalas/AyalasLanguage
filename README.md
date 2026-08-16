This is a language learning app demo project.

Students choose their known and target language, and go through exercises contributed by themselves and others in this specific learning path.

This project is designed to demonstrate both backend and frontend capabilies.
It includes a private messaging module, private and shared content, background services (for jobs), PWA installation option (for fullscreen experience), a React frontend and a React Native frontend with Android builds in GitHub releases.

AyalasLanguageAPI - Backend is implemented with ASP.Net Core Minimal APIs, Entity Framework and SQLite\MySQL.
AyalasLanguageWEB - Frontend implemented with React, Vite and TypeScript
AyalasLanguageWebAdmin - Admin Frontend implemented with React, Vite and TypeScript
AyalasLanguageApp - React Native mobile app, sharing logic with AyalasLanguageWEB through the packages\types project.

## Demo Site (Production)
Served using Docker and Caddy with an internal MySQL container in this address:
https://langapp.xyz/

In the profile page after registering and logging in choose to learn Danish or Arabic.

## Dev environment
To stage this app in the development environment:

Create and authorize locally these files for https://localhost (https can be required for some client side integrations) with https://mkcert.org/. Generate a pfx file from them by https://www.openssl.org/ (see instructions below under Https support). Place the three files at:
local_certs\localhost+2-key.pem
local_certs\localhost+2.pem
local_certs\langapp_local.pfx

In the root folder, run:
pnpm install

and then:
turbo run

Browse to the url provided by vite https://localhost:5174

## Https support
As a prerequisite for staging a development environment, there is a need to support HTTPS, since this project may use client side integrations which require https.

Here are the instructions how to generate and authorize the necessary certificate files,
which are not provided with the code:
These instructions walk you through creating a locally-trusted development certificate using **mkcert**, converting it to the Windows/Dotnet-compatible **PFX** format using **OpenSSL**, and finally importing it into the **.NET dev-certs** store.

### Prerequisites
*   **mkcert** installed ([Instructions](https://github.com/FiloSottile/mkcert#installation))
*   **OpenSSL** installed (Commonly included in Git Bash or available via Chocolatey/Winget)
*   **.NET SDK** installed

---

### Step 1: Generate and Authorize PEM Files with mkcert
First, you must install the mkcert Local Certificate Authority (CA) into your system trust store and then generate the PEM files.

1.  **Install the Local CA:**
    Open your terminal (PowerShell or Command Prompt) and run:
    ```powershell
    mkcert -install
    ```
    *This "authorizes" mkcert by adding a root certificate to your machine so your browser and OS trust any certificates mkcert creates.*

2.  **Generate the PEM files:**
    Create the `local_certs` directory if it doesn't exist, then generate the certificates for `localhost`:
    ```powershell
    mkdir local_certs
    mkcert -key-file local_certs\localhost+2-key.pem -cert-file local_certs\localhost+2.pem localhost 127.0.0.1 ::1 [your external ip - for the native app]
    ```

---

### Step 2: Convert to PFX with OpenSSL
.NET applications typically prefer the `.pfx` (PKCS#12) format which bundles the certificate and private key into one file.

1.  **Run the export command:**
    ```powershell
    openssl pkcs12 -export -out langapp_local.pfx -inkey local_certs\localhost+2-key.pem -in local_certs\localhost+2.pem
    ```
2.  **Set a Password:**
    OpenSSL will prompt you for an "Export Password." 
    *   **Crucial:** You must provide a password (e.g., `crypticpassword`). Do not leave it blank, as the `.NET` import tool often fails with empty passwords.

---

### Step 3: Authorize the PFX File with dotnet
To make the .NET runtime (Kestrel) recognize this specific certificate as its "Developer Certificate," store the secrets using the secret manager:

dotnet user-secrets set "Kestrel:Endpoints:httpsDefault:Certificate:Password" "password set with openssl"

## Publish to the new environment using local Docker image building
run ./deploy-full.ps1

## Publish to (the old) AWS Beanstalk environment-like, MySQL database enabled, with a powershell script

run build.bat from windows explorer, or run the following powershell script in the terminal, from the solution root:
powershell -NoProfile -ExecutionPolicy Bypass -File ".\build.ps1"

a zip file ready for deployment will be created on the same folder

## Multi DB provider EF migrations setup - MySQL and SQLite
After a db schema change-

1. change connection strings to the one for MYSQL db provider in appsettings.Development.json (see Dummy Connection String for MySQL below)
2. Setup and run the MySQL dotnet ef migrations add command from the solution root
dotnet ef migrations add ***Yout change***MySQL --context AyalasLanguageDbContext --project AyalasLanguageAPI.Data.Migrations.MySQL --startup-project AyalasLanguageAPI --namespace AyalasLanguageAPI.Data.Migrations.MySQL
3. change back the connection strings in appsettings.Development.json
4. Setup and run the SQLite dotnet ef migrations add command from the solution root
dotnet ef migrations add ***Yout change***SQLite --context AyalasLanguageDbContext --namespace AyalasLanguageAPI.Data.Migrations.SQLite --project AyalasLanguageAPI.Data.Migrations.SQLite --startup-project AyalasLanguageAPI

Dummy Connection String for MySQL
"ConnectionStrings": {
    "DefaultConnection": "Server=localhost;port=3306;database=my_dummy_db;user=root;password=my_secret_password;"
}

## License
Licensed under GNU v3 license to Ayala Swisa. See LICENSE file for details.

