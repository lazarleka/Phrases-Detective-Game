@echo off
setlocal

set MAVEN_VERSION=3.9.9
set BASE_DIR=%~dp0
set MAVEN_HOME=%BASE_DIR%.mvn\apache-maven-%MAVEN_VERSION%
set MAVEN_CMD=%MAVEN_HOME%\bin\mvn.cmd

if not exist "%MAVEN_CMD%" (
  echo Downloading Apache Maven %MAVEN_VERSION%...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $version='%MAVEN_VERSION%'; $base='%BASE_DIR%'; $mvnDir=Join-Path $base '.mvn'; $zip=Join-Path $mvnDir ('apache-maven-' + $version + '-bin.zip'); New-Item -ItemType Directory -Force -Path $mvnDir | Out-Null; if (Test-Path $zip) { Remove-Item $zip -Force }; & curl.exe --fail --location --ssl-no-revoke ('https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/' + $version + '/apache-maven-' + $version + '-bin.zip') --output $zip; Expand-Archive -Path $zip -DestinationPath $mvnDir -Force; Remove-Item $zip"
  if errorlevel 1 exit /b %errorlevel%
)

set MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true %MAVEN_OPTS%
call "%MAVEN_CMD%" %*
exit /b %errorlevel%
