Code Quality Process
========

## Getting Started

### Install eslint, plugins, pre-commit hook and codeclimate CLI.

```bash
npm install -g eslint
```
> Install ESLint

```bash
npm install -g tslint
```
> Install TSLint

```bash
npm install -g eslint-plugin-angular
npm install -g eslint-config-angular
```

> Install ESLint plugin for angular

```bash
npm install codelyzer
npm install tslint-eslint-rules
```

> Install `codelyzer` as set of tslint rules, recommended configuration which is based on the Angular 2 Style Guide
> Install `tslint-eslint-rules` to improve your TSLint with the missing ESLint Rules

```bash
composer install
```

> Install PHP coding styles (should be run from project root folder)

```bash
./bin/install_precommit.sh
```

> Install pre-commit hook (should be run from project root folder)

```bash
docker pull codeclimate/codeclimate
```

> Docker is required, because Code Climate CLI is distributed and run as a Docker image. 
To more details for setup Codeclimate CLI use [Codeclimate installation steps](https://github.com/codeclimate/codeclimate#installation)


## Usage
	
### How to run ESLint/TSLint validation locally. 

```bash
eslint .
```

```bash
tslint .
```

> Run ESLint/TSLint validation for whole project (should be run from project root folder)

```bash
eslint path/to/file
```

```bash
tslint path/to/file
```

> Run ESLint/TSLint validation only for one file

### How to fix issues automatically by ESLint. 

```bash
eslint --fix .
```

> Fix code issues for whole project (should be run from project root folder)

```bash
eslint --fix path/to/file
```

> Fix code issues only for one file

### How to setup ESLint in WebStorm

- Navigate to Javascript > Code Quality Tools > ESlint.
- Enable ESLint validation.
- Add path to ESLint package.
- Use configuration file specific for project.
- Apply and Ok.

![ESLint WebStorm setup](https://github.com/MitocGroup/deep-microservices-skeleton/blob/master/docs/ESLint_WebStorm_setup.png)

### How to setup TSLint in WebStorm
- Navigate to TypeScript > TSLint.
- Enable TSLint validation.
- Add path to TSLint package.
- Use configuration file specific for project.
- Apply and Ok.

![TSLint WebStorm setup](https://github.com/MitocGroup/deep-microservices-skeleton/blob/master/docs/TSLint_WebStorm_setup.png)
		
### How to run codeclimate on local

```bash
codeclimate -h
```
> See all options

```bash
codeclimate analyze -f json 
```

> Run codeclimate analyzing on local with reporting results in json format

```bash
codeclimate analyze  -e eslint -f json 
```

> Run only ESLint codeclimate analyzing on local with reporting results in json format 

```bash
CODECLIMATE_DEBUG=1 codeclimate analyze -f html > report.html 
```

>  Run codeclimate analyzing on local in debug mode with reporting results in html format	and store in report.html files
		
		
### Notes 

- [x] "off" or 0 - turn the rule off
- [x] "warn" or 1 - turn the rule on as a warning (doesn’t affect exit code)html)
- [x] "error" or 2 - turn the rule on as an error (exit code is 1 when triggered)

> Please use only number values because codeclimate validation fails for string one