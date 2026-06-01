This is a language learning app demo project.

Students choose their known and target language, and go through exercises contributed by themselves and others in this specific learning path.

This project is designed to demonstrate both backend and frontend capabilies.

AyalasLanguageAPI - Backend is implemented with ASP.Net Core Minimal APIs, Entity Framework and SQLite\MySQL.

AyalasLanguageWEB - Frontend implemented with React and JavaScript

## AWS Demo Site (Production)
Served by AWS Beanstalk with an external MySQL instance in this address:
https://AyalasLanguageDemo.eu-north-1.elasticbeanstalk.com

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

## License
Licensed under GNU v3 license. See LICENSE file for details.

