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

    this.microservicesPath = path;

    this.getBackendInfo(callback);
  }

  /**
   * @param {String} mPath
   */
  set microservicesPath(mPath) {
    this._microservicePath = path.join(mPath, BackendUnitTest.SOURCE);
  }

  /**
   * @returns {String}
   */
  get microservicesPath() {
    return this._microservicePath;
  }

  /**
   * @param {Function} callback
   */
  getBackendInfo(callback) {

    var microserviceBackendContent = [];
    var microserviceBackendPaths = [];
    var microserviceBackend = [];

    var _this = this;

    // match only filenames with a .txt extension and that don't start with a `.´
    dir.readFiles(this.microservicesPath, {
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

        microserviceBackendContent.push(resources);

        next();
      },
      function (err, files) {
        if (err) throw err;

        microserviceBackendPaths = files.map(function (file) {
          return file.replace(BackendUnitTest.BACKEND_RESOURCES, '');
        });

        for (var i = 0; i < microserviceBackendPaths.length; i++) {
          microserviceBackend.push({
            path: microserviceBackendPaths[i],
            resources: microserviceBackendContent[i],
          });
        }

        _this._microserviceBackend = microserviceBackend;

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

    for (var i = 0; i < this._microserviceBackend.length; i++) {

      for (var resourceName in this._microserviceBackend[i].resources) {

        if (this._microserviceBackend[i].resources.hasOwnProperty(resourceName)) {

          for (var lambdaName in this._microserviceBackend[i].resources[resourceName]) {

            if (this._microserviceBackend[i].resources[resourceName].hasOwnProperty(lambdaName)) {

              lambdaPaths.push(path.join(
                this._microserviceBackend[i].path,
                BackendUnitTest.BACKEND,
                this._microserviceBackend[i].resources[resourceName][lambdaName]
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
      return item.replace(BackendUnitTest.BACKEND_SOURCE, BackendUnitTest.TESTS_BACKEND);
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
    let toGenerateTests = this.getLambdaTestPaths();
    let generatedTests = [];

    for (let i = 0; i < toGenerateTests.length; i++) {

      let bootstrapTestFilePath = path.join(toGenerateTests[i], BackendUnitTest.BOOTSTRAP_TEST_FILENAME);
      let handlerTestFilePath = path.join(toGenerateTests[i], BackendUnitTest.HANDLER_TEST_FILENAME);

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

    callback();

    return generatedTests;
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
  static get BACKEND() {
    return '/Backend';
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
  static get TESTS_BACKEND() {
    return '/Tests/Backend/test';
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
