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
      }, (err, content, next) => {
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
      (err, files) => {
        if (err) throw err;

        microAppBackendPaths = files.map((file) => {
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

    paths = this.getLambdaPaths().map((item) => {
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

    console.log(`Test <info>${filePath}/${name}</info> for lambda has been added`);
<<<<<<< .merge_file_u6y1Zm
    let sourcePath = filePath.replace(/.*Backend\/src\/(.*)$/, '$1');
    let codeSource = '';
=======
>>>>>>> .merge_file_1TVMpn

    switch (name) {
      case BackendUnitTest.HANDLER_TEST_FILENAME:
        codeSource = (sourcePath.indexOf(path.sep) !== -1) ?
          `import ${BackendUnitTest.HANDLER} from \'../../../node_modules/${sourcePath}/${BackendUnitTest.HANDLER}\';` :
          `import ${BackendUnitTest.HANDLER} from \'../../node_modules/${sourcePath}/${BackendUnitTest.HANDLER}\';`;

        return BackendUnitTest.HANDLER_TEST_TPL
          .replace(/\{import\}/g, codeSource)
          .replace(/\{lambdaName\}/g, this.getLambdaName(filePath));

      case BackendUnitTest.BOOTSTRAP_TEST_FILENAME:
        codeSource = (sourcePath.indexOf(path.sep) !== -1) ?
          `import ${BackendUnitTest.BOOTSTRAP} from \'../../../node_modules/${sourcePath}/${BackendUnitTest.BOOTSTRAP}\';` :
          `import ${BackendUnitTest.BOOTSTRAP} from \'../../node_modules/${sourcePath}/${BackendUnitTest.BOOTSTRAP}\';`;

        return BackendUnitTest.BOOTSTRAP_TEST_TPL
          .replace(/\{import\}/g, codeSource)
          .replace(/\{lambdaName\}/g, this.getLambdaName(filePath));

      case BackendUnitTest.FUNCTIONAL_TEST_FILENAME:
<<<<<<< .merge_file_u6y1Zm
=======
        let sourcePath = filePath.replace(/.*Backend\/src\/(.*)$/, '$1');
>>>>>>> .merge_file_1TVMpn
        let assertsPath = (sourcePath.indexOf(path.sep) !== -1) ? `../../../../test/${sourcePath}/test-asserts` : `../../../test/${sourcePath}/test-asserts`;

        return BackendUnitTest.FUNCTIONAL_TEST_TPL
          .replace(/\{nodeDirectory\}/g, `../../../node_modules/${this.getLambdaName(filePath)}/`)
          .replace(/\{assertDirectory\}/g, assertsPath);

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
      let functionalTestFilePath = path.join(toUpdateTests[i], BackendUnitTest.FUNCTIONAL_TEST_FILENAME);

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

      if (!fs.existsSync(functionalTestFilePath)) {

        fsExtra.createFileSync(functionalTestFilePath);

        this.copyTestAsserts(toUpdateTests[i]);

        fs.writeFileSync(
          functionalTestFilePath, this._genTestSuite(lambdasPathArray[i], BackendUnitTest.FUNCTIONAL_TEST_FILENAME)
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
    var microAppsArray = lambdas.map((element, index, arr) => {
      return element.replace(/.*\/src\/(.*)\/Tests\/.*/g, '$1');
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
<<<<<<< .merge_file_u6y1Zm
      let preinstallScriptDestination = path.join(nodeBinDestination, BackendUnitTest.PREINSTALL_FILENAME);
      let installScriptDestination = path.join(nodeBinDestination, BackendUnitTest.INSTALL_FILENAME);
=======
      let postinstallDestination = path.join(nodeBinDestination, BackendUnitTest.POSTINSTALL_FILENAME);
>>>>>>> .merge_file_1TVMpn
      let name = nodeBinDestination.replace(/.*\/src\/(.*)\/Tests\/.*/g, '$1');
      let resources = this.getResourcesByMicroAppName(name);

      if (!fs.existsSync(nodeBinDestination)) {
        fsExtra.copySync(BackendUnitTest.NODE_BIN_PATH, nodeBinDestination);
      }

      fsExtra.writeFileSync(
<<<<<<< .merge_file_u6y1Zm
        preinstallScriptDestination, this.updatePreinstallScriptPaths(name, this.getResourcesDeps(resources).join(' '), 'utf8')
      );
      fs.chmodSync(preinstallScriptDestination, 493);

      fsExtra.writeFileSync(
        installScriptDestination, this.updateInstallScriptPaths(name, this.getResourcesDeps(resources).join(' '), 'utf8')
      );
      fs.chmodSync(installScriptDestination, 493);
=======
        postinstallDestination, this.updateShellScriptPath(name, this.getLambdaDeps(resources).join(' '), 'utf8')
      );
      fs.chmodSync(postinstallDestination, 493);
>>>>>>> .merge_file_1TVMpn
    }

  }

  copyTestAsserts(destination) {
    let assertSampleDestination = path.join(destination, BackendUnitTest.TEST_ASSERTS_SAMPlE);
    let assertDestination = path.join(destination, BackendUnitTest.TEST_ASSERTS);

    fsExtra.ensureDirSync(assertDestination);

    if (!fs.existsSync(assertSampleDestination)) {
      fsExtra.copySync(BackendUnitTest.TEST_ASSERTS_SOURCE, assertSampleDestination);
    }
  }

  /**
   * @param {String[]} destinations
   */
  updatePackageJsons(destinations) {

    for (let destination of destinations) {

      let dest = path.join(destination, BackendUnitTest.PACKAGE_JSON);
      let name = dest.replace(/.*\/src\/(.*)\/Tests\/.*/g, '$1');
      let resources = this.getResourcesByMicroAppName(name);

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
          console.log(`Invalid path in resource.json:  <error>${resources[resource][lambda]}</error>`);
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

<<<<<<< .merge_file_u6y1Zm
  /**
   * @param {String} name
   * @param {String} lambdasDepsString
   * @returns {string}
   */
  updatePreinstallScriptPaths(name, lambdasDepsString) {

    let lambdasDepsArray = lambdasDepsString.split('../../Backend/src/');
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
      .replace(/\{path\}/g, result);
  }

  /**
   * @returns {string}
   */
  static get BOOTSTRAP() {
    return 'bootstrap';
=======
  updateShellScriptPath(name, lambdasDepsString) {

    let result = lambdasDepsString.replace(/(\s)/g, '\nnpm link ').replace(/^/, 'npm link ');

    return BackendUnitTest.POSTINSTALL_TPL
      .replace(/\{path\}/g, result);
>>>>>>> .merge_file_1TVMpn
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
  static get HANDLER() {
    return 'Handler';
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
  static get FUNCTIONAL_TEST_FILENAME() {
    return 'functional.spec.js';
  }

  /**
   * @returns {string}
   */
<<<<<<< .merge_file_u6y1Zm
  static get INSTALL_FILENAME() {
    return 'install.sh';
  }

  /**
   * @returns {string}
   */
  static get PREINSTALL_FILENAME() {
    return 'preinstall.sh';
=======
  static get POSTINSTALL_FILENAME() {
    return 'postinstall.sh';
>>>>>>> .merge_file_1TVMpn
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
  static get TEST_ASSERTS_SAMPlE() {
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
  static get TEST_ASSERTS_SOURCE() {
    return path.join(__dirname, '../', BackendUnitTest.TEST_ASSERTS_SAMPlE);
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
      version: '0.0.1',
<<<<<<< .merge_file_u6y1Zm
      description: 'Description of {name}',
      scripts: {
        preinstall: 'node-bin/preinstall.sh',
        install: 'node-bin/install.sh',
=======
      description: '{name}',
      scripts: {
>>>>>>> .merge_file_1TVMpn
        postinstall: 'node-bin/postinstall.sh',
        test: 'node-bin/test.sh',
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

<<<<<<< .merge_file_u6y1Zm
  static get INSTALL_TPL() {
=======
  static get POSTINSTALL_TPL() {
>>>>>>> .merge_file_1TVMpn
    let content = [];

    content.push('#!\/bin\/bash');
    content.push('');
<<<<<<< .merge_file_u6y1Zm
    content.push('npm link chai &&\\');
    content.push('npm link aws-sdk &&\\');
    content.push('npm link node-dir &&\\');
    content.push('npm link deepify &&\\');
=======
    content.push('npm link chai');
    content.push('npm link aws-sdk deepify node-dir');
>>>>>>> .merge_file_1TVMpn
    content.push('{path}');
    content.push('');

    return content.join(os.EOL);
  }

<<<<<<< .merge_file_u6y1Zm
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

=======
>>>>>>> .merge_file_1TVMpn
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
    content.push('suite(\'Handlers\', () => {');
<<<<<<< .merge_file_u6y1Zm
    content.push('  test(\'Class Handler exists in {lambdaName} module\', () => {');
=======
    content.push('  test(\'Class Handler exists in {lambdaName} modules\', () => {');
>>>>>>> .merge_file_1TVMpn
    content.push('    chai.expect(Handler).to.be.an(\'function\');');
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
    content.push('suite(\'Bootstraps\', () => {');
<<<<<<< .merge_file_u6y1Zm
    content.push('  test(\' bootstrap exists in {lambdaName} module\', () => {');
    content.push('    chai.expect(bootstrap).to.be.an(\'object\');');
=======
    content.push('  test(\' bootstrap exists in {lambdaName} modules\', () => {');
    content.push('    chai.expect(bootstrap).to.be.an(\'object\');');
    content.push('  });');
    content.push('});');
    content.push('');

    return content.join(os.EOL);
  }

  static get FUNCTIONAL_TEST_TPL() {
    let content = [];

    content.push(`// THIS TEST WAS GENERATED AUTOMATICALLY ON ${new Date().toString()}`);
    content.push('');
    content.push('\'use strict\';');
    content.push('');
    content.push('import chai from \'chai\';');
    content.push('import dir from \'node-dir\';');
    content.push('import path from \'path\';');
    content.push('import {Exec} from \'../../../node_modules/deepify/lib.compiled/Helpers/Exec\';');
    content.push('');
    content.push('let expect = chai.expect');
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
    content.push('    const TEST_ASSERTS_DIR = \'{assertDirectory}\';');
    content.push('    let dirPath = path.join(__dirname, TEST_ASSERTS_DIR);');
    content.push('');
    content.push('    dir.readFiles(dirPath, {');
    content.push('        match: /result.json$/,');
    content.push('        exclude: /^\\./,');
    content.push('      }, (err, content, next) => {');
    content.push('        if (err) throw err;');
    content.push('        expectedResultsArray.push(content);');
    content.push('        next();');
    content.push('      },');
    content.push('      (err, files) => {');
    content.push('        if (err) throw err;');
    content.push('        expectedResultsFilesArray = files;');
    content.push('      });');
    content.push('');
    content.push('    dir.readFiles(dirPath, {');
    content.push('        match: /payload.json$/,');
    content.push('        exclude: /^\\./,');
    content.push('      }, (err, content, next) => {');
    content.push('        if (err) throw err;');
    content.push('        inputEventsArray.push(content);');
    content.push('        next();');
    content.push('      },');
    content.push('      (err, files) => {');
    content.push('        if (err) throw err;');
    content.push('        inputEventsFilesArray = files;');
    content.push('        done();');
    content.push('      });');
>>>>>>> .merge_file_1TVMpn
    content.push('  });');
    content.push('');
    content.push('  test(\'Check relevant of data\', () => {');
    content.push('    for (i = 0; i < inputEventsFilesArray.length; i++) {');
    content.push('      expect(inputEventsFilesArray[i].replace(\'payload.json\', \'\')).to.equal(');
    content.push('        expectedResultsFilesArray[i].replace(\'result.json\', \'\')');
    content.push('      );');
    content.push('    }');
    content.push('  });');
    content.push('');
    content.push('  test(\'Check lambdas\', () => {');
    content.push('');
    content.push('    for (i = 0; i < inputEventsArray.length; i++) {');
    content.push('      let eventStr = \'\\\'\' + inputEventsArray[i].replace(/(\\r\\n|\\n|\\r)/gm, \'\') + \'\\\'\';');
    content.push('      let cmd = `deepify run-lambda {nodeDirectory} -e=${eventStr} -p`;');
    content.push('      let runLambdaCmd = new Exec(cmd);');
    content.push('');
    content.push('      runLambdaCmd.cwd = __dirname;');
    content.push('');
    content.push('      let lambdaResult = runLambdaCmd.runSync();');
    content.push('      let expectedResult = JSON.parse(expectedResultsArray[i]);');
    content.push('      let actualResult = (lambdaResult.failed) ? JSON.parse(lambdaResult.error) : JSON.parse(lambdaResult.result);');
    content.push('');
    content.push('      expect(actualResult).to.eql(expectedResult, `for payload from: ${inputEventsFilesArray[i]}`);');
    content.push('    }');
    content.push('');
    content.push('  });');
    content.push('');
    content.push('});');
    content.push('');

    return content.join(os.EOL);
  }

  static get FUNCTIONAL_TEST_TPL() {
    let content = [];

    content.push(`// THIS TEST WAS GENERATED AUTOMATICALLY ON ${new Date().toString()}`);
    content.push('');
    content.push('\'use strict\';');
    content.push('');
    content.push('import chai from \'chai\';');
    content.push('import dir from \'node-dir\';');
    content.push('import path from \'path\';');
    content.push('import {Exec} from \'../../../node_modules/deepify/lib.compiled/Helpers/Exec\';');
    content.push('');
    content.push('let expect = chai.expect');
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
    content.push('    const TEST_ASSERTS_DIR = \'{assertDirectory}\';');
    content.push('    let dirPath = path.join(__dirname, TEST_ASSERTS_DIR);');
    content.push('');
    content.push('    dir.readFiles(dirPath, {');
    content.push('        match: /result.json$/,');
    content.push('        exclude: /^\\./,');
    content.push('      }, (err, content, next) => {');
    content.push('        if (err) throw err;');
    content.push('        expectedResultsArray.push(content);');
    content.push('        next();');
    content.push('      },');
    content.push('      (err, files) => {');
    content.push('        if (err) throw err;');
    content.push('        expectedResultsFilesArray = files;');
    content.push('      });');
    content.push('');
    content.push('    dir.readFiles(dirPath, {');
    content.push('        match: /payload.json$/,');
    content.push('        exclude: /^\\./,');
    content.push('      }, (err, content, next) => {');
    content.push('        if (err) throw err;');
    content.push('        inputEventsArray.push(content);');
    content.push('        next();');
    content.push('      },');
    content.push('      (err, files) => {');
    content.push('        if (err) throw err;');
    content.push('        inputEventsFilesArray = files;');
    content.push('        done();');
    content.push('      });');
    content.push('  });');
    content.push('');
    content.push('  test(\'Check relevant of data\', () => {');
    content.push('    for (i = 0; i < inputEventsFilesArray.length; i++) {');
    content.push('      expect(inputEventsFilesArray[i].replace(\'payload.json\', \'\')).to.equal(');
    content.push('        expectedResultsFilesArray[i].replace(\'result.json\', \'\')');
    content.push('      );');
    content.push('    }');
    content.push('  });');
    content.push('');
    content.push('  test(\'Check lambdas\', () => {');
    content.push('');
    content.push('    for (i = 0; i < inputEventsArray.length; i++) {');
    content.push('      let eventStr = \'\\\'\' + inputEventsArray[i].replace(/(\\r\\n|\\n|\\r)/gm, \'\') + \'\\\'\';');
    content.push('      let cmd = `deepify run-lambda {nodeDirectory} -e=${eventStr} -p`;');
    content.push('      let runLambdaCmd = new Exec(cmd);');
    content.push('');
    content.push('      runLambdaCmd.cwd = __dirname;');
    content.push('');
    content.push('      let lambdaResult = runLambdaCmd.runSync();');
    content.push('      let expectedResult = JSON.parse(expectedResultsArray[i]);');
    content.push('      let actualResult = (lambdaResult.failed) ? JSON.parse(lambdaResult.error) : JSON.parse(lambdaResult.result);');
    content.push('');
    content.push('      expect(actualResult).to.eql(expectedResult, `for payload from: ${inputEventsFilesArray[i]}`);');
    content.push('    }');
    content.push('');
    content.push('  });');
    content.push('');
    content.push('});');
    content.push('');

    return content.join(os.EOL);
  }

}

