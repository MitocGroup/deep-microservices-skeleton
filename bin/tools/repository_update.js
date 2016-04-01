'use strict';

import minimist from 'minimist';
import path from 'path';
import FS from 'fs';
import fsExtra from 'fs-extra';
import global from './Helper/Global';
import {Question} from './Helper/Question';
import {BoolQuestion} from './Helper/BoolQuestion';
import {ValidatorFactory} from './Helper/ValidatorFactory';
import {Readme} from './Templates/Readme';
import {Output} from './Helper/Output';

Output.overwriteConsole().overwriteStdout();

let rootDirectory = path.join(__dirname, '../..');
let argv = minimist(process.argv.slice(2));
let msPath = argv.path || argv._[0];

if (typeof argv.interaction !== 'undefined') { // --no-interaction flag sets argv.interaction to false
  global.NO_INTERACTION = !argv['interaction'];
}

if (!msPath) {
  console.error(`<error>Missing microservice --path option</error>`);
  process.exit(1);
}

if (!FS.existsSync(msPath) || !FS.statSync(msPath).isDirectory()) {
  console.error(`<error>${msPath} directory doesn't exists</error>`);
  process.exit(1);
}

let basename = path.basename(msPath);
let guessedMsName = basename.replace(/([a-z])([A-Z])/, '$1_$2').toLowerCase();
console.log(`Detected microservices name "<info>${guessedMsName}</info>".`);

new BoolQuestion(
  `Do you want to use it? `
).ask((isYes) => {
  if (isYes) {
    updateMicroservice(guessedMsName);
    return;
  }

  new Question(
    'Microservice name: ',
    [ValidatorFactory.alphanumerical, ValidatorFactory.notEmpty]
  ).ask((microserviceName) => {
      updateMicroservice(microserviceName);
  });
});

/**
 * @param {String} microserviceName
 */
function updateMicroservice(microserviceName) {
  let readmeTemplate = new Readme(
    microserviceName,
    path.join(msPath, 'BADGES.md'),
    path.join(msPath, 'DESCRIPTION.md')
  );

  readmeTemplate.writeIntoFile(path.join(msPath, 'README.md'), () => {
    let resources = [
      '.travis.yml', '.hound.yml', '.houndignore',
      '.jscs.json', '.jshintrc', 'bin/e2e', 'bin/test',
    ];

    let updateResources = () => {
      let resource = resources.shift();
      if (resource) {
        askToUpdateResource(resource, updateResources);

        return;
      }

      console.log('<info>Done</info>');
      process.exit(0);
    };

    updateResources();
  });
}

/**
 * @param {String} resource
 * @param {Function} callback
 */
function askToUpdateResource(resource, callback) {
  let resourceFrom = path.join(rootDirectory, resource);
  let resourceTo = path.join(msPath, resource);
  let doUpdate = () => {
    fsExtra.copy(resourceFrom, resourceTo, callback);

    console.log(`<info>${resource}</info> has been updated`);
  };

  new BoolQuestion(
    `Do you want to update ${resource}? `
  ).ask((isYes) => {
    if (isYes) {
      if (FS.existsSync(resourceTo)) {
        let stat = FS.statSync(resourceTo);
        let type = stat.isFile() ? 'File' : 'Directory';

        if (!global.NO_INTERACTION) {
          console.log(`${type} <info>${path.basename(resourceTo)}</info> already exists. `);
        }

        new BoolQuestion(
          'Do you want to overwrite it? '
        ).ask((isYes) => {
            (isYes ? doUpdate : callback)();
        });

        return;
      }
    }

    doUpdate();
  });
}


