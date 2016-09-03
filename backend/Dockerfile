FROM ubuntu
MAINTAINER Kokorin Max "kokorin.max@gmail.com"

RUN apt-get update && apt-get install -y ca-certificates
WORKDIR /app

EXPOSE 3000
ENTRYPOINT ["./githubble"]
