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
 * BackendUnitTest
 */
export class BackendUnitTest extends AbstractTemplate {

  /**
   * @param {String} customPresetsFile
   */
  constructor(path, callback) {
    super();

    this.microAppsPath = path;

    this.getBackendInfo(callback);
  }

  /**
   * @param {String} mPath
   */
  set microAppsPath(mPath) {
    this._microAppPath = path.join(mPath, BackendUnitTest.SOURCE);
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
  getBackendInfo(callback) {

    var microAppBackendContent = [];
    var microAppBackendPaths = [];
    var microAppBackend = [];

    var _this = this;

    // match only filenames with a .txt extension and that don't start with a `.´
    dir.readFiles(this.microAppsPath, {
        match: /resources\.json$/,
        exclude: /^\./,
      }, function (err, content, next) {
        if (err) throw err;

        var contentObj = JSON.parse(content);
        var lambdas = {};
        var resources = {};

        for (var resourceName in contentObj) {
          if (contentObj.hasOwnProperty(resourceName)) {
            lambdas = {};

            for (var lambdaName in contentObj[resourceName]) {
              if (contentObj[resourceName].hasOwnProperty(lambdaName)) {
                lambdas[lambdaName] = contentObj[resourceName][lambdaName].source;
              }
            }

            resources[resourceName] = lambdas;
          }
        }

        microAppBackendContent.push(resources);

        next();
      },
      function (err, files) {
        if (err) throw err;

        microAppBackendPaths = files.map(function (file) {
          return file.replace(BackendUnitTest.BACKEND_RESOURCES, '');
        });

        for (var i = 0; i < microAppBackendPaths.length; i++) {
          microAppBackend.push({
            path: microAppBackendPaths[i],
            resources: microAppBackendContent[i],
          });
        }

        _this._microAppBackend = microAppBackend;

        callback();
      }
    );
  }

  /**
   * Returns full paths to lambdas
   * @returns {String[]}
   */
  getLambdaPaths() {
    var lambdaPaths = [];

    for (var i = 0; i < this._microAppBackend.length; i++) {

      for (var resourceName in this._microAppBackend[i].resources) {

        if (this._microAppBackend[i].resources.hasOwnProperty(resourceName)) {

          for (var lambdaName in this._microAppBackend[i].resources[resourceName]) {

            if (this._microAppBackend[i].resources[resourceName].hasOwnProperty(lambdaName)) {

              lambdaPaths.push(path.join(
                this._microAppBackend[i].path,
                BackendUnitTest.BACKEND,
                this._microAppBackend[i].resources[resourceName][lambdaName]
              ));

            }
          }
        }
      }
    }

    return lambdaPaths;
  }

  /**
   * Returns full paths to lambda's tests
   * @returns {String[]}
   */
  getLambdaTestPaths() {
    var paths = [];

    paths = this.getLambdaPaths().map(function (item) {
      return item.replace(BackendUnitTest.BACKEND_SOURCE, BackendUnitTest.BACKEND_UNIT_TEST_FOLDER);
    });

    return paths;
  }

  /**
   * @param {String} filePath
   * @returns {String}
   * @private
   */
  _genTestSuite(filePath, name) {

    switch (name) {
      case BackendUnitTest.HANDLER_TEST_FILENAME:
        return BackendUnitTest.HANDLER_TEST_TPL
          .replace(/\{import\}/g, `import Handler from \'../../../node_modules/${this.getLambdaName(filePath)}/Handler\';`)
          .replace(/\{lambdaName\}/g, this.getLambdaName(filePath));
      case BackendUnitTest.BOOTSTRAP_TEST_FILENAME:
        return BackendUnitTest.BOOTSTRAP_TEST_TPL
          .replace(/\{import\}/g, `import bootstrap from \'../../../node_modules/${this.getLambdaName(filePath)}/bootstrap\';`)
          .replace(/\{lambdaName\}/g, this.getLambdaName(filePath));
      default:
        throw Error('Unknown file name');
    }
  }

  /**
   * Return lambda name from package.json
   * @param {String} testLambdaPath
   * @returns {string}
   */
  getLambdaName(lambdaPath) {
    let packageJsonPath = path.join(lambdaPath, BackendUnitTest.PACKAGE_JSON);

    return JSON.parse(this._tryToReadFromFile(packageJsonPath)).name;
  }

  /**
   *
   * @param {Function} callback
   * @returns {String[]}
   */
  generateMissingTests(callback) {
    let lambdasPathArray = this.getLambdaPaths();
    let toUpdateTests = this.getLambdaTestPaths();
    let generatedTests = [];

    for (let i = 0; i < toUpdateTests.length; i++) {

      let bootstrapTestFilePath = path.join(toUpdateTests[i], BackendUnitTest.BOOTSTRAP_TEST_FILENAME);
      let handlerTestFilePath = path.join(toUpdateTests[i], BackendUnitTest.HANDLER_TEST_FILENAME);

      if (!fs.existsSync(bootstrapTestFilePath)) {

        fsExtra.createFileSync(bootstrapTestFilePath);
        fs.writeFileSync(
          bootstrapTestFilePath, this._genTestSuite(lambdasPathArray[i], BackendUnitTest.BOOTSTRAP_TEST_FILENAME)
        );

        generatedTests.push(bootstrapTestFilePath);
      }

      if (!fs.existsSync(handlerTestFilePath)) {

        fsExtra.createFileSync(handlerTestFilePath);
        fs.writeFileSync(
          handlerTestFilePath, this._genTestSuite(lambdasPathArray[i], BackendUnitTest.HANDLER_TEST_FILENAME)
        );

        generatedTests.push(handlerTestFilePath);
      }
    }

    let pathsToUpdate = this.getPathsToUpdate(generatedTests);

    this.copyNodeBins(pathsToUpdate);
    this.updatePackageJsons(pathsToUpdate);

    //todo - move in other place
    callback();

    return generatedTests;
  }

  /**
   * @param {String[]} lambdas
   */
  getPathsToUpdate(lambdas) {
    var microAppsArray = lambdas.map(function (element, index, arr) {
      return element.replace(/.*\/src\/(.*)\/Tests\/.*/g, '$1');
    });

    var uniqueArray = microAppsArray.filter(function (item, pos) {
      return microAppsArray.indexOf(item) == pos;
    });

    for (var i = 0; i < uniqueArray.length; i++) {
      uniqueArray[i] = path.join(this.microAppsPath, uniqueArray[i], BackendUnitTest.BACKEND_TEST_FOLDER);
    }

    return uniqueArray;
  }

  /**
   * @param {String[]} destinations
   */
  copyNodeBins(destinations) {

    for (let destination of destinations) {

      let dest = path.join(destination, BackendUnitTest.NODE_BIN);

      if (!fs.existsSync(dest)) {
        fsExtra.copySync(BackendUnitTest.NODE_BIN_PATH, dest);
      }
    }

  }

  /**
   * @param {String[]} destinations
   */
  updatePackageJsons(destinations) {
    
    for (let destination of destinations) {

      let dest = path.join(destination, BackendUnitTest.PACKAGE_JSON);
      let name = dest.replace(/.*\/src\/(.*)\/Tests\/.*/g, '$1');
      let resources = this.getResourcesByMicroAppName(name)

      fsExtra.writeJsonSync(dest, JSON.parse(this.updatePackageJson(name, this.getLambdaDeps(resources).join(' '))));
    }
  }


  /**
   * Returns all resources with lambda paths by microApp name
   * @param {String} name
   * @returns {Object|null}
   */
  getResourcesByMicroAppName(name) {
    for (let i = 0; i < this._microAppBackend.length; i++) {
      if (this._microAppBackend[i].path === path.join(this.microAppsPath, name)) {
        return this._microAppBackend[i].resources;
      }

    }

    return null;
  }

  /**
   * @param {Object} resources
   * @returns {Array}
   */
  getLambdaDeps(resources) {
    let result = []

    for (let resource in resources) {

      for (let lambda in resources[resource]) {

        result.push(path.join(BackendUnitTest.RELATIVE_BACKEND, resources[resource][lambda]))
      }

    }

    return result;
  }

  /**
   *
   * @param {String} name
   * @param {String} lambdasDepsString
   * @returns {string}
   */
  updatePackageJson(name, lambdasDepsString) {
    return BackendUnitTest.PACKAGE_JSON_TPL_STRING
      .replace(/\{name\}/g, name + 'BackendTest')
      .replace(/\{path\}/g, 'npm link chai '.concat(lambdasDepsString));
  }

  /**
   * @returns {string}
   */
  static get BOOTSTRAP_TEST_FILENAME() {
    return 'bootstrap.spec.js';
  }

  /**
   * @returns {string}
   */
  static get HANDLER_TEST_FILENAME() {
    return 'Handler.spec.js';
  }

  /**
   * @returns {string}
   */
  static get NODE_BIN() {
    return '/node-bin';
  }

  /**
   * @returns {string}
   */
  static get NODE_BIN_PATH() {
    return path.join(__dirname, '../', BackendUnitTest.NODE_BIN);
  }

  /**
   * @returns {string}
   */
  static get BACKEND() {
    return '/Backend';
  }

  /**
   * @returns {string}
   */
  static get RELATIVE_BACKEND() {
    return '../../Backend';
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
  static get BACKEND_UNIT_TEST_FOLDER() {
    return '/Tests/Backend/test';
  }

  /**
   * @returns {string}
   */
  static get BACKEND_TEST_FOLDER() {
    return '/Tests/Backend';
  }

  /**
   * @returns {string}
   */
  static get RESOURCES_JSON() {
    return '/resources.json';
  }

  /**
   * @returns {string}
   */
  static get PACKAGE_JSON() {
    return 'package.json';
  }

  /**
   * @returns {string}
   */
  static get BACKEND_RESOURCES() {
    return BackendUnitTest.BACKEND + BackendUnitTest.RESOURCES_JSON;
  }

  /**
   * @returns {string}
   */
  static get BACKEND_SOURCE() {
    return BackendUnitTest.BACKEND + BackendUnitTest.SOURCE;
  }

  static get PACKAGE_JSON_TPL_STRING() {
    let contentObj = {
      name: '{name}',
      version: '0.0.0',
      description: '{name}',
      script: {
        postinstall: '{path}',
        test: 'node-bin/test.sh',
      },
      dependencies: {},
      devDependencies: {},
    };

    return JSON.stringify(contentObj).concat(os.EOL);
  }

  static get HANDLER_TEST_TPL() {
    let content = [];

    content.push(`// THIS TEST WAS GENERATED AUTOMATICALLY ON ${new Date().toString()}`);
    content.push('');
    content.push('\'use strict\';');
    content.push('');
    content.push('import chai from \'chai\';');
    content.push('{import}');
    content.push('');
    content.push('// @todo: Add more advanced tests');
    content.push('suite(\'Handlers\', function() {');
    content.push('  test(\'Class Handler exists in {lambdaName} modules\', () => {');
    content.push('    chai.expect(typeof Handler).to.be.an(\'function\');');
    content.push('  });');
    content.push('});');
    content.push('');

    return content.join(os.EOL);
  }

  static get BOOTSTRAP_TEST_TPL() {
    let content = [];

    content.push(`// THIS TEST WAS GENERATED AUTOMATICALLY ON ${new Date().toString()}`);
    content.push('');
    content.push('\'use strict\';');
    content.push('');
    content.push('import chai from \'chai\';');
    content.push('{import}');
    content.push('');
    content.push('// @todo: Add more advanced tests');
    content.push('suite(\'Bootstraps\', function() {');
    content.push('  test(\' bootstrap exists in {lambdaName} modules\', () => {');
    content.push('    chai.expect(typeof bootstrap).to.be.an(\'object\');');
    content.push('  });');
    content.push('});');
    content.push('');

    return content.join(os.EOL);
  }

}
