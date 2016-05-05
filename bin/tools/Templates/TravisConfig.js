/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/5/16.
 */

'use strict';

import path from 'path';
import yml from 'js-yaml';
import {AbstractConfigTemplate} from './AbstractConfigTemplate';

/**
 * Travis Config
 */
export class TravisConfig extends AbstractConfigTemplate {
  /**
   * @param {String} customPresetsFile
   */
  constructor(customPresetsFile) {
    super();

    let customPresetsRaw = this._tryToReadFromFile(customPresetsFile);
    this._customPresets = customPresetsRaw ? yml.safeLoad(customPresetsRaw) : null;
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
      let jsonConfig = yml.safeLoad(processedTemplate);
      jsonConfig = this._extendConfig(jsonConfig, this._customPresets);

      processedTemplate = yml.safeDump(jsonConfig);
    }

    processedTemplate = processedTemplate.replace(/>\-/g, '');

    return processedTemplate;
  }
}
