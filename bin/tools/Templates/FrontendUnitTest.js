/**
 * Created by vcernomschi on 4/26/16..
 */

'use strict';

import path from 'path';
import os from 'os';
import fs from 'fs';
import fsExtra from 'fs-extra';
import dir from 'node-dir';
import {AbstractTemplate} from './AbstractTemplate';

/**
 * FrontendUnitTest
 */
export class FrontendUnitTest extends AbstractTemplate {

  /**
   * @param {String} customPresetsFile
   */
  constructor(path, callback) {
    super();

    this.microAppsPath = path;

    this.getFrontendInfo(callback);
  }

  /**
   * @param {String} mPath
   */
  set microAppsPath(mPath) {
    this._microAppPath = path.join(mPath, FrontendUnitTest.SOURCE);
  }

  /**
   * @returns {String}
   */
  get microAppsPath() {
    return this._microAppPath;
  }

  /**
   * @param {Function} callback
   */
  getFrontendInfo(callback) {

    var microAppFrontendNames = [];
    var microAppFrontendPaths = [];
    var microAppFrontend = [];

    if (fs.existsSync(this.microAppsPath)) {

      // match only filenames with by name.js pattern
      dir.readFiles(this.microAppsPath, {
          match: /name\.js/,
          exclude: /^\./,
          excludeDir: ['backend', 'node_modules', 'docs', 'data', 'tests'],
        }, (err, content, next) => {
          if (err) {
            throw err;
          }

          let name = content.replace(/[\s\S]+export\s+default\s+'(.*)';[\n\r]/g, '$1');

          if (name.indexOf('root') < 0) {
            microAppFrontendNames.push(name);
          }

          next();
        },
        (err, files) => {
          if (err) {
            throw err;
          }

          files = files.filter((file) => {
            return new RegExp(FrontendUnitTest.FRONTEND_ANGULAR_NAME, 'i').test(file);
          });

          console.log('files:', files);

          microAppFrontendPaths = files.map((file) => {
            return file.replace(RegExp(FrontendUnitTest.FRONTEND_ANGULAR_NAME, 'i'), '');
          });

          for (const [index, elem] of microAppFrontendPaths.entries()) {
            microAppFrontend.push({
              path: elem,
              name: microAppFrontendNames[index],
            });
          }

          this._microAppFrontend = microAppFrontend;

          console.log(' this._microAppFrontend: ', this._microAppFrontend)

          callback();
        }
      );

    }
  }

  /**
   * Returns full paths to controllers
   * @returns {String[]}
   */
  getControllerPaths() {
    var controllerPaths = [];

    return controllerPaths;
  }


  /**
   *
   * @param {Function} callback
   * @returns {String[]}
   */
  generateMissingTests(callback) {
    let generatedTests = [];

    //this.copyNodeBins(pathsToUpdate);
    //this.updatePackageJsons(pathsToUpdate);

    //todo - move in other place
    callback();

    return generatedTests;
  }

  /**
   * @returns {string}
   */
  static get FRONTEND() {
    return '/frontend';
  }

  /**
   * @returns {string}
   */
  static get FRONTEND_NAME() {
    return FrontendUnitTest.FRONTEND + FrontendUnitTest.RESOURCES_JSON;
  }

  /**
   * @returns {string}
   */
  static get RELATIVE_FRONTEND() {
    return '../../frontend';
  }


  /**
   * @returns {string}
   */
  static get SOURCE() {
    return '/src';
  }

  /**
   * @returns {string}
   */
  static get FRONTEND_ANGULAR_NAME() {
    return 'frontend/js/app/angular/name.js';
  }


  /**
   * @returns {string}
   * @constructor
   */
  static get PACKAGE_JSON_TPL_STRING() {
    let contentObj = {
      name: '{name}',
      version: '0.0.1',
      description: 'Description of {name}',
      scripts: {
        preinstall: 'bash node-bin/preinstall.sh',
        install: 'bash node-bin/install.sh',
        test: 'bash node-bin/test.sh',
        posttest: 'bash node-bin/posttest.sh'
      },
      dependencies: {},
      devDependencies: {},
      repository: {
        type: 'git',
        url: 'https://github.com/MitocGroup/deep-microservices-skeleton.git',
      },
      private: true,
      license: 'MIT',
    };

    return JSON.stringify(contentObj).concat(os.EOL);
  }
}
