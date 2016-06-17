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

    if (fs.existsSync(this.microAppsPath)) {

      // match only filenames with a .txt extension and that don't start with a `.´
      dir.readFiles(this.microAppsPath, {
          match: /resources\.json$/,
          exclude: /^\./,
        }, (err, content, next) => {
          if (err) {
            throw err;
          }

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
        (err, files) => {
          if (err) throw err;

          microAppBackendPaths = files.map((file) => {
            return file.replace(RegExp(BackendUnitTest.BACKEND_RESOURCES, 'i'), '');
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
  getLambdaTestPaths(lambdasPaths, isChangeFileName = false) {
    var paths = [];

    paths = lambdasPaths.map((item) => {

      if (isChangeFileName) {
        item = item.replace('.es6', BackendUnitTest.TEST_FILE_EXTENSION);
      }

      return item.replace(BackendUnitTest.BACKEND_SOURCE, BackendUnitTest.BACKEND_UNIT_TEST_FOLDER);
    });

    return paths;
  }

  /**
   * @param {String} filePath
   * @returns {String}
   * @private
   */
  _genTestSuite(filePath, name, absoluteClassPath = '', absoluteTestPath = '') {

    console.log(`Test <info>${filePath}/${name}</info> for lambda has been added`);

    let nodeModulesPath = path.resolve(filePath.replace(
      /(.*)\/backend\/src\/.*$/, `$1${BackendUnitTest.BACKEND_TEST_FOLDER}${path.sep}node_modules`
    ));
    let testPathDir = path.dirname(absoluteTestPath);
    let classPathDir = path.dirname(absoluteClassPath)
    let relativePath = path.relative(testPathDir, classPathDir);
    let nodeRelativePath = path.relative(testPathDir, nodeModulesPath);

    switch (name) {
      case BackendUnitTest.HANDLER_TEST_FILENAME:
        let handlerSource = `import ${BackendUnitTest.HANDLER} from \'${relativePath}/${BackendUnitTest.HANDLER}\';`;
        let kernelSource = `import Kernel from \'${nodeRelativePath}/deep-framework/node_modules/deep-kernel\';`;
        let factorySource = `import KernelFactory from \'${
          nodeRelativePath.replace('../node_modules', 'common/KernelFactory')
          }\';`;

        return BackendUnitTest.HANDLER_TEST_TPL
          .replace(/\{importHandler\}/g, handlerSource)
          .replace(/\{importKernel\}/g, kernelSource)
          .replace(/\{importKernelFactory\}/g, factorySource)
          .replace(/\{lambdaName\}/g, this.getLambdaName(filePath));

      case BackendUnitTest.BOOTSTRAP_TEST_FILENAME:
        let bootstrapSource = `import ${BackendUnitTest.BOOTSTRAP} from \'${relativePath}/${BackendUnitTest.BOOTSTRAP}\';`;

        return BackendUnitTest.BOOTSTRAP_TEST_TPL
          .replace(/\{import\}/g, bootstrapSource)
          .replace(/\{lambdaName\}/g, this.getLambdaName(filePath));

      case BackendUnitTest.FUNCTIONAL_TEST_FILENAME:

        return BackendUnitTest.FUNCTIONAL_TEST_TPL
          .replace(/\{nodeSource\}/g, nodeRelativePath)
          .replace(/\{codeSource\}/g, relativePath);

      default:

        return BackendUnitTest.GENERIC_TEST_TPL
          .replace(/\{import\}/g, `import {${name}} from \'${relativePath}/${name}\';`)
          .replace(/\{lambdaName\}/g, this.getLambdaName(filePath))
          .replace(/\{ClassName\}/g, name);
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
   * @param {String[]} pathsArray
   * @returns {String[]}
   */
  getAllPaths(pathsArray) {
    let result = [];

    for (let pathItem of pathsArray) {
      result = result.concat(BackendUnitTest._lookupClassFiles(pathItem));
    }

    return result;
  }

  /**
   *
   * @param {Function} callback
   * @returns {String[]}
   */
  generateMissingTests(callback) {
    let lambdasPathArray = this.getLambdaPaths();
    let toUpdateTests = this.getLambdaTestPaths(lambdasPathArray);
    let es6ClassPaths = this.getAllPaths(lambdasPathArray);
    let es6TestClassPaths = this.getLambdaTestPaths(es6ClassPaths, true);
    let i = 0;

    let generatedTests = [];

    //iterate through handler&bootstrap tests;
    for (i = 0; i < toUpdateTests.length; i++) {

      let lambdaHandlerPath = path.join(lambdasPathArray[i], BackendUnitTest.HANDLER_TEST_FILENAME);
      let bootstrapTestFilePath = path.join(toUpdateTests[i], BackendUnitTest.BOOTSTRAP_TEST_FILENAME);
      let handlerTestFilePath = path.join(toUpdateTests[i], BackendUnitTest.HANDLER_TEST_FILENAME);
      let functionalTestFilePath = path.join(toUpdateTests[i], BackendUnitTest.FUNCTIONAL_TEST_FILENAME);

      if (!fs.existsSync(bootstrapTestFilePath)) {

        fsExtra.createFileSync(bootstrapTestFilePath);
        fs.writeFileSync(
          bootstrapTestFilePath, this._genTestSuite(
            lambdasPathArray[i], BackendUnitTest.BOOTSTRAP_TEST_FILENAME, lambdaHandlerPath, handlerTestFilePath
          )
        );

        generatedTests.push(bootstrapTestFilePath);
      }

      if (!fs.existsSync(handlerTestFilePath)) {

        fsExtra.createFileSync(handlerTestFilePath);
        fs.writeFileSync(
          handlerTestFilePath, this._genTestSuite(
            lambdasPathArray[i], BackendUnitTest.HANDLER_TEST_FILENAME, lambdaHandlerPath, handlerTestFilePath
          )
        );

        generatedTests.push(handlerTestFilePath);
      }

      if (!fs.existsSync(functionalTestFilePath)) {

        fsExtra.createFileSync(functionalTestFilePath);

        this.copyTestAsserts(toUpdateTests[i]);

        fs.writeFileSync(
          functionalTestFilePath, this._genTestSuite(
            lambdasPathArray[i], BackendUnitTest.FUNCTIONAL_TEST_FILENAME, lambdaHandlerPath, handlerTestFilePath
          )
        );

        generatedTests.push(handlerTestFilePath);
      }
    }

    //iterate through all *.es6 files;
    for (i = 0; i < es6TestClassPaths.length; i++) {
      if (!fs.existsSync(es6TestClassPaths[i])) {

        fsExtra.createFileSync(es6TestClassPaths[i]);
        fs.writeFileSync(
          es6TestClassPaths[i], this._genTestSuite(
            lambdasPathArray[i],
            BackendUnitTest.getClassName(es6TestClassPaths[i]),
            es6ClassPaths[i],
            es6TestClassPaths[i]
          )
        );

        generatedTests.push(es6TestClassPaths[i]);
      }
    }

    let pathsToUpdate = this.getPathsToUpdate(generatedTests);

    this.copyNodeBins(pathsToUpdate);
    this.copyCommonTestData(pathsToUpdate);
    this.updatePackageJsons(pathsToUpdate);
    this.updateCoverageConfigurationFiles(pathsToUpdate);

    //todo - move in other place
    callback();

    return generatedTests;
  }

  /**
   * @param {String[]} lambdas
   */
  getPathsToUpdate(lambdas) {
    var microAppsArray = lambdas.map((element, index, arr) => {
      return element.replace(/.*\/src\/(.*)\/tests\/.*/gi, '$1');
    });

    var uniqueArray = microAppsArray.filter((item, pos) => {
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

      let nodeBinDestination = path.join(destination, BackendUnitTest.NODE_BIN);

      if (!fs.existsSync(nodeBinDestination)) {
        fsExtra.copySync(BackendUnitTest.NODE_BIN_PATH, nodeBinDestination);
      }
    }

  }

  /**
   * @param {String[]} destinations
   */
  copyCommonTestData(destinations) {

    for (let destination of destinations) {

      if (!fs.existsSync(path.join(destination, BackendUnitTest.COMMON_DATA_DESTINATION_FOLDER))) {
        fsExtra.copySync(BackendUnitTest.COMMON_DATA_SOURCE_PATH, path.join(destination, './test'));
      }
    }

  }

  copyTestAsserts(destination) {
    let assertSampleDestination = path.join(destination, BackendUnitTest.TEST_ASSERTS_SAMPLE);
    let assertDestination = path.join(destination, BackendUnitTest.TEST_ASSERTS);

    if (!fs.existsSync(assertSampleDestination)) {
      fsExtra.copySync(BackendUnitTest.TEST_ASSERTS_SAMPLE_SOURCE, assertSampleDestination);
    }

    if (!fs.existsSync(assertDestination)) {
      fsExtra.copySync(BackendUnitTest.TEST_ASSERTS_SOURCE, assertDestination);
    }
  }

  /**
   * @param {String[]} destinations
   */
  updatePackageJsons(destinations) {

    for (let destination of destinations) {

      let dest = path.join(destination, BackendUnitTest.PACKAGE_JSON);
      let name = dest.replace(/.*\/src\/(.*)\/tests\/.*/gi, '$1');
      let resources = this.getResourcesByMicroAppName(name);

      fsExtra.writeJsonSync(dest, JSON.parse(this.updatePackageJson(name, this.getLambdaDeps(resources).join(' '))));
    }
  }

  /**
   * @param {String[]} destinations
   */
  updateCoverageConfigurationFiles(destinations) {

    for (let destination of destinations) {

      let istanbulDestination = path.join(destination, BackendUnitTest.ISTANBUL_CONFIG);
      let babelRCDestination = path.join(destination, BackendUnitTest.BABEL_RC);

      if (!fs.existsSync(istanbulDestination)) {
        fsExtra.copySync(BackendUnitTest.ISTANBUL_CONFIG_SOURCE, istanbulDestination);
      }

      if (!fs.existsSync(babelRCDestination)) {
        fsExtra.copySync(BackendUnitTest.BABEL_RC_SOURCE, babelRCDestination);
      }
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
    let result = [];

    for (let resource in resources) {

      for (let lambda in resources[resource]) {

        result.push(path.join(BackendUnitTest.RELATIVE_BACKEND, resources[resource][lambda]));
      }

    }

    return result;
  }

  /**
   * @param {Object} resources
   * @returns {Array}
   */
  getResourcesDeps(resources) {
    let result = [];

    for (let resource in resources) {
      for (let lambda in resources[resource]) {
        if (resources[resource][lambda].split(path.sep).length < 3) {
          console.log(`Invalid structure/path in resource.json:  <error>${resources[resource][lambda]}</error>`);
          result.push(path.join(BackendUnitTest.RELATIVE_BACKEND, resources[resource][lambda]));
        } else {
          let lastIndex = resources[resource][lambda].lastIndexOf(path.sep);
          let resPath = resources[resource][lambda].substring(0, lastIndex);
          result.push(path.join(BackendUnitTest.RELATIVE_BACKEND, resPath));
          break;
        }
      }
    }

    return result;
  }

  /**
   * @param {String} name
   * @param {String} lambdasDepsString
   * @returns {string}
   */
  updatePackageJson(name, lambdasDepsString) {
    let packageName = `${name}BackendTest`.replace(/([A-Z]+)/g, (x, y) => {
      return '-' + y.toLowerCase();
    }).replace(/^-/, '');

    return BackendUnitTest.PACKAGE_JSON_TPL_STRING
      .replace(/\{name\}/g, packageName);
  }

  /**
   * @param {String} name
   * @param {String} lambdasDepsString
   * @returns {string}
   */
  updatePreinstallScriptPaths(name, lambdasDepsString) {

    let lambdasDepsArray = lambdasDepsString.split('../../backend/src/');
    let result = '';

    for (let lambdaDeps of lambdasDepsArray) {
      lambdaDeps = lambdaDeps.trim();
      if (typeof lambdaDeps !== undefined && lambdaDeps !== '') {
        result = result + `[ -e "./node_modules/${lambdaDeps}" ] && rm -f "./node_modules/${lambdaDeps}";\n\n`;
      }
    }

    return BackendUnitTest.PREINSTALL_TPL
      .replace(/\{resources\}/g, result);
  }

  /**
   * @param {String} name
   * @param {String} lambdasDepsString
   * @returns {string}
   */
  updateInstallScriptPaths(name, lambdasDepsString) {
    let result = lambdasDepsString
      .replace(/(\s)/g, '\nln -s ../')
      .replace(/^/, 'ln -s ../')
      .replace(/\n/g, ' ./node_modules &&\\\n')
      .replace(/$/g, ' ./node_modules');

    return BackendUnitTest.INSTALL_TPL
      .replace(/\{path\}/gi, result);
  }

  /**
   * @returns {string}
   */
  static get BOOTSTRAP() {
    return 'bootstrap';
  }

  updateShellScriptPath(name, lambdasDepsString) {

    let result = lambdasDepsString.replace(/(\s)/g, '\nnpm link ').replace(/^/, 'npm link ');

    return BackendUnitTest.POSTINSTALL_TPL
      .replace(/\{path\}/gi, result);
  }

  /**
   * @returns {string}
   */
  static get BOOTSTRAP_TEST_FILENAME() {
    return `bootstrap${BackendUnitTest.TEST_FILE_EXTENSION}`;
  }

  /**
   * @returns {string}
   */
  static get HANDLER() {
    return 'Handler';
  }

  /**
   * @returns {string}
   */
  static get HANDLER_TEST_FILENAME() {
    return `handler${BackendUnitTest.TEST_FILE_EXTENSION}`;
  }

  /**
   * @returns {string}
   */
  static get FUNCTIONAL_TEST_FILENAME() {
    return `functional${BackendUnitTest.TEST_FILE_EXTENSION}`;
  }

  /**
   * @returns {string}
   * @constructor
   */
  static get TEST_FILE_EXTENSION() {
    return '.spec.js';
  }

  /**
   * @returns {string}
   */
  static get INSTALL_FILENAME() {
    return 'install.sh';
  }

  /**
   * @returns {string}
   */
  static get PREINSTALL_FILENAME() {
    return 'preinstall.sh';
  }

  static get POSTINSTALL_FILENAME() {
    return 'postinstall.sh';
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
  static get COMMON_DATA() {
    return '/common-test-data';
  }

  /**
   * @returns {string}
   */
  static get COMMON_DATA_SOURCE_PATH() {
    return path.join(__dirname, '../', BackendUnitTest.COMMON_DATA);
  }

  /**
   * @returns {string}
   */
  static get COMMON_DATA_DESTINATION_FOLDER() {
    return '/common';
  }

  /**
   * @returns {string}
   */
  static get BACKEND() {
    return '/backend';
  }

  /**
   * @returns {string}
   */
  static get RELATIVE_BACKEND() {
    return '../../backend';
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
    return '/tests/backend/test';
  }

  /**
   * @returns {string}
   */
  static get BACKEND_TEST_FOLDER() {
    return '/tests/backend';
  }

  /**
   * @returns {string}
   */
  static get TEST_ASSERTS_SAMPLE() {
    return 'test-asserts-sample';
  }

  /**
   * @returns {string}
   */
  static get TEST_ASSERTS() {
    return 'test-asserts';
  }

  /**
   * @returns {string}
   */
  static get TEST_ASSERTS_SAMPLE_SOURCE() {
    return path.join(__dirname, '../', BackendUnitTest.TEST_ASSERTS_SAMPLE);
  }

  /**
   * @returns {string}
   */
  static get TEST_ASSERTS_SOURCE() {
    return path.join(__dirname, '../', BackendUnitTest.TEST_ASSERTS);
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
  static get CONFIGURATION_FILES_FOLDER() {
    return 'coverage-configuration-files';
  }

  /**
   * @returns {string}
   */
  static get ISTANBUL_CONFIG() {
    return '.istanbul.yml';
  }

  /**
   * @returns {string}
   */
  static get ISTANBUL_CONFIG_SOURCE() {
    return path.join(__dirname, '../', BackendUnitTest.CONFIGURATION_FILES_FOLDER, BackendUnitTest.ISTANBUL_CONFIG);
  }

  /**
   * @returns {string}
   */
  static get BABEL_RC() {
    return '.babelrc';
  }

  /**
   * @returns {string}
   */
  static get BABEL_RC_SOURCE() {
    return path.join(__dirname, '../', BackendUnitTest.CONFIGURATION_FILES_FOLDER, BackendUnitTest.BABEL_RC);
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

  /**
   * @returns {string}
   * @constructor
   */
  static get INSTALL_TPL() {
    let content = [];

    content.push('#!\/bin\/bash');
    content.push('');
    content.push('npm link chai &&\\');
    content.push('npm link aws-sdk &&\\');
    content.push('npm link node-dir &&\\');
    content.push('npm link deepify &&\\');
    content.push('npm link babel-preset-es2015 &&\\');
    content.push('{path}');
    content.push('');

    return content.join(os.EOL);
  }

  /**
   * @returns {string}
   * @constructor
   */
  static get PREINSTALL_TPL() {
    let content = [];

    content.push('#!\/bin\/bash');
    content.push('');
    content.push('[ -e "./node_modules/deepify" ] && rm -f "./node_modules/deepify";');
    content.push('');
    content.push('{resources}');
    content.push('exit 0');
    content.push('');

    return content.join(os.EOL);
  }

  /**
   * @returns {string}
   * @constructor
   */
  static get GENERIC_TEST_TPL() {
    let content = [];

    content.push(`// THIS TEST WAS GENERATED AUTOMATICALLY ON ${new Date().toString()}`);
    content.push('');
    content.push('\'use strict\';');
    content.push('');
    content.push('import chai from \'chai\';');
    content.push('{import}');
    content.push('');
    content.push('// @todo: Add more advanced tests');
    content.push('suite(\'{ClassName}\', () => {');
    content.push('  test(\'Class {ClassName} exists\', () => {');
    content.push('    chai.expect({ClassName}).to.be.an(\'function\');');
    content.push('  });');
    content.push('});');
    content.push('');

    return content.join(os.EOL);
  }

  /**
   * @returns {string}
   * @constructor
   */
  static get HANDLER_TEST_TPL() {
    let content = [];

    content.push(`// THIS TEST WAS GENERATED AUTOMATICALLY ON ${new Date().toString()}`);
    content.push('');
    content.push('\'use strict\';');
    content.push('');
    content.push('import chai from \'chai\';');
    content.push('{importHandler}');
    content.push('{importKernel}');
    content.push('{importKernelFactory}');
    content.push('');
    content.push('// @todo: Add more advanced tests');
    content.push('suite(\'Handlers\', () => {');
    content.push('  let handler, kernelInstance;');
    content.push('');
    content.push('  test(\'Class Handler exists in {lambdaName} module\', () => {');
    content.push('    chai.expect(Handler).to.be.an(\'function\');');
    content.push('  });');
    content.push('');
    content.push('  test(\'Load Kernel by using Kernel.load()\', (done) => {');
    content.push('    let callback = (backendKernel) => {');
    content.push('      kernelInstance = backendKernel;');
    content.push('');
    content.push('      chai.assert.instanceOf(');
    content.push('        backendKernel, Kernel, \'backendKernel is an instance of Kernel\'');
    content.push('      );');
    content.push('');
    content.push('      // complete the async');
    content.push('      done();');
    content.push('    };');
    content.push('');
    content.push('    KernelFactory.create(callback);');
    content.push('  });');
    content.push('');
    content.push('  test(\'Check Handler constructor\', () => {');
    content.push('    handler = new Handler(kernelInstance);');
    content.push('');
    content.push('    chai.expect(handler).to.be.an.instanceof(Handler);');
    content.push('  });');
    content.push('');
    content.push('  test(\'Check handle method exists\', () => {');
    content.push('    chai.expect(handler.handle).to.be.an(\'function\');');
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
  static get BOOTSTRAP_TEST_TPL() {
    let content = [];

    content.push('\'use strict\';');
    content.push('');
    content.push('import chai from \'chai\';');
    content.push('{import}');
    content.push('');
    content.push('suite(\'Bootstraps\', () => {');
    content.push('  test(\' bootstrap exists in {lambdaName} module\', () => {');
    content.push('    chai.expect(bootstrap).to.be.an(\'object\');');
    content.push('  });');
    content.push('});');
    content.push('');

    return content.join(os.EOL);
  }

  /**
   * @returns {string}
   * @constructor
   */
  static get FUNCTIONAL_TEST_TPL() {
    let content = [];

    content.push('/*jshint evil:true */');
    content.push('');
    content.push('\'use strict\';');
    content.push('');
    content.push('import chai from \'chai\';');
    content.push('import dir from \'node-dir\';');
    content.push('import path from \'path\';');
    content.push('import {Exec} from \'{nodeSource}/deepify/lib.compiled/Helpers/Exec\';');
    content.push('');
    content.push('suite(\'Functional tests\', () => {');
    content.push('');
    content.push('  let inputEventsArray = [];');
    content.push('  let inputEventsFilesArray = [];');
    content.push('  let expectedResultsArray = [];');
    content.push('  let expectedResultsFilesArray = [];');
    content.push('  let i = 0;');
    content.push('');
    content.push('  suiteSetup((done) => {');
    content.push('');
    content.push('    const TEST_ASSERTS_DIR = \'./test-asserts\';');
    content.push('    let dirPath = path.join(__dirname, TEST_ASSERTS_DIR);');
    content.push('');
    content.push('    dir.readFiles(dirPath, {');
    content.push('        match: /result.json$/,');
    content.push('        exclude: /^\\./,');
    content.push('      }, (err, content, next) => {');
    content.push('        if (err) {');
    content.push('          throw err;');
    content.push('        }');
    content.push('');
    content.push('        expectedResultsArray.push(content);');
    content.push('        next();');
    content.push('      },');
    content.push('      (err, files) => {');
    content.push('        if (err) {');
    content.push('          throw err;');
    content.push('        }');
    content.push('');
    content.push('        expectedResultsFilesArray = files;');
    content.push('      });');
    content.push('');
    content.push('    dir.readFiles(dirPath, {');
    content.push('        match: /payload.json$/,');
    content.push('        exclude: /^\\./,');
    content.push('      }, (err, content, next) => {');
    content.push('        if (err) {');
    content.push('          throw err;');
    content.push('        }');
    content.push('');
    content.push('        inputEventsArray.push(content);');
    content.push('        next();');
    content.push('      },');
    content.push('      (err, files) => {');
    content.push('        if (err) {');
    content.push('          throw err;');
    content.push('        }');
    content.push('');
    content.push('        inputEventsFilesArray = files;');
    content.push('        done();');
    content.push('      });');
    content.push('  });');
    content.push('');
    content.push('  test(\'Check relevant of data\', () => {');
    content.push('    for (i = 0; i < inputEventsFilesArray.length; i++) {');
    content.push('      chai.expect(inputEventsFilesArray[i].replace(\'payload.json\', \'\')).to.equal(');
    content.push('        expectedResultsFilesArray[i].replace(\'result.json\', \'\')');
    content.push('      );');
    content.push('    }');
    content.push('  });');
    content.push('');
    content.push('  test(\'Check lambdas\', () => {');
    content.push('');
    content.push('    for (i = 0; i < inputEventsArray.length; i++) {');
    content.push('      let eventStr = \'\\\'\' + inputEventsArray[i].replace(/(\\r\\n|\\n|\\r)/gm, \'\') + \'\\\'\';');
    content.push('      let cmd = `deepify lambda {codeSource} -e=${eventStr} -p`;');
    content.push('      let runLambdaCmd = new Exec(cmd);');
    content.push('');
    content.push('      runLambdaCmd.cwd = __dirname;');
    content.push('');
    content.push('      let lambdaResult = runLambdaCmd.runSync();');
    content.push('      let expectedResult = JSON.parse(expectedResultsArray[i]);');
    content.push('      let actualResult = (lambdaResult.failed) ?');
    content.push('        JSON.parse(lambdaResult.error)');
    content.push('        : ( typeof JSON.parse(lambdaResult.result) === \'string\') ?');
    content.push('        JSON.parse(JSON.parse(lambdaResult.result))');
    content.push('        : JSON.parse(lambdaResult.result);');
    content.push('');
    content.push('      if (expectedResult._ignore) {');
    content.push('');
    content.push('        var ignoreKeys = (result, ignoreKeysArray) => {');
    content.push('');
    content.push('          for(let ignoreKey of ignoreKeysArray) {');
    content.push('            eval(`delete result.${ignoreKey}`);');
    content.push('          }');
    content.push('');
    content.push('          return result;');
    content.push('        };');
    content.push('');
    content.push('        ignoreKeys(actualResult, expectedResult._ignore);');
    content.push('');
    content.push('        delete expectedResult._ignore;');
    content.push('      }');
    content.push('');
    content.push('      chai.expect(actualResult).to.eql(expectedResult, `for payload from: ${inputEventsFilesArray[i]}`);');
    content.push('    }');
    content.push('');
    content.push('  });');
    content.push('');
    content.push('});');
    content.push('');

    return content.join(os.EOL);
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

    if (fs.existsSync(dir)) {
      files = fs.readdirSync(dir);
    } else {
      console.log(`Invalid structure/path in resource.json for:  <error>${dir}</error>`);
      process.exit(1);
    }

    for (let i in files) {
      if (!files.hasOwnProperty(i)) {
        continue;
      }

      let filename = files[i];
      let filepath = path.join(dir, filename);

      if (fs.statSync(filepath).isDirectory() && filepath.indexOf('node_modules') === -1) {
        BackendUnitTest._lookupClassFiles(filepath, files_);
      } else {
        if (!BackendUnitTest._isClassFile(filename)) {
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
    return /^[A-Z]/.test(filename) && !/exception\.es6$/i.test(filename)
      && !/bootstrap\.es6$/i.test(filename) && !/Handler\.es6$/i.test(filename)
      && path.extname(filename) === '.es6';
  }

  /**
   * @param {String} fullPath
   * @returns {string}
   */
  static getClassName(fullPath) {
    return path.basename(fullPath).replace(BackendUnitTest.TEST_FILE_EXTENSION, '');
  }


}
