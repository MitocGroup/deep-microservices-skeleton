#!/usr/bin/env bash
#
# Created by vcernomschi on 10/06/2015
#

source $(dirname $0)/_head.sh

########################
### Install NPM deps ###
########################
__CMD="npm install"

echo "Running install dependecies for: ${1}"

subpath_run_cmd "${__SRC_PATH}" "$__CMD" "$__CMD" ${1}

if [ "${1}"="backend" ]; then

  # To disable interactive user interaction like prompts in terminal (an default value is always chosen)
  export DEEP_NO_INTERACTION=1

  #install also front for repos with e2e enabled
  if [ "${__TRAVIS_NODE_MAJOR_VERSION}" != "5" ] && [ "${__TRAVIS_NODE_MAJOR_VERSION}" != "6" ] && \
   ([ "${__E2E_WITH_PUBLIC_REPO}" = "${E2E_TESTING}" ] || ([ "${__E2E_WITH_PRIVATE_REPO}" = "${E2E_TESTING}" ] && [ ${TRAVIS_BRANCH} = 'stage' ])); then
    subpath_run_cmd "${__SRC_PATH}" "$__CMD" "$__CMD" "frontend"
  fi

  echo "Initializing backend"
  cp src/deeploy.example.json src/deeploy.json &&\
  deepify init-backend ./src
fi
