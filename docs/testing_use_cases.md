Testing Use Cases
=================

##Use cases for unit tests

###Changed non-application related files:

> No need to run tests for cases below:

- [x] `project/bin` folder
- [x] `project/docs` folder
- [x] `project/*.*` any files in the root of project
- [x] `project/src/micro-application/Docs` special for micro-application docs
			
###Changed frontend:

> Run only frontend tests for the changed micro-application:

- [x] `project/src/micro-application/frontend` folder
- [x] `project/src/micro-application/tests/frontend` folder

###Changed backend tests files:

> Run backend tests for the changed micro-application:

- [x] `project/src/micro-application/tests/backend` folder
	
###Changed backend related files:

> Run frontend & backend tests for the changed micro-application:

- [x] `project/src/micro-application/backend` folder
- [x] `project/src/micro-application/data` folder


##Use cases for e2e tests (e2e tests require fully initialized backend):

###Public repos with frontend/fackend changes

> Run e2e tests always

###Private repos with frontend/backend changes

> Run e2e tests only for <stage> branch 

###Private or public repos with non-application related files:

> No need to run e2e tests at all
