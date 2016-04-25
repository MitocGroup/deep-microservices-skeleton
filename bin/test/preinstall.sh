#!/usr/bin/env bash

source $(dirname $0)/_head.sh

npm install -g babel-cli@6.x.x &&\
npm install -g babel-preset-es2015
npm install -g babel-plugin-add-module-exports
npm install -g deepify &&\
npm install -g jspm@0.16.15 &&\
npm install -g browserify@11.2.x &&\
npm install -g jscs@2.1.x &&\
npm install -g mocha@2.3.x &&\
npm install -g codacy-coverage@1.1.x &&\
npm install -g chai@3.3.x &&\
npm install -g jasmine-core@2.3.x &&\
npm install -g istanbul@0.3.x &&\
npm install -g istanbul-combine@0.3.x &&\
npm install -g karma@0.13.x &&\
npm install -g karma-jspm@2.0.x &&\
npm install -g karma-jasmine@0.3.x &&\
npm install -g karma-babel-preprocessor@5.2.x &&\
npm install -g karma-coverage@douglasduteil/karma-coverage#next &&\
npm install -g karma-verbose-reporter@0.0.x &&\
npm install -g karma-phantomjs-launcher@0.2.x &&\
npm install -g karma-ng-html2js-preprocessor@0.2.x &&\
npm install isparta@3.1.x

if [ -v $TRAVIS_BUILD_ID ]; then
    jspm config registries.github.auth $JSPM_GITHUB_AUTH_TOKEN
else
    echo "Running locally - no need to jspm config"
fi

bash `dirname $0`/phantomjs/install.sh

if [ "${__E2E_WITH_PUBLIC_REPO}" = "${E2E_TESTING}" ] || [ "${__E2E_WITH_PRIVATE_REPO}" = "${E2E_TESTING}" ]; then
  bash `dirname $0`/protractor/install.sh

  #install locally, protractor doesn't find babel globally
  npm install babel-cli@6.x.x &&\
  npm install babel-preset-es2015 &&\
  npm install babel-plugin-add-module-exports &&\
  npm install jasmine2-custom-message@0.8.x
fi

if [ "${__E2E_WITH_PUBLIC_REPO}" = "${E2E_TESTING}" ]; then
  bash `dirname $0`/protractor/prepare.sh
fi