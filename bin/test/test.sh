#!/usr/bin/env bash
#
# Created by vcernomschi on 10/06/2015
#

source $(dirname $0)/_head.sh

######################
### Run unit tests ###
######################
__CMD="npm run test"
if [ ${e2e} != 'no' ]; then
    subpath_run_cmd "${__SRC_PATH}" "${__CMD}"
else
  echo "E2E is NO. Skipping posttest..."
fi