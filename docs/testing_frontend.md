Testing
========

> Before testing please read about  [Testing Use Cases](https://github.com/MitocGroup/deep-microservices-skeleton/blob/master/docs/testing_use_cases.md)
         
## Getting Started

### Step 1. Generate frontend tests

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

> To generate frontend unit tests select `frontend unit test` option 

	
### Step 2. Prepare frontend tests. 

> All commands from steps 2-3 should be run from project root folder.
		
#### Option 1.

> To prepare lambdas and install frontend test dependencies for specific micro application)

Install frontend tests dependencies for specific micro application: 

```bash
cd src/deep-hello-world/tests/frontend/ && npm install
```
		
#### Option 2.

> To prepare lambdas and install dependencies for all frontend tests:

```bash
./bin/test/install.sh "frontend"
```

### Step 3. Run tests & gather coverage

#### Option 1.

> To execute frontend test dependencies for specific micro application
 
```bash
cd src/deep-hello-world/tests/frontend/ && npm run test
```
		
#### Option 2.

> To execute all frontend tests

```bash
./bin/test/test.sh "frontend"
```


> frontend coverage report is located in `micro-app-name/tests/frontend/coverage`

