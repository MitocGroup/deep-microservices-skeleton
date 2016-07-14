/*jshint bitwise: false*/

/**
 * Created by vcernomschi on 4/26/16..
 */

'use strict';

import path from 'path';
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

          let name = content.replace(/[\s\S]+export\s+default\s+'(.*)';[\n\r]?/g, '$1');

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
   * @returns {String[]}
   */
  getAllModelsPaths() {
    return this.getAllPathByPattern(FrontendUnitTest.FRONTEND_MODELS);
  }

  /**
   * @returns {String[]}
   */
  getAllControllersPaths() {
    return this.getAllPathByPattern(FrontendUnitTest.FRONTEND_CONTROLLERS);
  }

  /**
   * @returns {String[]}
   */
  getAllDirectiviesPaths() {
    return this.getAllPathByPattern(FrontendUnitTest.FRONTEND_DIRECTIVES);
  }

  /**
   * @returns {String[]}
   */
  getAllServicesPaths() {
    return this.getAllPathByPattern(FrontendUnitTest.FRONTEND_SERVICES);
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
          moduleNamePath: FrontendUnitTest.getModuleNameFullPath(microAppFrontendPath.path),
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

      let relativePath = path.relative(
        path.dirname(healthCheckPath.path),
        path.dirname(healthCheckPath.moduleNamePath)
      );

      relativePath = path.join(relativePath, 'name');

      fsExtra.createFileSync(healthCheckPath.path);
      fs.writeFileSync(
        healthCheckPath.path,
        templateObj.render({
          angularModuleName: healthCheckPath.name,
          moduleNamePath: relativePath
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
    let controllerTestPaths = this.generateControllerTests(this.getAllControllersPaths(), true);
    let serviceTestPaths = this.generateServiceTests(this.getAllServicesPaths(), true);
    let directiveTestPaths = this.generateDirectiveTests(this.getAllDirectiviesPaths(), true);

    generatedTests = generatedTests.concat(
      healthCheckTestPaths,
      modelTestPaths,
      filterTestPaths,
      controllerTestPaths,
      serviceTestPaths,
      directiveTestPaths
    );

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

        let testContent;

        try {
          testContent = FrontendUnitTest.createTestWithRelativePath(type, paths[index], elem);

          if (testContent && testContent.length > 0) {
            fsExtra.createFileSync(elem);
            fs.writeFileSync(elem, testContent);

            console.log(`Test <info>${elem}</info> for has been added`);

            genTests.push(elem);
          }
        } catch(exception) {
          console.log(`Test <warn>${elem}</warn> has not been added due to reason: <warn>[${exception.message}]</warn>`);
        }

      }

    }

    return genTests;
  }

  /**
   * Generate model's tests and return full paths of generated tests
   * @param {String[]} modelPaths
   * @param {Boolean} isChangeFileName
   * @returns {Array}
   */
  generateModelTests(modelPaths, isChangeFileName = true) {
    return this.generateTests(FrontendUnitTest.MODEL, modelPaths, isChangeFileName);
  }

  /**
   * Generate filter's tests and return full paths of generated tests
   * @param {String[]} filterPaths
   * @param {Boolean} isChangeFileName
   * @returns {Array}
   */
  generateFilterTests(filterPaths, isChangeFileName = true) {
    return this.generateTests(FrontendUnitTest.FILTER, filterPaths, isChangeFileName);
  }

  /**
   * Generate controller's tests and return full paths of generated tests
   * @param {String[]} contollerPaths
   * @param {Boolean} isChangeFileName
   * @returns {Array}
   */
  generateControllerTests(controllerPaths, isChangeFileName = true) {
    return this.generateTests(FrontendUnitTest.CONTROLLER, controllerPaths, isChangeFileName);
  }

  /**
   * Generate service's tests and return full paths of generated tests
   * @param {String[]} servicePaths
   * @param {Boolean} isChangeFileName
   * @returns {Array}
   */
  generateServiceTests(servicePaths, isChangeFileName = true) {
    return this.generateTests(FrontendUnitTest.SERVICE, servicePaths, isChangeFileName);
  }

  /**
   * Generate directive's tests and return full paths of generated tests
   * @param {String[]} directivePaths
   * @param {Boolean} isChangeFileName
   * @returns {Array}
   */
  generateDirectiveTests(directivePaths, isChangeFileName = true) {
    return this.generateTests(FrontendUnitTest.DIRECTIVE, directivePaths, isChangeFileName);
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
      let name = karmaDestination.replace(/.*\/src\/(.*)\/tests\/.*/gi, '$1');
      let healthCheckObj = this.getHealthCheckObjectByName(name);
      let hasStripeDependency = false;

      if (!FrontendUnitTest.accessSync(karmaDestination)) {

        fsExtra.createFileSync(karmaDestination);

        let templateObj = Twig.twig({
          data: fs.readFileSync(FrontendUnitTest.KARMA_CONFIG_TPL_PATH, 'utf8').toString(),
        });

        if (healthCheckObj && healthCheckObj.hasOwnProperty('dependencies') &&
          healthCheckObj.dependencies.hasOwnProperty('angular-stripe')) {
          hasStripeDependency = true;
        }

        let karmaContentString = templateObj.render({
          hasStripeDependency: hasStripeDependency,
        });

        fs.writeFileSync(karmaDestination, karmaContentString);
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
  static addDependencies(contentObj, dependenciesObj) {

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

    FrontendUnitTest.addDependencies(packageContentObject, healthCheckObj);

    fsExtra.writeJsonSync(
      filePath,
      packageContentObject
    );
  }

  /**
   * Return array of frontend package.json paths
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
   * List all files in a directory in Node.js recursively in a synchronous fashion
   * @param {String} microAppPath
   * @returns {Array}
   */
  static listFilesSync(dir, filelist) {

    let files = fs.readdirSync(dir);
    filelist = filelist || [];

    files.forEach(function (file) {
      if (fs.statSync(dir + path.sep + file).isDirectory()) {
        filelist = FrontendUnitTest.listFilesSync(dir + path.sep + file, filelist);
      }
      else {
        filelist.push(path.join(dir, file));
      }
    });

    return filelist;
  }

  /**
   * @param {String} dir
   * @returns {String}
   */
  static getModuleNameFullPath(dir) {

    let files = FrontendUnitTest.listFilesSync(path.join(dir, 'frontend', 'js', 'app'));

    for (let file of files) {
      if (/name\.js/gmi.test(file)) {
        return file;
      }
    }
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

  /**
   * @param {String} type
   * @param {String} absoluteClassPath
   * @param {String} absoluteTestPath
   * @returns {String}
   */
  static createTestWithRelativePath(type, absoluteClassPath = '', absoluteTestPath = '') {
    let templateObj, services, providers, injectedDepsArray;
    let name = FrontendUnitTest.getClassName(absoluteTestPath);
    let testPathDir = path.dirname(absoluteTestPath);
    let classPathDir = path.dirname(absoluteClassPath);
    let relativePath = path.relative(testPathDir, classPathDir);
    let moduleNamePath = relativePath.replace(new RegExp(`${type}.+`, 'i'), 'name');
    let hasInjectedServices = FrontendUnitTest.hasInjectedServices(absoluteClassPath);
    let hasInjectedProviders = FrontendUnitTest.hasInjectedProviders(absoluteClassPath);
    let hasImports = FrontendUnitTest.hasImports(absoluteClassPath);

    switch (type) {

      case FrontendUnitTest.CONTROLLER:
        let controllerName = FrontendUnitTest.getControllerName(absoluteClassPath);
        injectedDepsArray = FrontendUnitTest.getInjectedDepsForCtrl(absoluteClassPath);
        services = FrontendUnitTest.fetchServices(injectedDepsArray);
        providers = FrontendUnitTest.fetchProviders(injectedDepsArray);
        let otherDeps = FrontendUnitTest.skipScopeServices(
          FrontendUnitTest.diffArray(injectedDepsArray, services, providers)
        );

        //@todo - need to clarify if we want to force this validation
        if (controllerName.indexOf(name) === -1) {
          throw new Error(`Controller name doesn't match to file name: ${absoluteClassPath}. Please refactor.`);
        }

        templateObj = Twig.twig({
          data: fs.readFileSync(FrontendUnitTest.CONTROLLER_TPL_PATH, 'utf8').toString(),
        });

        return templateObj.render({
          ControllerName: controllerName,
          ClassName: name,
          moduleNamePath: moduleNamePath,
          services: services,
          providers: providers,
          otherDeps: otherDeps,
          staticGetters: FrontendUnitTest.getStaticGetters(absoluteClassPath),
        });

      case FrontendUnitTest.DIRECTIVE:
        let directiveName = FrontendUnitTest.getDirectiveName(absoluteClassPath);
        let externalTemplatePath = FrontendUnitTest.getExternalTemplatePath(absoluteClassPath);
        let restrictType = FrontendUnitTest.getRestrictType(absoluteClassPath);
        let directiveController = FrontendUnitTest.getDirectiveController(absoluteClassPath);
        injectedDepsArray = FrontendUnitTest.getInjectedDepsForCtrl(absoluteClassPath);
        services = FrontendUnitTest.fetchServices(injectedDepsArray);
        providers = FrontendUnitTest.fetchProviders(injectedDepsArray);

        if (hasImports) {
          throw new Error(`Directive has import to external files`);
        }

        if (hasInjectedProviders) {
          throw new Error(`Directive has dependencies to unmocked providers`);
        }

        if (!directiveName || directiveName.length === 0) {
          let importString = (FrontendUnitTest.isDefaultExport(absoluteClassPath)) ?
            `import ${name} from \'${relativePath}/${name}\';` :
            `import {${name}} from \'${relativePath}/${name}\';`;

          templateObj = Twig.twig({
            data: fs.readFileSync(FrontendUnitTest.DIRECTIVE_AS_CLASS_TPL_PATH, 'utf8').toString(),
          });

          return templateObj.render({
            ClassName: name,
            import: importString,
            objectName: FrontendUnitTest.lowerCaseFirstChar(name),
            staticGetters: FrontendUnitTest.getStaticGetters(absoluteClassPath),
          });
        }

        templateObj = Twig.twig({
          data: fs.readFileSync(FrontendUnitTest.DIRECTIVE_TPL_PATH, 'utf8').toString(),
        });

        return templateObj.render({
          directiveName: directiveName,
          directive: FrontendUnitTest.toKebabCase(directiveName),
          moduleNamePath: moduleNamePath,
          services: services,
          providers: providers,
          templateUrl: externalTemplatePath,
          restrictType: restrictType,
          directiveController: directiveController,
        });

      case FrontendUnitTest.SERVICE:
        let serviceName = FrontendUnitTest.getServiceName(absoluteClassPath);
        injectedDepsArray = FrontendUnitTest.getInjectedDepsForService(absoluteClassPath);
        services = FrontendUnitTest.fetchServices(injectedDepsArray);
        providers = FrontendUnitTest.fetchProviders(injectedDepsArray);

        //create service test with injected services or providers
        if (serviceName === 'msAuthentication' || hasImports) {
          throw new Error(`Service has import to external files or service name is "msAuthentication"`);
        }

        if (!serviceName || serviceName.length === 0) {
          let importString = (FrontendUnitTest.isDefaultExport(absoluteClassPath)) ?
            `import ${name} from \'${relativePath}/${name}\';` :
            `import {${name}} from \'${relativePath}/${name}\';`;

          templateObj = Twig.twig({
            data: fs.readFileSync(FrontendUnitTest.SERVICE_AS_CLASS_TPL_PATH, 'utf8').toString(),
          });

          return templateObj.render({
            ClassName: name,
            import: importString,
            objectName: FrontendUnitTest.lowerCaseFirstChar(name),
            staticGetters: FrontendUnitTest.getStaticGetters(absoluteClassPath),
          });
        } else {

          templateObj = Twig.twig({
            data: fs.readFileSync(FrontendUnitTest.SERVICE_TPL_PATH, 'utf8').toString(),
          });

          return templateObj.render({
            ClassName: name,
            ServiceName: serviceName,
            serviceName: FrontendUnitTest.lowerCaseFirstChar(serviceName),
            moduleNamePath: moduleNamePath,
            services: services,
            providers: providers,
            staticGetters: FrontendUnitTest.getStaticGetters(absoluteClassPath),
          });
        }

      case FrontendUnitTest.MODEL:
        let service = FrontendUnitTest.isService(absoluteClassPath);

        //create model test as for angular service
        if (service) {
          templateObj = Twig.twig({
            data: fs.readFileSync(FrontendUnitTest.MODEL_WITH_SERVICE_TPL_PATH, 'utf8').toString(),
          });

          return templateObj.render({
            ClassName: name,
            ServiceName: service,
            serviceName: FrontendUnitTest.lowerCaseFirstChar(service),
            moduleNamePath: moduleNamePath,
          });
        }

        templateObj = Twig.twig({
          data: fs.readFileSync(FrontendUnitTest.MODEL_TPL_PATH, 'utf8').toString(),
        });

        //create model test as for class
        return templateObj.render({
          ClassName: name,
          import: `import {${name}} from \'${relativePath}/${name}\';`,
          objectName: FrontendUnitTest.lowerCaseFirstChar(name),
          staticGetters: FrontendUnitTest.getStaticGetters(absoluteClassPath),
        });

      case FrontendUnitTest.FILTER:

        templateObj = Twig.twig({
          data: fs.readFileSync(FrontendUnitTest.FILTER_TPL_PATH, 'utf8').toString(),
        });

        let filterName = FrontendUnitTest.getFilterName(absoluteClassPath);

        return templateObj.render({
          filterName: filterName,
          moduleNamePath: moduleNamePath,
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
    let re = /.*angular\s*?\.module\([a-z0-9]+\)\s*?\.filter\(("|'|`)([a-z_]+)("|'|`).*/mi;

    if (!re.test(fileContentString)) {
      throw new Error(`Filter name can't be retrieved for ${pathToClass}`);
    }

    return fileContentString.match(re)[2];
  }

  /**
   * @param {String} pathToClass
   * @returns {String|null}
   */
  static getControllerName(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = /.*angular\s*?\.module\([a-z0-9]+\)\s*?\.controller\(("|'|`)([a-z_]+)("|'|`).*/mi;

    if (!re.test(fileContentString)) {
      throw new Error(`Controller name can't be retrieved for ${pathToClass}`);
    }

    return fileContentString.match(re)[2];
  }

  /**
   * @param {String} pathToClass
   * @returns {String}
   */
  static getServiceName(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = /.*angular\s*?\.module\([a-z0-9]+\)\s*?\.[a-z]+\(("|'|`)([a-z_]+)("|'|`).*/mi;

    if (!re.test(fileContentString)) {
      return '';
    }

    return fileContentString.match(re)[2];
  }

  /**
   * @param {String} pathToClass
   * @returns {String}
   */
  static getDirectiveName(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = /.*angular\s*?\.module\([a-z0-9]+\)\s*?\.directive\(("|'|`)([a-z_]+)("|'|`).*/mi;

    if (!re.test(fileContentString)) {
      return '';
    }

    return fileContentString.match(re)[2];
  }

  /**
   * @param {String} pathToClass
   * @returns {String}
   */
  static getExternalTemplatePath(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = /[\s\S]+templateUrl\:\s+[a-z0-9\.]+\(("|'|`)@[a-z0-9-]+\:(.+)("|'|`)/mi;

    if (!re.test(fileContentString)) {
      return '';
    }

    return fileContentString.match(re)[2];
  }

  /**
   * @param {String} pathToClass
   * @returns {String}
   */
  static getRestrictType(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = /[\s\S]+restrict\:\s+("|'|`)([a-z0-9-]+)("|'|`)/mi;

    if (!re.test(fileContentString)) {
      return 'A';
    }

    return fileContentString.match(re)[2];
  }

  /**
   * @param {String} pathToClass
   * @returns {String}
   */
  static getDirectiveController(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = /[\s\S]+controller\:\s+("|'|`)([a-z0-9-]+)("|'|`)/mi;

    if (!re.test(fileContentString)) {
      return '';
    }

    return fileContentString.match(re)[2];
  }

  /**
   * @param {String} pathToClass
   * @returns {Boolean}
   */
  static hasInjectedServices(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');

    let re = /angular\s*?\.module\([A-za-z_]+\)\s*?\.[a-z]+\(.*\[([\s\S]*)\(.*\{.*/mi;

    if (re.test(fileContentString)) {
      let injectedDepsString = fileContentString.match(re)[1].replace(/[\s]/mg, '').replace(/"|'|`/mg, '');
      return /service/i.test(injectedDepsString);
    }

    return false;
  }

  /**
   * @param {String} pathToClass
   * @returns {Boolean}
   */
  static hasImports(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');

    let re = /import.*["']([a-z0-9-\.\/]+)['"]/gmi;

    if (!re.test(fileContentString)) {
      return false;
    } else {
      let imports = fileContentString.match(re);

      for (let item of imports) {
        if (item.indexOf('/name') === -1) {
          return true;
        }
      }
      return false;
    }


  }

  /**
   * @param {String} pathToClass
   * @returns {String[]}
   */
  static getInjectedDepsForCtrl(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');

    let re = /controller\(.*\[([\s\S]*)\(.*\{.*/mi;

    if (re.test(fileContentString)) {
      let injectedDepsString = fileContentString.match(re)[1].replace(/[\s]/mg, '').replace(/"|'|`/mg, '');
      return injectedDepsString.split(',').filter((element) => {
        return element;
      });
    }

    return [];
  }

  /**
   * @param {String} pathToClass
   * @returns {String[]}
   */
  static getInjectedDepsForService(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');

    let re = /service\(.*\[([\s\S]*)\(.*\{.*/mi;

    if (re.test(fileContentString)) {
      let injectedDepsString = fileContentString.match(re)[1].replace(/[\s]/mg, '').replace(/"|'|`/mg, '');

      return injectedDepsString.split(',').filter((element) => {
        return element;
      });
    }

    return [];
  }

  /**
   * @param {String[]} depsArray
   * @returns {String[]}
   */
  static fetchServices(depsArray) {
    if (depsArray && depsArray.length > 0) {
      return depsArray.filter((element) => {
        return /service/i.test(element);
      });
    }

    return [];
  }

  /**
   * @param {String[]} depsArray
   * @returns {String[]}
   */
  static fetchProviders(depsArray) {
    if (depsArray && depsArray.length > 0) {
      return depsArray.filter((element) => {
        return /provider|notification|msAuthentication/i.test(element);
      });
    }

    return [];
  }

  /**
   * @param {String[]} depsArray
   * @returns {Boolean}
   */
  static containsProvider(depsArray) {
    return /provider|notification|msAuthentication/gmi.test(depsArray.join(','));
  }

  /**
   * @param {String[]} depsArray
   * @returns {Boolean}
   */
  static containsService(depsArray) {
    return /service/gmi.test(depsArray.join(','));
  }

  /**
   * @param {String} pathToClass
   * @returns {Boolean}
   */
  static hasInjectedProviders(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');

    let re = /angular\s*?\.module\([A-za-z_]+\)\s*?\.[a-z]+\(.*\[([\s\S]*)\(.*\{.*/mi;

    if (re.test(fileContentString)) {
      let injectedDepsString = fileContentString.match(re)[1].replace(/[\s]/mg, '').replace(/"|'|`/mg, '');

      //@todo - clarify if we want to enforce validation
      return (/provider|notification|msAuthentication/gmi.test(injectedDepsString));
    }

    return false;
  }


  /**
   * @param {String} pathToClass
   * @returns {String[]}
   */
  static getStaticGetters(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = /static\s+get\s+([a-zA-Z0-9_]+)\s*/gm;
    let result = [];

    if (re.test(fileContentString)) {
      let staticGettersArray = fileContentString.match(re);

      for (let getterName of staticGettersArray) {
        result.push(getterName.replace(/static\s+get\s+/gm, ''));
      }
    }

    return result;
  }

  /**
   * @param {String} pathToClass
   * @returns {String|null}
   */
  static isService(pathToClass) {

    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = /.*angular\.module\([a-z0-9]+\).service\(("|'|`)([a-z]+)("|'|`).*/mi;

    if (re.test(fileContentString)) {
      return fileContentString.match(re)[2];
    }

    return null;
  }

  static isDefaultExport(pathToClass) {
    let className = path.basename(pathToClass, '.js');
    let fileContentString = fs.readFileSync(pathToClass, 'utf8');
    let re = new RegExp(`export\\s+default\\s+class\\s+${className}`, 'gmi');

    return re.test(fileContentString);
  }

  /**
   * @param {String} string
   * @returns {String}
   */
  static lowerCaseFirstChar(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }

  /**
   *
   * @param string
   */
  static toKebabCase(string) {
    return string.replace(/([A-Z]+)/g, (x, y) => {
      return '-' + y.toLowerCase();
    }).replace(/^-/, '');
  }

  /**
   * Return new array which consits from arraySource elements without elements from arrayToRemove
   * @param {Array} arraySource
   * @returns {Array}
   */
  static diffArray(arraySource) {
    let bidimentionalArray = Array.prototype.slice.call(arguments, 1);
    let arrayToRemove = [];

    for (var i = 0; i < bidimentionalArray.length; i++) {
      arrayToRemove = arrayToRemove.concat(bidimentionalArray[i]);
    }

    return arraySource.filter((element) => {
      return arrayToRemove.indexOf(element) < 0;
    });
  }

  /**
   * @param {Array} arraySource
   * @returns {Array}
   */
  static skipScopeServices(deps) {
    return deps.filter((element) => {
      return !/scope/i.test(element);
    });
  }


  /**
   * Return new array which consits from arraySource elements without elements from arrayToRemove
   * @param {String[]} arraySource
   * @param {String} mode - values 'BOTH', 'FIRST', 'LAST'
   * @returns {Array}
   */
  static toUnderscore(arraySource, mode = 'BOTH') {
    return arraySource.map((element) => {
      let result;

      switch (mode.toUpperCase()) {
        case 'BOTH':
          result = `_${element}_`;
          break;
        case 'FIRST':
          result = `_${element}`;
          break;
        case 'LAST':
          result = `${element}_`;
          break;
        default:
          throw new Error(`Invalid mode value [${mode}]`);
      }

      return result;
    });
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
  static get FRONTEND_CONTROLLERS() {
    return 'frontend/js/app/angular/controllers';
  }

  /**
   * @returns {String}
   */
  static get FRONTEND_DIRECTIVES() {
    return 'frontend/js/app/angular/directives';
  }

  /**
   * @returns {String}
   */
  static get FRONTEND_SERVICES() {
    return 'frontend/js/app/angular/services';
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
  static get TPL_DIR_PATH() {
    return path.join(__dirname, '../../../tpl/tests/frontend');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get HEALTH_CHECK_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'health-check.twig');
  }


  /**
   * @returns {String}
   * @constructor
   */
  static get MODEL_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'model.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get KARMA_CONFIG_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'config.karma.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get MODEL_WITH_SERVICE_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'model_with_service.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get CONTROLLER_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'controller.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get SERVICE_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'service.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get SERVICE_AS_CLASS_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'service_as_class.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get DIRECTIVE_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'directive.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get DIRECTIVE_AS_CLASS_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'directive_as_class.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get FILTER_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'filter.twig');
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get PACKAGE_JSON_TPL_PATH() {
    return path.join(FrontendUnitTest.TPL_DIR_PATH, 'package.twig');
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
   * @returns {String}
   * @constructor
   */
  static get CONTROLLER() {
    return 'controller';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get DIRECTIVE() {
    return 'directive';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get SERVICE() {
    return 'service';
  }

  /**
   * @param {String} fullPath
   * @returns {String}
   */
  static getClassName(fullPath) {
    return path.basename(fullPath).replace(FrontendUnitTest.TEST_FILE_EXTENSION, '');
  }
}
