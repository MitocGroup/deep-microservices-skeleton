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

```json
{
  "reposArray": [                        
    "https://github.com/MitocGroup/deep-microservices-monitoring",
    //...
    "https://github.com/MitocGroup/deep-microservices-root-angular2"
  ],                                           // array of target repos to update
  "folderPath": "./repos",                     // temporary folder to store repos
  "sourceBranchName": "dev",                   // branch which will be used as source for updating
  "destBranchName": "node_v6_6",               // branch which will be used as destination 
  "commitMessage": "Update node version",      // commit message for auto update changes 
  "pullRequestMessage": "Update node version"  // pull request message for auto update changes 
}
```

### Step 3. Run script to update repos based on data from config.
```
./deep-microservices-skeleton/bin/tools/populate-repos/auto_update.sh
```
> Update all repos and output pull requests numbers to be merged. 

## FAQ: 

###. What do I need to do when getting the error: `[Error: Cannot push non-fastforwardable reference]`?
> This error means that in the specific repo already exists branch with name from `destBranchName` config.
> To fix issue you need to use different branch name or remove the existed branch.

###. What do I need to do when getting the error: `[Error: Empty value for parameter 'owner': undefined]`?
> This is known issue related new version of `github` node module.
> To fix issue you need to install preffered `github` version by running `npm install github@3.1.0` from project root.


		


