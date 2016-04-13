#!/usr/bin/env bash

source $(dirname $0)/_head.sh

time npm install -g babel@5.8.x &&\
time npm install -g deepify &&\
time npm install -g jspm@0.16.15 &&\
time npm install -g browserify@11.2.x &&\
time npm install -g jscs@2.1.x &&\
time npm install -g mocha@2.3.x &&\
time npm install -g codacy-coverage@1.1.x &&\
time npm install -g chai@3.3.x &&\
time npm install -g jasmine-core@2.3.x &&\
time npm install -g istanbul@0.3.x &&\
time npm install -g istanbul-combine@0.3.x &&\
time bash `dirname $0`/phantomjs/install.sh &&\
time npm install -g karma@0.13.x &&\
time npm install -g karma-jspm@2.0.x &&\
time npm install -g karma-jasmine@0.3.x &&\
time npm install -g karma-babel-preprocessor@5.2.x &&\
time npm install -g karma-coverage@douglasduteil/karma-coverage#next &&\
time npm install -g karma-verbose-reporter@0.0.x &&\
time npm install -g karma-phantomjs-launcher@0.2.x &&\
time npm install -g karma-ng-html2js-preprocessor@0.2.x &&\
time npm install isparta@3.1.x &&\
time jspm config registries.github.auth $JSPM_GITHUB_AUTH_TOKEN

if [ "${__E2E_WITH_PUBLIC_REPO}" = "${E2E_TESTING}" ] || [ "${__E2E_WITH_PRIVATE_REPO}" = "${E2E_TESTING}" ]; then
  time npm run protractor-install
  time npm install sauce-connect
  time sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
fi

if [ "${__E2E_WITH_PUBLIC_REPO}" = "${E2E_TESTING}" ]; then
  #this one only for public repos
  time npm run protractor-prepare
fi
