How to update deep-microservices-* repos automatically
======================================================

Before updating automatically repos, please make sure that all dependencies is installed properly.
```
./bin/test/preinstall.sh && ./bin/tools/skeleton-install.sh
```
> Run pre-install and skeleton install dependencies scripts. These command should be run from project root.
         
## Getting Started

### Step 1. Generate github token


> To generate github token please use this [link](https://github.com/blog/1509-personal-api-tokens)
> You will be need  full control of private repositories and notifications:  

- [x] `repo`
    - [x] `repo:status`
    - [x] `repo_deployment` 
    - [x] `public_repo`
    
- [x] `notifications`

	
### Step 2. Update config file. 

> Update `./bin/tools/populate-repos/config.json` config with details for specific updates. 

### Step 3. Run script to update repos based on data from config.


## FAQ: 

###. What do I need to do when getting the error: `[Error: Cannot push non-fastforwardable reference]`?

###. What do I need to do when getting the error: `[Error: Empty value for parameter 'owner': undefined]`?


		


