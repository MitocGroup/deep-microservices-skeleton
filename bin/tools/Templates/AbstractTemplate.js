/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/31/16.
 */

'use strict';

import FS from 'fs';

/**
 * Abstract Template
 */
export class AbstractTemplate {
  /**
   * @returns {String}
   */
  render() {
    throw new Error('render method should be overwritten');
  }

  /**
   * @returns {String}
   */
  get templatePath() {
    throw new Error('templatePath getter should be overwritten');
  }

  /**
   * @returns {String}
   */
  get template() {
    return this._tryToReadFromFile(this.templatePath, true);
  }

  /**
   * @param {String} string
   * @param {String} flags
   * @param {String} regexpPrefix
   * @param {String} regexpSuffix
   * @returns {RegExp}
   * @protected
   */
  _strToRegexp(string, flags = 'ig', regexpPrefix = '', regexpSuffix = '') {
    let escapedString = string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    return new RegExp(
      regexpPrefix + escapedString + regexpSuffix,
      flags
    );
  }

  /**
   * @param {String} string
   * @param {Boolean} strict
   * @returns {String}
   * @protected
   */
  _tryToReadFromFile(string, strict = false) {
    if (FS.existsSync(string)) {
      let stat = FS.statSync(string);

      if (stat.isFile()) {
        return FS.readFileSync(string).toString();
      }
    }

    if (strict) {
      throw new Error(`${string} file does not exit`);
    }

    return null;
  }

  /**
   * @param {String} file
   * @param {Function} callback
   */
  writeIntoFile(file, callback) {
    let readmeContent = this.render();

    FS.writeFile(file, readmeContent, callback);
  }
}
