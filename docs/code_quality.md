Code Quality Process
========

## Getting Started

### Install eslint, plugins, pre-commit hook and codeclimate CLI.

```bash
npm install -g eslint
```
> Install ESLint

```bash
npm install -g eslint-plugin-angular
npm install -g eslint-config-angular
```

> Install ESLint plugin for angular

```bash
./bin/install_precommit.sh
```

> Install pre-commit hook (should be run from project root folder)

```bash
./bin/install_precommit.sh
```

> To install/setup Codeclimate CLI use [Codeclimate installation steps](https://github.com/codeclimate/codeclimate#installation)

## Usage
	
### How to run ESLint validation locally. 

```bash
eslint .
```

> Run ESLint validation for whole project (should be run from project root folder)

```bash
eslint path/to/file
```

> Run ESLint validation only for one file

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

- Navigate to Javascripts > Code Quality Tools > ESlint.
- Enable ESLint validation.
- Add path to ESLint package.
- Use configuration file specific for project.
- Apply and Ok.

![ESLint WebStorm setup](https://github.com/MitocGroup/deep-microservices-skeleton/blob/master/docs/ESLint_WebStorm_setup.png)
		
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