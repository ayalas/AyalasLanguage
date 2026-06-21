This is a language learning app demo project.

Students choose their known and target language, and go through exercises contributed by themselves and others in this specific learning path.

This project is designed to demonstrate both backend and frontend capabilies.

AyalasLanguageAPI - Backend is implemented with ASP.Net Core Minimal APIs, Entity Framework and SQLite\MySQL.

AyalasLanguageWEB - Frontend implemented with React, Vite and TypeScript
AyalasLanguageWebAdmin - Admin Frontend implemented with React, Vite and TypeScript

## AWS Demo Site (Production)
Served by AWS Beanstalk with an external MySQL instance in this address:
https://langapp.xyz/

In the profile page after registering and logging in choose to learn Danish or Arabic.

## Dev environment
To stage this app in the development environment:

Create and authorize locally these files for https://localhost (https is required for Puter ai) with https://mkcert.org/. Generate a pfx file from them by https://www.openssl.org/ (see instructions below under Https support). Place the three files at:
cert\localhost+2-key.pem
cert\localhost+2.pem
cert\langapp_local.pfx

In the root folder, run:
pnpm install

and then:
turbo run

Browse to the url provided by vite https://localhost:5174

## Https support
As a prerequisite for staging a development environment, there is a need to support HTTPS, since this project uses Puter ai which requires https.

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
    Create the `cert` directory if it doesn't exist, then generate the certificates for `localhost`:
    ```powershell
    mkdir cert
    mkcert -key-file cert\localhost+2-key.pem -cert-file cert\localhost+2.pem localhost 127.0.0.1 ::1
    ```
    *Note: The `+2` in the filenames refers to the two additional names (IPs) added to the certificate.*

---

### Step 2: Convert to PFX with OpenSSL
.NET applications typically prefer the `.pfx` (PKCS#12) format which bundles the certificate and private key into one file.

1.  **Run the export command:**
    ```powershell
    openssl pkcs12 -export -out langapp_local.pfx -inkey cert\localhost+2-key.pem -in cert\localhost+2.pem
    ```
2.  **Set a Password:**
    OpenSSL will prompt you for an "Export Password." 
    *   **Crucial:** You must provide a password (e.g., `crypticpassword`). Do not leave it blank, as the `.NET` import tool often fails with empty passwords.

---

### Step 3: Authorize the PFX File with dotnet
To make the .NET runtime (Kestrel) recognize this specific certificate as its "Developer Certificate," you use the `dotnet dev-certs` tool.

1.  **Clean existing dev certs (Optional but Recommended):**
    If you have old developer certificates causing conflicts, clear them first:
    ```powershell
    dotnet dev-certs https --clean
    ```

2.  **Import the PFX file:**
    Use the password you created in Step 2:
    ```powershell
    dotnet dev-certs https --import langapp_local.pfx -p <YOUR_PASSWORD>
    ```

3.  **Apply Trust:**
    Finally, ensure the .NET tool acknowledges the trust status:
    ```powershell
    dotnet dev-certs https --trust
    ```

### Verification
You can verify the certificate is correctly installed in the store by running:
```powershell
dotnet dev-certs https --check
```
If successful, you will see: `A valid HTTPS certificate is already present.` Your .NET applications (ASP.NET Core) will now automatically use `langapp_local.pfx` for HTTPS on `localhost`.

## Docker commands (Staging)
To build and stage this app using Docker, from the root folder of the solution, run the docker file to build the image (note about env: a non-Development environment means the static files are served from the backend. Also, the path to sqlite changes and maps to the volume setup here):

docker build --build-arg BUILD_ENV=Staging -t ayalas-language-app -f AyalasLanguageAPI/Dockerfile .

then, to start the container with an external volume for the db, run:

docker run -d -p [::1]:8080:8080 -e ASPNETCORE_HTTP_PORTS=8080 --name ayalas-language-app -v ayalas-language-db:/app/data ayalas-language-app:latest

Then, browse to http://localhost:8080

UPDATE: the docker script is out of sync at the moment.

## Publish to an AWS Beanstalk environment, MySQL database enabled, with a powershell script

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

