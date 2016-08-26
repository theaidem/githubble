FROM ubuntu
MAINTAINER Kokorin Max "kokorin.max@gmail.com"

RUN apt-get install -y ca-certificates
COPY githubble /app/
COPY .env /app/
WORKDIR /app

EXPOSE 3000
ENTRYPOINT ["./githubble"]
