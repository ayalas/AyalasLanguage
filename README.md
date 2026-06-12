This is a language learning app demo project.

Students choose their known and target language, and go through exercises contributed by themselves and others in this specific learning path.

This project is designed to demonstrate both backend and frontend capabilies.

AyalasLanguageAPI - Backend is implemented with ASP.Net Core Minimal APIs, Entity Framework and SQLite\MySQL.

AyalasLanguageWEB - Frontend implemented with React and JavaScript

## AWS Demo Site (Production)
Served by AWS Beanstalk with an external MySQL instance in this address:
https://langapp.xyz/

In the profile page after registering and logging in choose to learn Danish or Arabic.

## Dev environment
To stage this app in the development environment:
For the backend, inside AyalasLanguageAPI, run:
dotnet build

and then:
dotnet run

Inside the frontend's folder, AyalasLanguageWeb run in the command line:
npm install

and then:
npm run dev

Browse to the url provided by vite http://localhost:5097

## Docker commands (Staging)
To build and stage this app using Docker, from the root folder of the solution, run the docker file to build the image (note about env: a non-Development environment means the static files are served from the backend. Also, the path to sqlite changes and maps to the volume setup here):

docker build --build-arg BUILD_ENV=Staging -t ayalas-language-app -f AyalasLanguageAPI/Dockerfile .

then, to start the container with an external volume for the db, run:

docker run -d -p [::1]:8080:8080 -e ASPNETCORE_HTTP_PORTS=8080 --name ayalas-language-app -v ayalas-language-db:/app/data ayalas-language-app:latest

Then, browse to http://localhost:8080

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
Licensed under GNU v3 license. See LICENSE file for details.

