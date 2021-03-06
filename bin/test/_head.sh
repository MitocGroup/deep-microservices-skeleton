#!/usr/bin/env bash
#
# Created by vcernomschi on 10/06/2015
#

#####################################
### Initializing global variables ###
#####################################
__SCRIPT_PATH=$(cd $(dirname $0); pwd -P)
__SRC_PATH="${__SCRIPT_PATH}/../../src/"
__COVERAGE_PATH="${__SCRIPT_PATH}/../coverages/local/${TRAVIS_REPO_SLUG}/${TRAVIS_BRANCH}/summary-report"
__VARS_FILE_PATH="${__SCRIPT_PATH}/_vars.sh"
__NONE="none"
__BACKEND="backend"
__FRONTEND="frontend"
__IS_CONCURRENT_SCRIPT=${__NONE}
__E2E_WITH_PUBLIC_REPO="public"
__E2E_WITH_PRIVATE_REPO="private"
__TRAVIS_NODE_MAJOR_VERSION="${TRAVIS_NODE_VERSION:0:1}"
__UPPER_CASE_TRAVIS_BRANCH=`echo "$TRAVIS_BRANCH" | tr '[:lower:]' '[:upper:]'`
__CODECLIMATE_TOKEN_NAME="CODECLIMATE_REPO_TOKEN_${__UPPER_CASE_TRAVIS_BRANCH}"

######################################################
### Import the initialized vars with changed stuff ###
######################################################
if [ "$TRAVIS" == "true" ] && [ -e "$__VARS_FILE_PATH" ]; then
  source "$__VARS_FILE_PATH"
fi

#############################################################################
### Checks if all environment variables available for validating coverage ###
### Arguments:                                                            ###
###   None                                                                ###
### Returns:                                                              ###
###   0 or 1                                                              ###
#############################################################################
IS_ENV_VARS_AVAILABLE () {
  if [ -z $GITHUB_OAUTH_TOKEN ] || \
    [ -z $AWS_ACCESS_KEY_ID ] || [ -z AWS_SECRET_ACCESS_KEY ] || \
    [ -z $AWS_DEFAULT_REGION ] || [ -z $AWS_S3_BUCKET ]; \
  then
    echo 0;
    return;
  fi

  echo 1;
}

#################################################################
### Checks if codeclimate token available for specific branch ###
### Arguments:                                                ###
###   None                                                    ###
### Returns:                                                  ###
###   0 or 1                                                  ###
#################################################################
IS_CODECLIMATE_TOKEN_AVAILABLE () {

  if [ -z `printenv $__CODECLIMATE_TOKEN_NAME` ]; then
    echo 0;

    return;
  fi

  echo 1;
}



#######################################################################################
### Executes frontend/backend commands for subpaths with/without parallelizing mode ###
### Arguments:                                                                      ###
###   DIR                                                                           ###
###   BACKEND_CMD                                                                   ###
###   FRONTEND_CMD                                                                  ###
###   IS_CONCURRENT_SCRIPT                                                          ###
### Returns:                                                                        ###
###   None                                                                          ###
#######################################################################################
subpath_run_cmd () {
  local DIR
  local BACKEND_CMD
  local FRONTEND_CMD
  local SEARCH_VALUE
  local REPLACE_VALUE
  local PATH_TO_COVERAGE_FILE

  DIR=$(cd $1 && pwd -P)

  TEST_FRONTEND_PATH="tests/frontend/"
  TEST_BACKEND_PATH="tests/backend/"

  BACKEND_CMD=$2

  ##########################################################
  ### set __BACKEND_MODULES[] which need to install/test ###
  ##########################################################
  if [ -z "$BACKEND_MICROAPP_PATHS" ]; then
    i=0;
    for subpath in $DIR/*/$TEST_BACKEND_PATH
    do
      __BACKEND_MODULES[i]=$subpath
      i=$((i+1))
    done

  else
    EXPR=(${BACKEND_MICROAPP_PATHS//,/ })

    for i in "${!EXPR[@]}"
    do
      __BACKEND_MODULES[i]=$DIR/${EXPR[i]}/$TEST_BACKEND_PATH
    done
  fi

  ###########################################################
  ### set __FRONTEND_MODULES[] which need to install/test ###
  ###########################################################
  if [ -z "$FRONTEND_MICROAPP_PATHS" ]; then
    i=0;
    for subpath in $DIR/*/$TEST_FRONTEND_PATH
    do
      __FRONTEND_MODULES[i]=$subpath
      i=$((i+1))
    done

  else
    EXPR=(${FRONTEND_MICROAPP_PATHS//,/ })

    for i in "${!EXPR[@]}"
    do
      __FRONTEND_MODULES[i]=$DIR/${EXPR[i]}/$TEST_FRONTEND_PATH
    done
  fi

  ##############################
  ### Set paralellizing mode ###
  ##############################
  if [ -z "${4}" ]; then
    echo "PARALLELIZING DISABLED"
    __IS_CONCURRENT_SCRIPT=${__NONE}
  else
    __IS_CONCURRENT_SCRIPT=$4
    echo "PARALLELIZING ENABLED FOR: ${__IS_CONCURRENT_SCRIPT}"
  fi

  ###########################################################
  ### Set command for frontend if didn't pass as agrument ###
  ###########################################################
  if [ -z "${3}" ]; then
    FRONTEND_CMD="${BACKEND_CMD}"
  else
    FRONTEND_CMD="${3}"
  fi

  ##################################################
  ### run always for frontend to gather coverage ###
  ##################################################
  for subpath in "${__FRONTEND_MODULES[@]}"
  do
    echo "[Running command for frontend] $subpath"
    if [ -d ${subpath} ]; then
      cd ${subpath} && eval_or_exit "${FRONTEND_CMD}"

      ####################################################################################################
      ### replace ./frontend to absolute file path to fix karma issue after combining coverage reports ###
      ####################################################################################################
      if [ "${FRONTEND_CMD}" == "npm run test" ]; then
        SEARCH_VALUE='\.\/frontend\/'
        subpath=${subpath/tests\/frontend/frontend}

        #######################################################
        ### Escape path for sed using bash find and replace ###
        #######################################################
        REPLACE_VALUE="${subpath//\//\\/}"

        export PATH_TO_TEST_TDF_FILE="$(find ./coverage -name 'coverage-final.json')"
        sed "s/${SEARCH_VALUE}/${REPLACE_VALUE}/g" "${PATH_TO_TEST_TDF_FILE}" > ./coverage/report.json
      fi
    fi
  done

  #############################
  ### run tests for backend ###
  #############################
  if [ "$__IS_CONCURRENT_SCRIPT" == "$__NONE" ] || [ "$__IS_CONCURRENT_SCRIPT" == "$__BACKEND" ]; then

    for subpath in "${__BACKEND_MODULES[@]}"
    do
      echo "[Running command for backend] $subpath"
      if [ -d ${subpath} ]; then
        cd ${subpath} && eval_or_exit "${BACKEND_CMD}"
      fi
    done
  fi
}

########################################
### Executes command and show result ###
### Arguments:                       ###
###   CMD                            ###
### Returns:                         ###
###   0 or 1                         ###
########################################
eval_or_exit() {
  local RET_CODE

  echo $1
  eval "$1"
  RET_CODE=$?

  if [ ${RET_CODE} == 0 ]; then
    echo "[SUCCEED] $1"
  else
    echo "[FAILED] $1"
    exit 1
  fi
}

#####################################################################################
### Checks if deep-package-magager has latest version otherwise reinstall deepify ###
### Arguments:                                                                    ###
###   None                                                                        ###
### Returns:                                                                      ###
###   None                                                                        ###
#####################################################################################
CHECK_DEEP_PACKAGE_MANAGER() {
  local CURRENT_DPM_VERSION
  local LATEST_DPM_VERSION

  LATEST_DPM_VERSION=`npm show deep-package-manager version`
  CURRENT_DPM_VERSION=`npm list -g --depth=3 | grep deep-package-manager | cut -d"@" -f 2`

  if [ "${LATEST_DPM_VERSION}" != "${CURRENT_DPM_VERSION}" ]; then
    echo "Reinstall deepify due to deep-package-manager updates"
    `npm install -g deepify`
  fi
}
