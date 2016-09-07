/**
 * Created by vcernomschi on 9/7/16.
 */

'use strict';

import path from 'path';
import {AbstractConfigTemplate} from './AbstractConfigTemplate';

/**
 * JSON Config
 */
export class JsonConfig extends AbstractConfigTemplate {
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
    let processedTemplate = JSON.parse(this.template.replace(/\/\/.*/gm, ''));

    if (this._customPresets) {
      let customPresetObj = JSON.parse(this._customPresets);
      processedTemplate = this._extendConfig(processedTemplate, customPresetObj);
    }

    return JSON.stringify(processedTemplate, null, '  ');
  }
}
