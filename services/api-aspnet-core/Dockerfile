# syntax=docker/dockerfile:1.6
# Build: .NET 8 SDK. Runtime: aspnet:8.0, non-root.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY App/19-aspnet-core.csproj App/
RUN dotnet restore App/19-aspnet-core.csproj
COPY App/ App/
RUN dotnet publish App/19-aspnet-core.csproj -c Release -o /app/out --no-self-contained

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out ./
ENV PORT=8080
EXPOSE 8080
# I-19: the aspnet image ships a non-root 'app' user (uid 1654).
USER app
ENTRYPOINT ["dotnet", "19-aspnet-core.dll"]
