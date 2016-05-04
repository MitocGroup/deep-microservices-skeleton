#!/usr/bin/env bash
#
# Created by vcernomschi on 10/06/2015
#

source $(dirname $0)/_head.sh

######################
### Run unit tests ###
######################
__CMD="npm run test"

echo "Running tests for: ${1}"

subpath_run_cmd "${__SRC_PATH}" "${__CMD}" "${__CMD}" ${1}
