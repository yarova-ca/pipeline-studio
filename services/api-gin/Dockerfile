FROM golang:1.25 AS build
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/bin/app .
FROM gcr.io/distroless/static-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=build /app/bin/app /app/app
# Industry compliance profiles are read at runtime from the working directory.
COPY --from=build /app/compliance /app/compliance
ENV PORT=8080
EXPOSE 8080
CMD ["/app/app"]
