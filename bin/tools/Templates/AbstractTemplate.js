/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/31/16.
 */

'use strict';

import {BoolQuestion} from '../Helper/BoolQuestion';
import {ValidatorFactory} from '../Helper/ValidatorFactory';
import FS from 'fs';
import path from 'path';
import global from '../Helper/Global';

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
   * @param string
   * @param flags
   * @param regexpPrefix
   * @param regexpSuffix
   * @returns {RegExp}
   * @private
   */
  _strToRegexp(string, flags = 'ig', regexpPrefix = '', regexpSuffix = '') {
    let escapedString = string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    return new RegExp(
      regexpPrefix + escapedString + regexpSuffix,
      flags
    );
  }

  /**
   * @param {*} mixed
   * @param {Boolean} strict
   * @returns {String}
   * @private
   */
  _tryToReadFromFile(mixed, strict = false) {
    if (FS.existsSync(mixed)) {
      let stat = FS.statSync(mixed);

      if (stat.isFile()) {
        return FS.readFileSync(mixed).toString();
      }
    }

    if (strict) {
      throw new Error(`${mixed} file does not exit`);
    }

    return null;
  }

  /**
   * @param {String} file
   * @param {Function} callback
   */
  writeIntoFile(file, callback) {
    let readmeContent = this.render();

    if (FS.existsSync(file)) {
      let stat = FS.statSync(file);

      if (stat.isFile()) {
        if (!global.NO_INTERACTION) {
          console.log(`File <info>${path.basename(file)}</info> already exists. `);
        }

        new BoolQuestion(
          'Do you want to overwrite it? '
        ).ask((isYes) => {
          isYes ?
            FS.writeFile(file, readmeContent, callback) :
            callback(null, false);
        });

        return;
      }
    }

    FS.writeFile(file, readmeContent, callback);
  }
}