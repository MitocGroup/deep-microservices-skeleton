/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/5/16.
 */

'use strict';

import path from 'path';
import {AbstractTemplate} from './AbstractTemplate';

/**
 * Travis Config
 */
export class TravisConfig extends AbstractTemplate {
  /**
   * @param {String} customPresetsFile
   */
  constructor(customPresetsFile) {
    super();

    this._customPresets = this._tryToReadFromFile(customPresetsFile) || null;
  }

  /**
   * @returns {string}
   */
  get templatePath() {
    return path.join(__dirname, '../../../.travis.yml');
  }

  /**
   * @returns {String}
   */
  render() {
    let processedTemplate = this.template;

    if (this._customPresets) {
      processedTemplate = `${processedTemplate}\n${this._customPresets}`;
    }

    return processedTemplate;
  }
}
