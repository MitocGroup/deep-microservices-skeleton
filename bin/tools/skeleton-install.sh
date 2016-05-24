#!/usr/bin/env bash

###################################################
### Install dependencies locally if don't exist ###
###################################################
(if [ ! -d "node_modules/js-yaml" ]; then npm install js-yaml; fi) &&\
(if [ ! -d "node_modules/inquirer" ]; then npm install inquirer@0.12.x; fi) &&\
(if [ ! -d "node_modules/minimist" ]; then npm install minimist@1.2.x; fi) &&\
(if [ ! -d "node_modules/fs-extra" ]; then npm install fs-extra@0.x.x; fi) &&\
(if [ ! -d "node_modules/node-dir" ]; then npm install node-dir; fi)
