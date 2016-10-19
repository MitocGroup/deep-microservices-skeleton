'use strict';

import minimist from 'minimist';
import path from 'path';
import FS from 'fs';
import fsExtra from 'fs-extra';
import inquirer from 'inquirer';
import global from './Helper/Global';
import {ValidatorFactory} from './Helper/ValidatorFactory';
import {Readme} from './Templates/Readme';
import {Output} from './Helper/Output';
import {YamlConfig} from './Templates/YamlConfig';
import {IngnoreConfig} from './Templates/IngnoreConfig';
import {JsonConfig} from './Templates/JsonConfig';
import {BackendUnitTest} from './Templates/BackendUnitTest';
import {FrontendUnitTest} from './Templates/FrontendUnitTest';

/**
 * @param {String} resource
 * @param {Function} callback
 */
function updateResource(resource, callback) {
  let pathFrom = path.join(rootDirectory, resource);
  let pathTo = path.join(msPath, resource);

  fsExtra.copy(pathFrom, pathTo, callback);
}

/**
 * @param {String} microserviceName
 * @param {Function} callback
 */
function updateReadme(microserviceName, callback) {
  let readmeTemplate = new Readme(
    microserviceName,
    path.join(msPath, 'docs/badges.md'),
    path.join(msPath, 'docs/description.md')
  );

  readmeTemplate.writeIntoFile(path.join(msPath, 'README.md'), callback);
}

/**
 * @param {String} configName
 * @param {Function} callback
 */
function updateYaml(configName, callback) {
  let travisTemplate = new YamlConfig(
    path.join(msPath, `docs/${configName}`), `../../../${configName}`
  );

  travisTemplate.writeIntoFile(path.join(msPath, configName), callback);
}

/**
 * @param {String} configName
 * @param {Function} callback
 */
function updateConfig(configName, callback) {
  let ignoreConfig = new IngnoreConfig(
    path.join(msPath, `docs/${configName}`), `../../../${configName}`
  );

  ignoreConfig.writeIntoFile(path.join(msPath, configName), callback);
}

/**
 * @param {String} configName
 * @param {Function} callback
 */
function updateJson(configName, callback) {
  let jsonConfig = new JsonConfig(
    path.join(msPath, `docs/${configName}`), `../../../${configName}`
  );

  jsonConfig.writeIntoFile(path.join(msPath, configName), callback);
}

/**
 * @param {Function} callback
 */
function updateBackendUnitTests(callback) {

  let backendUnitTest = new BackendUnitTest(msPath);

  backendUnitTest.init(()=> {
    backendUnitTest.generateMissingTests(callback);
  });

}

/**
 * @param {Function} callback
 */
function updateFrontendUnitTests(callback) {

  let frontendUnitTest = new FrontendUnitTest(msPath);
  frontendUnitTest.init(() => {
    frontendUnitTest.generateMissingTests(callback);
  });

}

/**
 * @param {String} microserviceName
 * @param {Array} resources
 */
function updateMicroservice(microserviceName, resources) {
  let resource = resources.shift();
  let callback = () => {
    console.log(`<info>${resource}</info> has been updated`);

    updateMicroservice(microserviceName, resources);
  };

  switch (resource) {
    case undefined:
      console.log('<info>Done</info>');
      process.exit(0);
      break;
    case 'README.md':
      if(microserviceName.indexOf('deep-microservices-root') !== -1 && global.NO_INTERACTION) {
        callback();
        return;
      }
      updateReadme(microserviceName, callback);
      break;

    case '.travis.yml':
      updateYaml(resource, callback);
      break;

    case '.codeclimate.yml':
      updateYaml(resource, callback);
      break;

    case '.csslintrc':
      updateConfig(resource, callback);
      break;

    case '.eslintrc':
      updateYaml(resource, callback);
      break;

    case '.eslintignore':
      updateConfig(resource, callback);
      break;

    case 'tslint.json':
      updateJson(resource, callback);
      break;

    case 'pre-commit hook':
      updateResource('bin/install_precommit.sh', () => {
        updateResource('bin/pre-commit', callback);
      });
      break;

    case 'backend unit test':
      updateBackendUnitTests(callback);
      break;

    case 'frontend unit test':
      updateFrontendUnitTests(callback);
      break;

    default:
      updateResource(resource, callback);
      break;
  }
}


Output.overwriteConsole().overwriteStdout();

let rootDirectory = path.join(__dirname, '../..');
let argv = minimist(process.argv.slice(2));
let msPath = argv.path || argv._[0];

//set env variable
global.NO_INTERACTION = process.env['NO_INTERACTION'];

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
  'README.md', '.travis.yml', 'bin/test',
  '.codeclimate.yml', '.csslintrc', '.eslintignore', '.eslintrc', 'tslint.json',
  'pre-commit hook', 'backend unit test', 'frontend unit test',
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
