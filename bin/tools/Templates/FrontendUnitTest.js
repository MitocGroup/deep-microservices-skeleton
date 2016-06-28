/*jshint bitwise: false*/

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
   * @returns {String[]}
   */
  getAngularHealthCheckPaths() {
    let helthCheckPaths = [];

    for (let microAppFrontendPath of this._microAppFrontend) {
      helthCheckPaths.push(path.join(
        __dirname, '../../../../', microAppFrontendPath.path, FrontendUnitTest.FRONTEND_ANGULAR_HEALTH_CHECK
      ));
    }

    return helthCheckPaths;
  }

  /**
   * Returns String[] of generated health checks
   * @param {String[]} paths - destination paths for angular health checks
   * @returns {String[]}
   */
  generateAngularHealthChecks(paths) {
    let result = [];

    for (let _path of paths) {

      if(FrontendUnitTest.accessSync(_path)) {
        console.log('Health check exists: ', _path)
        continue;
      }

      fsExtra.copySync(FrontendUnitTest.HEALTH_CHECK_SOURCE, _path, {
        clobber: true,
      });

      result.push(_path);
    }

    return result;
  }


  /**
   * @param {Function} callback
   * @returns {String[]}
   */
  generateMissingTests(callback) {
    let generatedTests = [];

    let angularHealthCheckPaths = this.getAngularHealthCheckPaths();

    console.log('angularHealthCheckPaths: ', angularHealthCheckPaths);

    generatedTests.concat(this.generateAngularHealthChecks(angularHealthCheckPaths));

    //let pathsToUpdate = this.getPathsToUpdate(generatedTests);

    //this.copyNodeBins(pathsToUpdate);
    //this.updatePackageJsons(pathsToUpdate);

    //todo - move in other place
    callback();

    return generatedTests;
  }

  /**
   * @param {String[]} destinations
   */
  updatePackageJsons(destinations) {

    for (let destination of destinations) {

      let dest = path.join(destination, FrontendUnitTest.PACKAGE_JSON);
      let name = dest.replace(/.*\/src\/(.*)\/tests\/.*/gi, '$1');
      let resources = this.getResourcesByMicroAppName(name);

      fsExtra.writeJsonSync(dest, JSON.parse(this.updatePackageJson(name, this.getLambdaDeps(resources).join(' '))));
    }
  }

  /**
   * @param {String} name
   * @returns {String}
   */
  updatePackageJson(name) {
    let packageName = `${name}FrontendTest`.replace(/([A-Z]+)/g, (x, y) => {
      return '-' + y.toLowerCase();
    }).replace(/^-/, '');

    return FrontendUnitTest.PACKAGE_JSON_TPL_STRING
      .replace(/\{name\}/g, packageName);
  }

  /**
   * @param {String} pathToAccess
   * @returns {boolean}
   */
  static accessSync(pathToAccess) {
    try {
      fs.accessSync(pathToAccess, fs.F_OK | fs.R_OK | fs.W_OK);
      return true;
    } catch (exception) {
      return false;
    }
  }

  static updateAngularModuleName(filePath, newValue) {

    let fileContent = fs.readFileSync(filePath, 'utf-8');

    let newContent = fileContent.replace(/\{angularModuleName\}/gi, newValue)

    //  if (err) throw err;
    //
    //  var newValue = data.replace(/^\./gim, 'myString');
    //
    //  fs.writeFile(filePath, newValue, 'utf-8', function (err) {
    //    if (err) throw err;
    //    console.log('filelistAsync complete');
    //  });
    //});
  }

  /**
   * @returns {String}
   */
  static get FRONTEND() {
    return '/frontend';
  }

  /**
   * @returns {String}
   */
  static get FRONTEND_TEST_FOLDER() {
    return '/tests/frontend';
  }

  /**
   * @returns {String}
   */
  static get FRONTEND_NAME() {
    return FrontendUnitTest.FRONTEND + FrontendUnitTest.RESOURCES_JSON;
  }

  /**
   * @returns {String}
   */
  static get RELATIVE_FRONTEND() {
    return '../../frontend';
  }


  /**
   * @returns {String}
   */
  static get SOURCE() {
    return '/src';
  }

  /**
   * @returns {String}
   */
  static get FRONTEND_ANGULAR_NAME() {
    return 'frontend/js/app/angular/name.js';
  }

  /**
   * @returns {String}
   */
  static get HEALTH_CHECK_SOURCE() {
    return path.join(__dirname, '../frontend-tests/angular/health-checks/health.check.spec.js');
  }

  /**
   * @returns {String}
   */
  static get FRONTEND_ANGULAR_HEALTH_CHECK() {
    return 'tests/frontend/angular/health-checks/health.check.spec.js';
  }

  /**
   * @returns {String}
   */
  static get PACKAGE_JSON() {
    return 'package.json';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get PACKAGE_JSON_TPL_STRING() {
    let contentObj = {
      name: '{name}',
      version: '0.0.1',
      description: 'Description of {name}',
      scripts: {
        preinstall: 'cd ../../frontend/js/ && npm install && cd ../../tests/frontend/',
        postinstall: 'jspm install',
        test: 'karma start config.karma.js',
        coverage: 'echo \'Coverage has been already gathered during testing for frontend\' && exit 0'
      },
      jspm: {
        directories: {
          baseURL: '..',
          lib: '',
          packages: 'vendor'
        },
        configFile: 'config.test.js',
        dependencies: {
          angular: 'github:angular/bower-angular@1.4.0',
          'angular-mocks': 'github:angular/bower-angular-mocks@1.4.4',
          'angular-ui-router': 'github:angular-ui/ui-router@0.2.15',
          'es5-shim': 'github:es-shims/es5-shim@4.4.0',
          'es6-shim': 'github:es-shims/es6-shim@0.34.0'
        },
        devDependencies: {
          babel: 'npm:babel-core@^6.x.x',
          'babel-runtime': 'npm:babel-runtime@^6.x.x',
          'core-js': 'npm:core-js@^1.1.4'
        }
      },
      dependencies: {},
      devDependencies: {},
      private: true,
    };

    return JSON.stringify(contentObj).concat(os.EOL);
  }
}
