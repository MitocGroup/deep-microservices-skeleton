#!/usr/bin/env bash
#
# Created by vcernomschi on 10/06/2015
#

source $(dirname $0)/_head.sh

#####################
### To be updated ###
#####################
(npm list -g deepify@$(npm show deepify version) --depth=0 || npm install -g deepify) &&\
(npm list -g jspm --depth=0 || npm install -g jspm@0.16.15)  &&\
(npm list -g browserify --depth=0 || npm install -g browserify@11.2.x) &&\
(npm list -g jscs --depth=0 || npm install -g jscs@2.1.x) &&\
(npm list -g mocha --depth=0 || npm install -g mocha@2.3.x) &&\
(npm list -g codacy-coverage --depth=0 || npm install -g codacy-coverage@1.1.x) &&\
(npm list -g chai --depth=0 || npm install -g chai@3.3.x) &&\
(npm list -g jasmine-core --depth=0 || npm install -g jasmine-core@2.3.x) &&\
(npm list -g istanbul --depth=0 || npm install -g istanbul@0.3.x) &&\
(npm list -g istanbul-combine --depth=0 || npm install -g istanbul-combine@0.3.x) &&\
(npm list -g karma --depth=0 || npm install -g karma@0.13.x) &&\
(npm list -g karma-jspm --depth=0 || npm install -g karma-jspm@2.0.x) &&\
(npm list -g karma-jasmine --depth=0 || npm install -g karma-jasmine@0.3.x) &&\
(npm list -g karma-babel-preprocessor --depth=0 || npm install -g karma-babel-preprocessor@5.2.x) &&\
(npm list -g karma-coverage@douglasduteil/karma-coverage#next --depth=0 || npm install -g karma-coverage@douglasduteil/karma-coverage#next) &&\
(npm list -g karma-verbose-reporter --depth=0 || npm install -g karma-verbose-reporter@0.0.x) &&\
(npm list -g karma-phantomjs-launcher --depth=0 || npm install -g karma-phantomjs-launcher@0.2.x) &&\
(npm list -g karma-ng-html2js-preprocessor --depth=0 || npm install -g karma-ng-html2js-preprocessor@0.2.x) &&\
(npm list -g node-dir --depth=0 || npm install -g node-dir) &&\
#######################################
### TODO: Get rid of echo 'isparta' ###
#######################################
(if [ -d "node_modules/isparta" ]; then echo "isparta"; else npm install isparta@3.1.x; fi) &&\
(if [ -d "node_modules/sync-exec" ]; then echo "sync-exec"; else npm install sync-exec@^0.6.x; fi) &&\
(if [ -d "node_modules/fs-extra" ]; then echo "fs-extra"; else npm install fs-extra@0.x.x; fi)


#####################
### To be updated ###
#####################
if [ -z $TRAVIS_BUILD_NUMBER ]; then
    echo "Running locally - no need to jspm config"
else
    echo "Running in CI - configuring jspm registries"
    jspm config registries.github.auth $JSPM_GITHUB_AUTH_TOKEN
    git config --local url.https://github.com/.insteadOf git://github.com/
fi

###################################
### TODO: Refactor and simplify ###
###################################
if [ "${__E2E_WITH_PUBLIC_REPO}" = "${E2E_TESTING}" ] || [ "${__E2E_WITH_PRIVATE_REPO}" = "${E2E_TESTING}" ]; then
  bash `dirname $0`/protractor.sh

  ###############################################################
  ### Install locally, protractor doesn't find babel globally ###
  ###############################################################
  (if [ -d "node_modules/babel-cli" ]; then echo "babel-cli"; else npm install babel-cli; fi) &&\
  (if [ -d "node_modules/babel-preset-es2015" ]; then echo "babel-preset-es2015"; else npm install babel-preset-es2015; fi) &&\
  (if [ -d "node_modules/babel-plugin-add-module-exports" ]; then echo "babel-plugin-add-module-exports"; else npm install babel-plugin-add-module-exports; fi) &&\
  (if [ -d "node_modules/jasmine2-custom-message" ]; then echo "jasmine2-custom-message"; else npm install jasmine2-custom-message@0.8.x; fi) &&\
  (if [ -d "node_modules/jasmine-utils" ]; then echo "jasmine-utils"; else npm install jasmine-utils@0.2.x; fi)
fi

###################################
### TODO: Refactor and simplify ###
###################################
GIT_URL=`git config --get remote.origin.url`
SKELETON_URL="https://github.com/MitocGroup/deep-microservices-skeleton"
if [ "${GIT_URL}" == "${SKELETON_URL}" ]; then
  sh $(dirname $0)/skeleton-install.sh
fi

#####################
### To be updated ###
#####################
bash `dirname $0`/phantomjs.sh

if [ "$TRAVIS" == "true" ]; then
  ##########################################################################################
  ### Resolving detached HEAD error by attaching HEAD to the `TRAVIS_FROM_BRANCH` branch ###
  ##########################################################################################
  TRAVIS_FROM_BRANCH="travis_from_branch"
  git branch $TRAVIS_FROM_BRANCH
  git checkout $TRAVIS_FROM_BRANCH
  git fetch origin $TRAVIS_BRANCH
  git checkout -qf FETCH_HEAD
  git branch $TRAVIS_BRANCH
  git checkout $TRAVIS_BRANCH
  git checkout $TRAVIS_FROM_BRANCH
fi

#####################
### To be updated ###
#####################
deepify compile es6 $(dirname $0)/GitDiffWalker.es6 --source > $(dirname $0)/GitDiffWalker.js
node $(dirname $0)/GitDiffWalker.js
