APPNAME = githubble

build.local: clean
	@go build -o $(APPNAME)
	@echo build: OK!

build.linux: clean
	@GOOS=linux GOARCH=amd64 go build -o $(APPNAME)
	@echo build: OK!

clean:
	@rm -rf $(APPNAME)
	@echo clean: OK!

run:
	@./$(APPNAME)
