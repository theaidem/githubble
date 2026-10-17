APPNAME = githubble

build.local:
	@go build -o $(APPNAME)
	@echo "build: OK"

build.linux:
	@GOOS=linux GOARCH=amd64 go build -o $(APPNAME)
	@echo "build: OK"

run:
	@./$(APPNAME)

test:
	@go test ./...

clean:
	@rm -f $(APPNAME)
	@echo "clean: OK"

.PHONY: build.local build.linux run test clean
