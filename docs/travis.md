Continuous integration - Travis
===============================

## Travis configuration

### Travis language.
```bash
language: node_js
```
> Use JavaScript with Node.js

```bash
language: php
```
> Use PHP

### Travis sudo option
```bash
sudo: required
```
> Use sudo if need while CI. Need to take into account that different values for `sudo` change Travis [virtual environment types](https://docs.travis-ci.com/user/ci-environment/)

### Travis cache
```bash
cache:
  edge: true
  directories:
    - $(npm root -g)
    - node_modules
    - deep_modules
    - $(npm config get prefix)/bin
```
> Add to cache directories

### Travis branches
```bash
branches:
  only:
    - master
    - dev
    - stage
    - test
```
> Trigger continuous integration build for the mentioned branches.

### Before install stuff
```bash
before_install:
  - sudo rm -rf ~/.nvm
  - 'curl -sL "https://deb.nodesource.com/setup_${NODE_RELEASE}" | sudo -E bash -'
  - sudo apt-get install -y nodejs
  - cp bin/test/package.json .
```
> Install nodejs for projects with PHP language and copy package.json to root.

### Install stuff
> Notes:
> By default for projects using PHP travis installs all dependensies from `composer.json`.
> The default install script for projects using nodejs is: `npm install`

For microservices-* projects the following install stuff is executed:
- Install all dependencies from package.json
- Install protractor different version depending on node version (v4 vs v5)
- If e2e testing enabled, install protractor
- If jspm enabled, add JSPM_AUTH_TOKEN

### Before script staff
```bash
before_script:
    - npm run before
```
> This functionality is not used

### Test stuff
```bash
script:
  - composer test
```
> Run `test` script from `composer.json`

> Notes:
> By default test script for projects using PHP is: `phpunit`.
> The default test script for projects using nodejs is: `npm test`.

For microservices-* projects the following tests are executed:
- Triggeres frontend tests, if found
- Triggers backend tests, if found
- Triggers end-to-end tests, if found
-- Worflow process related to Sauce Labs

### After success build
```bash
after_success:
  - npm run coverage
```
> Send coverage to Codeclimate, AWS S3 if all environment variables configured
> Should be configured env vars: GITHUB_OAUTH_TOKEN, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME, AWS_DEFAULT_REGION, CODECLIMATE_REPO_TOKEN_MASTER, CODECLIMATE_REPO_TOKEN_DEV

### After build failure
```bash
after_failure:
    - npm run on-failure
```
> This functionality is not used

### After script
```bash
after_script:
  - npm run remove-coverage
```
> Remove temporary coverage files
