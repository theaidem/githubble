# ---- build stage ----
FROM golang:1.26.9-alpine AS build
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /githubble .

# ---- runtime stage ----
FROM gcr.io/distroless/static:nonroot
WORKDIR /app
COPY --from=build /githubble /app/githubble
EXPOSE 3003
USER nonroot:nonroot
ENTRYPOINT ["/app/githubble"]
