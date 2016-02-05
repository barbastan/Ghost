##==============================================================================================
##
## Background
## ==========
##
## This is a hybrid build of Ghost.  Platform-independent parts are built on the
## development machine and are copied into the Docker image.  Platform-dependent
## parts are built by Docker.
##
##
## Prerequisites
## =============
##
##  - Must be using a supported version of node.  The only versions supported
##    by ghost-0.76 are node-0.10, node-0.12, and node-4.2.  This Dockerfile
##    uses version 4.2, so that's what the development machine should use too.
##  - To easily install and switch between different versions of node, install
##    either using "n" (OSX) or "nodist" (Windows) on the development machine.
##    Alternatives are "nvm" (OSX) and "nvmw" (Windows).
##  - The npm module "grunt-cli" must be installed globally.  To install it,
##    use "sudo npm install grunt-cli -g".
##
##
## Preparation
## ===========
##
##   From home directory or some other conveient directory:
##
##     $ git clone git://github.com/tryghost/ghost.git
##
##     $ cd ghost
##     $ npm install
##     $ grunt init
##     $ grunt prod
##
## NOTES:
##   - All the above steps are necessary.
##   - Must do non-production "npm install" to install development tools (such as
##     grunt and bower).
##   - The grunt commands necessary to build some Javascript files; without them,
##     you get error "Javascript files have not been built" when attempting to run
##     the container.
##   - When building on Windows, it is much faster to run the grunt commands from
##     an elevated command prompt.  For some reason, Ember run slowly from an
##     ordinary command prompt.
##
##
## Building the Container
## ======================
##
##   From ghost directory:
##
##     $ docker build -t my-ghost .
##
##
## Running the Container
## =====================
##
##   From ghost directory:
##
##     $ docker run -p 80:2368 my-ghost
##
##   Then, in browser, visit:
##      http://192.168.99.100         for welcome page
##      http://192.168.99.100/ghost   for signup/signin page
##
##   NOTES:
##     - These instructions are for running on OSX or Windows with the latest version
##       of Docker (which uses docker-machine as its virtual machine).
##     - The IP address for the virtual machine will be different if running the older
##       version of Docker which uses boot2docker.
##     - For convenience, add "192.168.99.100 docker" to either /etc/hosts (OSX) or
##       C:\Windows\System32\drivers\etc\hosts (Windows).
##
##==============================================================================================

FROM node:4.2

COPY . /ghost

WORKDIR /ghost

RUN \
  npm install --production && \
  useradd ghost --home /ghost

EXPOSE 2368

CMD npm start --production
