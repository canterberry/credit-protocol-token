#!/usr/bin/env bash

set -e

main() {
  role_curl
  role_nodejs
}

log_task() {
  echo "TASK [$1 : $*] *****"
}

role_curl() {
  role_curl_tasks
}

role_curl_tasks() {
  role_curl_task_install
}

role_curl_task_install() {
  log_task curl install
  if [ ! -x "$(which curl)" ]; then
    sudo apt-get update
    sudo apt-get install curl -y
  fi
}

role_nodejs() {
  role_nodejs_variables
  role_nodejs_tasks
}

role_nodejs_variables() {
  [ -z "${NODEJS_VERSION}" ] && NODEJS_VERSION="9.11.1"
}

role_nodejs_tasks() {
  role_nodejs_task_create_directory
  role_nodejs_task_install_files
  role_nodejs_task_link_binaries
}

role_nodejs_task_create_directory() {
  log_task nodejs "create directory"
  if [ ! -d /opt/nodejs ]; then
    sudo mkdir -p /opt/nodejs
  fi
}

role_nodejs_task_install_files() {
  log_task nodejs "install files"
  if [ ! -x "/opt/nodejs/node-v${NODEJS_VERSION}-linux-x64/bin/node" ]; then
    (
      cd /opt/nodejs
      curl -fsSL "https://nodejs.org/dist/v${NODEJS_VERSION}/node-v${NODEJS_VERSION}-linux-x64.tar.xz" \
      | sudo tar xvJf -
      sudo chmod -fR a-w /opt/nodejs
    )
  fi
}

role_nodejs_task_link_binaries() {
  log_task nodejs "link binaries"
  for item in node npm; do
    sudo rm -f "/bin/${item}"
    sudo ln -s "/opt/nodejs/node-v${NODEJS_VERSION}-linux-x64/bin/${item}" "/bin/${item}"
  done
}

main
