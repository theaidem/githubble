APPNAME = githubble
TOKEN = 

build: clean
	@go build -o $(APPNAME) -ldflags "-X main.token=$(TOKEN)"
	@echo build: OK!

clean:
	@rm -rf $(APPNAME)
	@echo clean: OK!

run:
	@./$(APPNAME)