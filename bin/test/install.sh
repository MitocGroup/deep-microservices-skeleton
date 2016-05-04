#!/usr/bin/env bash
#
# Created by vcernomschi on 10/06/2015
#

source $(dirname $0)/_head.sh

########################
### Install NPM deps ###
########################
__CMD="npm install"

subpath_run_cmd "${__SRC_PATH}" "$__CMD" "$__CMD" ${0}

if [ -z "${0}" ] && [ "${0}"="backend" ]; then
  echo "Initializing backend"
  cp src/deeploy.example.json src/deeploy.json &&\
  deepify init-backend ./src
fi
