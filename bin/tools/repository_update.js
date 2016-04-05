'use strict';

import minimist from 'minimist';
import path from 'path';
import FS from 'fs';
import fsExtra from 'fs-extra';
import global from './Helper/Global';
import {ValidatorFactory} from './Helper/ValidatorFactory';
import {Readme} from './Templates/Readme';
import {Output} from './Helper/Output';
import inquirer from 'inquirer';

Output.overwriteConsole().overwriteStdout();

let rootDirectory = path.join(__dirname, '../..');
let argv = minimist(process.argv.slice(2));
let msPath = argv.path || argv._[0];

if (typeof argv.interaction !== 'undefined') { // --no-interaction flag sets argv.interaction to false
  global.NO_INTERACTION = !argv.interaction;
}

if (!msPath) {
  console.error(`<error>Missing microservice --path option</error>`);
  process.exit(1);
}

if (!FS.existsSync(msPath) || !FS.statSync(msPath).isDirectory()) {
  console.error(`<error>${msPath} directory doesn't exists</error>`);
  process.exit(1);
}

let resources = [
  'README.md', '.travis.yml', '.hound.yml', '.houndignore',
  '.jscsrc', '.jshintrc', 'bin/e2e', 'bin/test',
];
let choiceList = resources.reduce((walker, resource) => {
  walker.push({
    name: resource,
    checked: true
  });

  return walker;
}, []);

let basename = path.basename(msPath);
let guessedMsName = basename.replace(/([a-z])([A-Z])/, '$1_$2').toLowerCase();

if (global.NO_INTERACTION) {
  updateMicroservice(guessedMsName, resources);
} else {
  inquirer.prompt([{
    name: 'microserviceName',
    message: 'Enter microservice name: ',
    default: guessedMsName,
    type: 'input',
    validate: ValidatorFactory.alphanumerical
  }, {
    choices: choiceList,
    type: 'checkbox',
    message: 'Select resources you want to update: ',
    name: 'resources'
  }], (response) => {
    updateMicroservice(
        response.microserviceName,
        response.resources
    );
  });
}

/**
 * @param {String} microserviceName
 * @param {Array} resources
 */
function updateMicroservice(microserviceName, resources) {
  let resource = resources.shift();
  let callback = updateMicroservice.bind(this, microserviceName, resources);

  switch(resource) {
    case undefined:
      console.log('<info>Done</info>');
      process.exit(0);
      break;
    case 'README.md':
      updateReadme(microserviceName, callback);
      break;
    default:
      updateResource(resource, callback);
      break;
  }

  console.log(`<info>${resource}</info> has been updated`);
}

/**
 * @param {String} microserviceName
 * @param {Function} callback
 */
function updateReadme(microserviceName, callback) {
  let readmeTemplate = new Readme(
      microserviceName,
      path.join(msPath, 'docs/BADGES.md'),
      path.join(msPath, 'docs/DESCRIPTION.md')
  );

  readmeTemplate.writeIntoFile(path.join(msPath, 'README.md'), callback);
}

/**
 * @param {String} resource
 * @param {Function} callback
 */
function updateResource(resource, callback) {
  let pathFrom = path.join(rootDirectory, resource);
  let pathTo = path.join(msPath, resource);

  fsExtra.copy(pathFrom, pathTo, callback);
}


