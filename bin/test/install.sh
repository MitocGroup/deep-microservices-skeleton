#!/usr/bin/env bash
#
# Created by vcernomschi on 10/06/2015
#

source $(dirname $0)/_head.sh

########################
### Install NPM deps ###
########################
__CMD="npm install"

echo "Running install dependecies for: ${0}"

subpath_run_cmd "${__SRC_PATH}" "$__CMD" "$__CMD" ${0}

if [ -z "${0}" ] && [ "${0}"="backend" ]; then

  # To disable interactive user interaction like prompts in terminal (an default value is always chosen)
  export DEEP_NO_INTERACTION=1

  subpath_run_cmd "${__SRC_PATH}" "$__CMD" "$__CMD" "frontend"

  echo "Initializing backend"
  cp src/deeploy.example.json src/deeploy.json &&\
  deepify init-backend ./src
fi
