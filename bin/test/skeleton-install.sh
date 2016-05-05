#!/usr/bin/env bash

source $(dirname $0)/_head.sh

(if [ -d "node_modules/js-yaml" ]; then echo "js-yaml"; else npm install js-yaml; fi) &&\
(if [ -d "node_modules/inquirer" ]; then echo "inquirer"; else npm install inquirer@0.12.x; fi) &&\
(if [ -d "node_modules/minimist" ]; then echo "minimist"; else npm install minimist@1.2.x; fi) &&\
(if [ -d "node_modules/fs-extra" ]; then echo "fs-extra"; else npm install fs-extra@0.x.x; fi) &&\
(if [ -d "node_modules/node-dir" ]; then echo "node-dir"; else npm install node-dir; fi)
