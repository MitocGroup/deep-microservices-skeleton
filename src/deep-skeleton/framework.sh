#!/usr/bin/env bash
#
# Created by AlexanderC on 10/06/2015
#

FRAMEWORK_PATH=$(cd $(dirname $0); pwd -P)
FRAMEWORK_FILE="${FRAMEWORK_PATH}/Frontend/js/lib/deep-framework.js"

echo "Installing latest deep-framework from GitHub"
curl -L -XGET https://raw.github.com/MitocGroup/deep-framework/master/src/deep-framework/browser/framework.js -o "${FRAMEWORK_FILE}" -#
