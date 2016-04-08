#!/usr/bin/env bash
#
# Created by vcernomschi on 10/06/2015
#

echo "TRAVIS_NODE_VERSION: ${TRAVIS_NODE_VERSION}"

if [[ ${TRAVIS_NODE_VERSION} == 5.* ]]; then
   echo "My version: ${TRAVIS_NODE_VERSION}"

    npm install -g phantomjs@2.1.3
else
    echo "My version: ${TRAVIS_NODE_VERSION}"
    #fix for issue: https://github.com/Medium/phantomjs/issues/430#issuecomment-174038299
    npm config set unsafe-perm false
    npm install -g phantomjs@1.9.18
    npm config set unsafe-perm true
fi