FROM golang:1.25 AS build
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/bin/app .
FROM gcr.io/distroless/static-debian12
COPY --from=build /app/bin/app /app
ENV PORT=8080
EXPOSE 8080
CMD ["/app"]
