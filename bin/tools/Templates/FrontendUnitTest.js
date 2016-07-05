/*jshint bitwise: false*/

/**
 * Created by vcernomschi on 4/26/16..
 */

'use strict';

import path from 'path';
import os from 'os';
import fs from 'fs';
import fsExtra from 'fs-extra';
import Twig from 'twig';
import dir from 'node-dir';
import {AbstractTemplate} from './AbstractTemplate';

/**
 * FrontendUnitTest
 */
export class FrontendUnitTest extends AbstractTemplate {

  /**
   * @param {String} path
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
   * @returns {String[]}
   */
  getAllModelsPaths() {
    return this.getAllPathByPattern(FrontendUnitTest.FRONTEND_MODELS);
  }

  /**
   * @returns {String[]}
   */
  getAllFiltersPaths() {
    return this.getAllPathByPattern(FrontendUnitTest.FRONTEND_FILTERS);
  }

  /**
   * @returns {String[]}
   */
  getAllPathByPattern(pattern) {
    let result = [];

    for (let pathItem of this._microAppFrontend) {
      let modelsDir = path.join(pathItem.path, pattern);
      result = result.concat(FrontendUnitTest._lookupClassFiles(modelsDir));
    }

    return result;
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
   * Returns String[] of generated health checks
   * @returns {String[]}
   */
  generateAngularHealthChecks() {
    let result = [];

    for (let healthCheckPath of this.healthCheckPaths) {

      if (FrontendUnitTest.accessSync(healthCheckPath.path)) {
        continue;
      }

      let templateObj = Twig.twig({
        data: fs.readFileSync(FrontendUnitTest.HEALTH_CHECK_TPL_PATH, 'utf8').toString(),
      });

      fsExtra.createFileSync(healthCheckPath.path);
      fs.writeFileSync(
        healthCheckPath.path,
        templateObj.render({
          angularModuleName: healthCheckPath.name
        }),
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

    let healthCheckTestPaths = this.generateAngularHealthChecks();
    let modelTestPaths = this.generateModelTests(this.getAllModelsPaths(), true);
    let filterTestPaths = this.generateFilterTests(this.getAllFiltersPaths(), true);

    generatedTests = generatedTests.concat(healthCheckTestPaths, modelTestPaths, filterTestPaths);

    let pathsToUpdate = this.getPathsToUpdate(generatedTests);

    this.copyConfigs(pathsToUpdate);
    this.updatePackageJsons(pathsToUpdate);
    this.prepareMocks(pathsToUpdate);

    callback();

    return generatedTests;
  }

  /**
   * Returns full paths to tests
   * @param {String[]} paths
   * @param {Boolean} isChangeFileName
   * @returns {Array}
   */
  generateTestPaths(paths, isChangeFileName) {
    let tests = paths.map((item) => {

      if (isChangeFileName) {
        item = item.replace('.js', FrontendUnitTest.TEST_FILE_EXTENSION);
      }

      return item.replace(FrontendUnitTest.FRONTEND_APP_FOLDER, FrontendUnitTest.TESTS_FRONTEND_FOLDER);
    });

    return tests;
  }

  /**
   * Generate tests and return full paths to model's tests
   * @param {String} type
   * @param {String[]} modelsPaths
   * @param {Boolean} isChangeFileName
   * @returns {Array}
   */
  generateTests(type, paths, isChangeFileName) {
    let genTests = [];
    let testPaths = this.generateTestPaths(paths, isChangeFileName);

    for (const [index, elem] of testPaths.entries()) {

      if (!FrontendUnitTest.accessSync(elem)) {
        let modelTestContent = FrontendUnitTest.createTestWithRelativePath(type, paths[index], elem);

        fsExtra.createFileSync(elem);
        fs.writeFileSync(elem, modelTestContent);

        console.log(`Test <info>${elem}</info> for has been added`);

        genTests.push(elem);
      }

    }

    return genTests;
  }

  /**
   * Generate tests and return full paths to model's tests
   * @param {String[]} modelPaths
   * @param {Boolean} isChangeFileName
   * @returns {Array}
   */
  generateModelTests(modelPaths, isChangeFileName = true) {
    return this.generateTests(FrontendUnitTest.MODEL, modelPaths, isChangeFileName);
  }

  /**
   * Generate tests and return full paths to model's tests
   * @param {String[]} filterPaths
   * @param {Boolean} isChangeFileName
   * @returns {Array}
   */
  generateFilterTests(filterPaths, isChangeFileName = true) {
    return this.generateTests(FrontendUnitTest.FILTER, filterPaths, isChangeFileName);
  }

  /**
   * @param {String[]} destinations
   */
  prepareMocks(destinations) {

    for (let destination of destinations) {

      let profileDestination = path.join(destination, FrontendUnitTest.PROFILE_PATH);
      let frameworkDestination = path.join(destination, FrontendUnitTest.FRAMEWORK_PATH);
      let stripeDestination = path.join(destination, FrontendUnitTest.STRIPE_PATH);
      let frameworkMockDestination = path.join(destination, FrontendUnitTest.FRAMEWORK_MOCK_PATH);
      let name = profileDestination.replace(/.*\/src\/(.*)\/tests\/.*/gi, '$1');
      let healthCheckObj = this.getHealthCheckObjectByName(name);

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

      if (healthCheckObj && healthCheckObj.hasOwnProperty('dependencies') &&
        healthCheckObj.dependencies.hasOwnProperty('angular-stripe') && !FrontendUnitTest.accessSync(stripeDestination)) {
        fsExtra.copySync(FrontendUnitTest.STRIPE_SOURCE, stripeDestination);
      }

    }
  }

  /**
   * @param {String[]} destinations
   */
  copyConfigs(destinations) {

    for (let destination of destinations) {

      let karmaDestination = path.join(destination, FrontendUnitTest.KARMA_CONFIG);
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

      let templateObj = Twig.twig({
        data: fs.readFileSync(FrontendUnitTest.PACKAGE_JSON_TPL_PATH, 'utf8').toString(),
      });

      //update name in tests/frontend package.json
      let packageContentString = templateObj.render({
        name: packageName,
      });

      packageContentObject = JSON.parse(packageContentString);

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

  static createTestWithRelativePath(type, absoluteClassPath = '', absoluteTestPath = '') {
    let templateObj;
    let name = FrontendUnitTest.getClassName(absoluteTestPath);
    let testPathDir = path.dirname(absoluteTestPath);
    let classPathDir = path.dirname(absoluteClassPath);
    let relativePath = path.relative(testPathDir, classPathDir);

    switch (type) {
      case FrontendUnitTest.MODEL:
        let serviceName = FrontendUnitTest.isService(absoluteClassPath);

        //create model test as for angular service
        if (serviceName) {
          templateObj = Twig.twig({
            data: fs.readFileSync(FrontendUnitTest.MODEL_WITH_SERVICE_TPL_PATH, 'utf8').toString(),
          });

          return templateObj.render({
            createdAt: new Date().toString(),
            ClassName: name,
            ServiceName: serviceName,
            serviceName: FrontendUnitTest.lowerCaseFirstChar(serviceName),
          });
        }

        templateObj = Twig.twig({
          data: fs.readFileSync(FrontendUnitTest.MODEL_TPL_PATH, 'utf8').toString(),
        });

        //create model test as for class
        return templateObj.render({
          createdAt: new Date().toString(),
          ClassName: name,
          import: `import {${name}} from \'${relativePath}/${name}\';`,
          objectName: FrontendUnitTest.lowerCaseFirstChar(name),
        });

      case FrontendUnitTest.FILTER:

        templateObj = Twig.twig({
          data: fs.readFileSync(FrontendUnitTest.FILTER_TPL_PATH, 'utf8').toString(),
        });

        let filterName = FrontendUnitTest.getFilterName(absoluteClassPath);

        if (!filterName) {
          throw new Error(`Filter name can't be retrieved for filter ${absoluteClassPath}`);
        }

        return templateObj.render({
          createdAt: new Date().toString(),
          filterName: filterName,
        });

      default:
        throw new Error(`Invalid ${type} type of test`);
    }

  }

  /**
   * @param {String} pathToClass
   * @returns {String|null}
   */
  static getFilterName(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = /.*angular\.module\(moduleName\).filter\(("|'|`)([a-z_]+)("|'|`).*/mi;

    if (re.test(fileContentString)) {
      return fileContentString.match(re)[2];
    }

    return null;
  }

  /**
   * @param {String} pathToClass
   * @returns {String|null}
   */
  static isService(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = /.*angular\.module\(moduleName\).service\(("|'|`)([a-z]+)("|'|`).*/mi;

    if (re.test(fileContentString)) {
      return fileContentString.match(re)[2];
    }

    return null;
  }

  /**
   * @param {String} string
   * @returns {String}
   */
  static lowerCaseFirstChar(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
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
   * @constructor
   */
  static get FRONTEND_APP_FOLDER() {
    return 'frontend/js/app';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get TESTS_FRONTEND_FOLDER() {
    return 'tests/frontend';
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
  static get FRONTEND_MODELS() {
    return 'frontend/js/app/angular/models';
  }

  /**
   * @returns {String}
   */
  static get FRONTEND_FILTERS() {
    return 'frontend/js/app/angular/filters';
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
  static get STRIPE_SOURCE() {
    return path.join(__dirname, '../frontend-tests/angular/lib/stripe.js');
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
  static get STRIPE_PATH() {
    return 'lib/stripe.js';
  }

  /**
   * @returns {String}
   */
  static get JSPM_CONFIG() {
    return 'config.test.js';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get HEALTH_CHECK_TPL_PATH() {
    return path.join(__dirname, '../frontend-tests/tpl/health-check.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get MODEL_TPL_PATH() {
    return path.join(__dirname, '../frontend-tests/tpl/model.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get MODEL_WITH_SERVICE_TPL_PATH() {
    return path.join(__dirname, '../frontend-tests/tpl/model_with_service.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get FILTER_TPL_PATH() {
    return path.join(__dirname, '../frontend-tests/tpl/filter.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get PACKAGE_JSON_TPL_PATH() {
    return path.join(__dirname, '../frontend-tests/tpl/package.twig');
  }

  /**
   * @param {String} dir
   * @param {Array} files_
   * @returns {Array}
   * @private
   */
  static _lookupClassFiles(dir, files_ = null) {
    files_ = files_ || [];
    let files;

    if (FrontendUnitTest.accessSync(dir)) {
      files = fs.readdirSync(dir);
    }

    for (let i in files) {
      if (!files.hasOwnProperty(i)) {
        continue;
      }

      let filename = files[i];
      let filepath = path.join(dir, filename);

      if (fs.statSync(filepath).isDirectory() && filepath.indexOf('node_modules') === -1) {
        FrontendUnitTest._lookupClassFiles(filepath, files_);
      } else {
        if (!FrontendUnitTest._isClassFile(filename)) {
          continue;
        }

        files_.push(filepath);
      }
    }

    return files_;
  }

  /**
   * @param {String} filename
   * @returns {Boolean}
   * @private
   */
  static _isClassFile(filename) {
    return /^[A-Za-z]/.test(filename) && !/exception\.js$/i.test(filename) && !/index\.js/i.test(filename) && path.extname(filename) === '.js';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get TEST_FILE_EXTENSION() {
    return '.spec.js';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get MODEL() {
    return 'model';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get FILTER() {
    return 'filter';
  }

  /**
   * @param {String} fullPath
   * @returns {String}
   */
  static getClassName(fullPath) {
    return path.basename(fullPath).replace(FrontendUnitTest.TEST_FILE_EXTENSION, '');
  }
}
