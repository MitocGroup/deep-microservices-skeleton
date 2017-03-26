/**
 * Created by vcernomschi on 9/6/16.
 */

'use strict';

import path from 'path';
import {AbstractConfigTemplate} from './AbstractConfigTemplate';

/**
 * Ignore Config
 */
export class IgnoreConfig extends AbstractConfigTemplate {
  /**
   * @param {String} customPresetsFile
   * @param {String} templatePath
   */
  constructor(customPresetsFile, templatePath) {
    super();

    let customPresetsRaw = this._tryToReadFromFile(customPresetsFile);
    this._customPresets = customPresetsRaw ? customPresetsRaw : null;
    this._templatePath = path.join(__dirname, templatePath);
  }

  /**
   * @returns {string}
   */
  get templatePath() {
    return this._templatePath;
  }

  /**
   * @returns {String}
   */
  render() {
    let processedTemplate = this.template;

    if (this._customPresets) {
      processedTemplate += this._customPresets;
    }

    return processedTemplate;
  }
}
