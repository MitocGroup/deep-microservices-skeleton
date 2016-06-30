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
  constructor(path) {
    super();

    this.microAppsPath = path;
    this.microAppsFullPath = path;
  }

  /**
   * @param {Function} callback
   */
  init(callback) {
    this.getFrontendInfo(callback);
    this.getFrontendPackageJsonPaths();
  }

  /**
   * @param {String} mPath
   */
  set microAppsFullPath(mPath) {
    this._microAppsFullPath = path.join(
      __dirname, '../../../../', mPath, FrontendUnitTest.SOURCE
    );
  }

  /**
   * @param {String} mPath
   */
  set microAppsPath(mPath) {
    this._microAppsPath = mPath;
  }

  /**
   * @returns {String}
   */
  get microAppsPath() {
    return this._microAppsPath;
  }

  /**
   * Object with destination paths for angular health checks, module names and deps
   * @returns {String}
   */
  get healthCheckPaths() {
    return this._healthCheckPaths;
  }

  /**
   * @returns {String[]}
   * @private
   */
  get frontendPackageJsonPaths() {
    return this._frontendPackageJsonPaths;
  }


  /**
   * @returns {String}
   */
  get microAppsFullPath() {
    return this._microAppsFullPath;
  }

  /**
   * @param {Function} callback
   */
  getFrontendInfo(callback) {

    var microAppFrontendNames = [];
    var microAppFrontendPaths = [];
    var microAppFrontend = [];

    if (FrontendUnitTest.accessSync(this.microAppsPath)) {

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

          microAppFrontendPaths = files.map((file) => {
            return file.replace(new RegExp(FrontendUnitTest.FRONTEND_ANGULAR_NAME, 'i'), '');
          });

          for (const [index, elem] of microAppFrontendPaths.entries()) {
            microAppFrontend.push({
              path: elem,
              name: microAppFrontendNames[index],
            });
          }

          this._microAppFrontend = microAppFrontend;

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
   * @param {String} mPath
   * @returns {String}
   */
  static getMicroAppIdentifier(mPath) {
    let deepkfPath = path.join(mPath, 'deepkg.json');

    if (FrontendUnitTest.accessSync(deepkfPath)) {
      return fsExtra.readJsonSync(deepkfPath, {throws: false}).identifier;
    }

    return '';
  }

  /**
   * @returns {Object[]}
   */
  getAngularHealthCheckPaths() {
    let healthCheckPaths = [];

    for (let microAppFrontendPath of this._microAppFrontend) {

      healthCheckPaths.push({
          path: path.join(microAppFrontendPath.path, FrontendUnitTest.FRONTEND_ANGULAR_HEALTH_CHECK),
          name: microAppFrontendPath.name,
          dependencies: this.lookupDependencies(FrontendUnitTest.getDependencies(microAppFrontendPath.path)),
          identifier: FrontendUnitTest.getMicroAppIdentifier(microAppFrontendPath.path),
        }
      );
    }

    this._healthCheckPaths = healthCheckPaths;

    return healthCheckPaths;
  }

  /**
   * @param dependencies
   * @returns {Object}
   */
  lookupDependencies(dependencies) {
    let i, j;
    let result = {};

    for (i = 0; i < dependencies.length; i++) {

      let depName = dependencies[i];
      let isDependencyMatched = false;

      for (j = 0; j < this.frontendPackageJsonPaths.length; j++) {
        let content = JSON.parse(fs.readFileSync(this.frontendPackageJsonPaths[j], 'utf8'));

        if (content.hasOwnProperty('jspm') && typeof content.jspm.dependencies !== 'undefined' &&
          Object.getOwnPropertyNames(content.jspm.dependencies).length !== 0) {

          let jspmDeps = content.jspm.dependencies;

          if (jspmDeps.hasOwnProperty(dependencies[i])) {
            result[depName] = jspmDeps[depName];
            isDependencyMatched = true;
            break;
          }
        }
      }

      if (!isDependencyMatched) {
        console.log(`No dependencies found for:  <error>${depName}</error>`);
      }

    }

    return result;
  }

  /**
   *
   * @param {String} microAppPath
   * @returns {String[]}
   */
  static getDependencies(microAppPath) {
    let result = [];
    let dependenciesPath = path.join(microAppPath, FrontendUnitTest.FRONTEND_ANGULAR_DEPENDENCIES);

    if (FrontendUnitTest.accessSync(dependenciesPath)) {
      let fileContent = fs.readFileSync(dependenciesPath, 'utf-8');
      let dependenciesArray = fileContent.match(/import(.*from.*)?\s+'([^\/\']+(\/[^\/\']+)?)/g);
      dependenciesArray = dependenciesArray ? dependenciesArray : [];

      for (let dependency of dependenciesArray) {
        result.push(dependency.replace(/import(.*from.*)?\s+'/, ''));
      }
    }

    return result;
  }

  /**
   * Returns String[] of generated health checks
   * @returns {String[]}
   */
  generateAngularHealthChecks() {
    let result = [];

    for (let healthCheckPath of this.healthCheckPaths) {

      if (FrontendUnitTest.accessSync(healthCheckPath.path)) {
        continue;
      }

      fsExtra.createFileSync(healthCheckPath.path);
      fs.writeFileSync(
        healthCheckPath.path,
        FrontendUnitTest.HEALTH_CHECK_TPL.replace(
          /\{angularModuleName\}/gi, healthCheckPath.name
        ),
        'utf-8'
      );

      console.log(`Health check tests <info>${healthCheckPath.path}</info> have been added`);

      result.push(healthCheckPath.path);
    }

    return result;
  }


  /**
   * @param {Function} callback
   * @returns {String[]}
   */
  generateMissingTests(callback) {
    let generatedTests = [];

    this.getAngularHealthCheckPaths();

    generatedTests = generatedTests.concat(this.generateAngularHealthChecks());

    let pathsToUpdate = this.getPathsToUpdate(generatedTests);

    this.copyConfigs(pathsToUpdate);
    this.updatePackageJsons(pathsToUpdate);
    this.prepareMocks(pathsToUpdate);

    callback();

    return generatedTests;
  }

  /**
   * @param {String[]} destinations
   */
  prepareMocks(destinations) {
    for (let destination of destinations) {

      let profileDestination = path.join(destination, FrontendUnitTest.PROFILE_PATH);
      let frameworkDestination = path.join(destination, FrontendUnitTest.FRAMEWORK_PATH);
      let frameworkMockDestination = path.join(destination, FrontendUnitTest.FRAMEWORK_MOCK_PATH);

      if (!FrontendUnitTest.accessSync(profileDestination)) {
        fsExtra.copySync(FrontendUnitTest.PROFILE_SOURCE, profileDestination);
      }

      if (!FrontendUnitTest.accessSync(frameworkDestination)) {
        fsExtra.copySync(FrontendUnitTest.FRAMEWORK_SOURCE, frameworkDestination);
      }

      if (!FrontendUnitTest.accessSync(frameworkMockDestination)) {
        let name = destination.replace(/.*\/src\/(.*)\/tests\/.*/gi, '$1');

        fsExtra.copySync(FrontendUnitTest.FRAMEWORK_MOCK_SOURCE, frameworkMockDestination);

        FrontendUnitTest.updateFrameworkMock(frameworkMockDestination, name);
      }
    }
  }

  /**
   * @param {String[]} destinations
   */
  copyConfigs(destinations) {

    for (let destination of destinations) {

      let karmaDestination = path.join(destination, FrontendUnitTest.KARMA_CONFIG);
      let packageJsonDestination = path.join(destination, FrontendUnitTest.PACKAGE_JSON);
      let jspmConfigDestination = path.join(destination, FrontendUnitTest.JSPM_CONFIG);

      if (!FrontendUnitTest.accessSync(karmaDestination)) {
        fsExtra.copySync(
          path.join(FrontendUnitTest.CONFIGS_SOURCE, FrontendUnitTest.KARMA_CONFIG),
          karmaDestination
        );
      }

      if (!FrontendUnitTest.accessSync(jspmConfigDestination)) {
        fsExtra.copySync(
          path.join(FrontendUnitTest.CONFIGS_SOURCE, FrontendUnitTest.JSPM_CONFIG),
          jspmConfigDestination
        );
      }
    }
  }

  /**
   * @param {String[]} tests
   */
  getPathsToUpdate(tests) {
    var microAppsArray = tests.map((element) => {
      return element.replace(/.*(src\/.*)\/tests\/.*/gi, '$1');
    });

    var uniqueArray = microAppsArray.filter((item, pos) => {
      return microAppsArray.indexOf(item) === pos;
    });

    for (var i = 0; i < uniqueArray.length; i++) {
      uniqueArray[i] = path.join(this.microAppsPath, uniqueArray[i], FrontendUnitTest.FRONTEND_TEST_FOLDER);
    }

    return uniqueArray;
  }

  /**
   * @param {String[]} destinations
   */
  updatePackageJsons(destinations) {

    for (let destination of destinations) {

      let packageJsonDestination = path.join(destination, FrontendUnitTest.PACKAGE_JSON);
      let name = packageJsonDestination.replace(/.*\/src\/(.*)\/tests\/.*/gi, '$1');

      this.updatePackageJson(name, packageJsonDestination);
    }
  }

  /**
   *
   * @param {String} name
   * @returns {Object|null}
   */
  getHealthCheckObjectByName(name) {
    let testPath = path.join('livebook/src/', name, FrontendUnitTest.FRONTEND_ANGULAR_HEALTH_CHECK);

    for (let element of this.healthCheckPaths) {

      if (element.path === testPath) {
        return element;
      }
    }

    return null;
  }

  /**
   * Add jspm dependencies to json object from dependenciesObj object
   * @param {Object} contentObj - object to update
   * @param {Object} dependenciesObj - object with dependencies to add
   */
  addDependencies(contentObj, dependenciesObj) {

    if (dependenciesObj && dependenciesObj.hasOwnProperty('dependencies')) {
      for (let depItem in dependenciesObj.dependencies) {

        if (!contentObj.jspm.dependencies.hasOwnProperty(depItem)) {

          contentObj.jspm.dependencies[depItem] = dependenciesObj.dependencies[depItem];
        }
      }
    }
  }

  /**
   * @param {String} name
   * @param {String} filePath
   */
  updatePackageJson(name, filePath) {
    let packageName = `${name}FrontendTest`.replace(/([A-Z]+)/g, (x, y) => {
      return '-' + y.toLowerCase();
    }).replace(/^-/, '');

    //find dependencies
    let healthCheckObj = this.getHealthCheckObjectByName(name);
    let packageContentObject = {};

    // file doesn't exist - need to create
    if (!FrontendUnitTest.accessSync(filePath)) {

      fsExtra.createFileSync(filePath);

      //update name in tests/frontend package.json
      let packageContentString = JSON.stringify(FrontendUnitTest.PACKAGE_JSON_TPL_STRING).replace(
        /\{name\}/gi, packageName
      );

      packageContentObject = JSON.parse(JSON.parse(packageContentString));

    } else {

      // file exists - need just to update deps
      packageContentObject = fsExtra.readJsonSync(filePath, {throws: true});
    }

    this.addDependencies(packageContentObject, healthCheckObj);

    fsExtra.writeJsonSync(
      filePath,
      packageContentObject
    );
  }

  /**
   * Return frontend coverage report folder if exists or current directory
   * @returns {String[]}
   */
  getFrontendPackageJsonPaths() {
    let result = [];

    if (FrontendUnitTest.accessSync(this.microAppsFullPath)) {

      fs.readdirSync(this.microAppsFullPath).map((file) => {

        let fullPath = path.join(this.microAppsFullPath, file, 'frontend/js', 'package.json');

        if (FrontendUnitTest.accessSync(fullPath)) {
          result.push(fullPath);
        }
      });
    }

    this._frontendPackageJsonPaths = result;

    return result;
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

  /**
   * Update DeepFramework mock to use valid microservice identifier
   * @param {String} filePath
   * @param {String} newValue
   */
  static updateFrameworkMock(filePath, newValue) {

    let fileContent = fs.readFileSync(filePath, 'utf-8');

    fs.writeFileSync(
      filePath, fileContent.replace(/\{microserviceIdentifier\}/gi, newValue), 'utf-8'
    );
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
  static get FRONTEND_ANGULAR_DEPENDENCIES() {
    return 'frontend/js/app/angular/module/dependencies.js';
  }

  /**
   * @returns {String}
   */
  static get CONFIGS_SOURCE() {
    return path.join(__dirname, '../frontend-tests/angular/config');
  }

  /**
   * @returns {String}
   */
  static get PROFILE_SOURCE() {
    return path.join(__dirname, '../frontend-tests/angular/mock/data/profile.json');
  }

  /**
   * @returns {String}
   */
  static get FRAMEWORK_MOCK_SOURCE() {
    return path.join(__dirname, '../frontend-tests/angular/mock/lib/DeepFramework.js');
  }

  /**
   * @returns {String}
   */
  static get FRAMEWORK_SOURCE() {
    return path.join(__dirname, '../frontend-tests/angular/lib/DeepFramework.js');
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
   */
  static get KARMA_CONFIG() {
    return 'config.karma.js';
  }

  /**
   * @returns {String}
   */
  static get PROFILE_PATH() {
    return 'mock/data/profile.json';
  }

  /**
   * @returns {String}
   */
  static get FRAMEWORK_MOCK_PATH() {
    return 'mock/lib/DeepFramework.js';
  }

  /**
   * @returns {String}
   */
  static get FRAMEWORK_PATH() {
    return 'lib/DeepFramework.js';
  }

  /**
   * @returns {String}
   */
  static get JSPM_CONFIG() {
    return 'config.test.js';
  }

  /**
   * @returns {string}
   * @constructor
   */
  static get HEALTH_CHECK_TPL() {
    let content = [];

    content.push(`/* global angular */`);
    content.push('');
    content.push('\'use strict\';');
    content.push('');
    content.push('import moduleName from \'../../../../frontend/js/app/angular/name\';');
    content.push('');
    content.push('describe(\'Health checks\', () => {');
    content.push('  it(\'Should load angular library\', () => {');
    content.push('    expect(typeof angular).toBe(\'object\');');
    content.push('  });');
    content.push('');
    content.push('  it(\'Should load angular version 1.4.0\', () => {');
    content.push('    expect(angular.version.full).toBe(\'1.4.0\');');
    content.push('  });');
    content.push('');
    content.push('  it(\'Should load angular ui router\', () => {');
    content.push('    expect(angular.module(\'ui.router\').name).toBe(\'ui.router\');');
    content.push('  });');
    content.push('');
    content.push('  it(\'Should load ngMock\', () => {');
    content.push('    expect(typeof angular.mock.module).toBe(\'function\');');
    content.push('    expect(typeof inject).toBe(\'function\');');
    content.push('    expect(typeof dump).toBe(\'function\');');
    content.push('  });');
    content.push('');
    content.push('  it(\'Module name is [{angularModuleName}]\', () => {');
    content.push('    expect(moduleName).toBe(\'{angularModuleName}\');');
    content.push('  });');
    content.push('');
    content.push('});');
    content.push('');

    return content.join(os.EOL);
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
          'angular-cookies': 'npm:angular-cookies@^1.5.3',
          'angular-mocks': 'github:angular/bower-angular-mocks@1.4.4',
          'angular-ui-router': 'github:angular-ui/ui-router@0.2.15',
          'es5-shim': 'github:es-shims/es5-shim@4.4.0',
          'es6-shim': 'github:es-shims/es6-shim@0.34.0',
          css: 'github:systemjs/plugin-css@0.1.13',
          jquery: 'npm:jquery@^2.2.3',
        },
        devDependencies: {
          babel: 'npm:babel-core@^5.8.24',
          'babel-runtime': 'npm:babel-runtime@^5.8.24',
          'core-js': 'npm:core-js@^1.1.4',
        },
      },
      'dependencies': {},
      'devDependencies': {},
      'private': true,
    };

    return JSON.stringify(contentObj).concat(os.EOL);
  }
}
