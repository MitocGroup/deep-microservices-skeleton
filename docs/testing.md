Testing
========

> Before testing please read about  [Testing Use Cases](https://github.com/MitocGroup/deep-microservices-skeleton/blob/master/docs/testing_use_cases.md)
         
## Getting Started

### Step 1. Generate backend tests

```bash
git clone git@github.com:MitocGroup/deep-microservices-skeleton.git
```
> Clone skeleton

```bash
cd deep-microservices-skeleton && ./bin/tools/skeleton-install.sh
```

> Install skeleton dependencies

```bash
cd .. && git clone https://github.com/MitocGroup/deep-microservices-helloworld.git
```

> Clone your project

```bash
./deep-microservices-skeleton/bin/tools/repository_update.sh ./deep-microservices-helloworld/
```

> To generate backend unit tests select `backend unit test` option 


Generated tests consist from below files:

- [ ] `handler.spec.js` - need to add unit tests here, because has only skeleton for tests
- [x] `bootstrap.spec.js` - no need to add unit tests (LoC - 100 %)
- [x] `functional.spec.js` - used by Devs or QAs as black box testing

> Takes input payload from test-asserts folder (file name convention: `*.payload.json`) , 
executes `deepify run lambda` about 10s for one payload and checks if lambda result equals to expected result (file name convention: `*.result.json`)

Q1. How to ignore some keys/nested key?

A1. In `*.result.json` you can specify output result keys to ignore. 
	
For example:

```json
{
  "_ignore": [ "db.fs", "validationErrors"],
	"db": {
    "Name": "Input Value"
  }
} 
```

> Checks if lambda response equals to `{ "db": { "Name": "Input Value" } }` and ignores `validationErrors` key and `fs` key from db object.

	
### Step 2. Prepare lambdas and backend tests. 

> All commands from steps 2-3 should be run from project root folder.
		
#### Option 1.

> To prepare lambdas and install backend test dependencies for specific micro application)

Install lambda dependencies and transpile ES6:  

```bash
deepify compile dev ./src
```

Install backend tests dependencies for specific micro application: 

```bash
cd src/deep-hello-world/tests/backend/ && npm install
```
		
#### Option 2.

> To prepare lambdas and install dependencies for all backend tests:

```bash
./bin/test/install.sh "backend"
```

### Step 3. Run tests & gather coverage

#### Option 1.

> To execute backend test dependencies for specific micro application
 
```bash
cd src/deep-hello-world/tests/backend/ && npm run test
```
		
#### Option 2.

> To execute all backend tests

```bash
./bin/test/test.sh "backend"
```

> To see full coverage report use `[ci full]` in commit message:

```bash
git commit -m "Gather coverage [ci full]"
```

> Backend coverage report is located in `micro-app-name/tests/frontend/coverage`

> Frontend coverage report is located in `micro-app-name/tests/backend/coverage`
