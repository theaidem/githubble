FROM alpine:3.10
RUN apk add -U --no-cache ca-certificates
WORKDIR /app
ADD githubble /app
ADD .env /app
EXPOSE 3003
CMD ./githubble