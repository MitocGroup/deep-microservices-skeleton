/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/5/16.
 */

'use strict';

import path from 'path';
import yml from 'js-yaml';
import {AbstractConfigTemplate} from './AbstractConfigTemplate';

/**
 * Yaml Config
 */
export class YamlConfig extends AbstractConfigTemplate {
  /**
   * @param {String} customPresetsFile
   * @param {String} templatePath
   */
  constructor(customPresetsFile, templatePath) {
    super();

    let customPresetsRaw = this._tryToReadFromFile(customPresetsFile);
    this._customPresets = customPresetsRaw ? yml.safeLoad(customPresetsRaw) : null;
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
      let jsonConfig = yml.safeLoad(processedTemplate);
      jsonConfig = this._extendConfig(jsonConfig, this._customPresets);
      processedTemplate = yml.safeDump(jsonConfig);
    }

    processedTemplate = processedTemplate.replace(/>\-/g, '');

    return processedTemplate;
  }
}
