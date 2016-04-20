/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/31/16.
 */

'use strict';

import FS from 'fs';
import path from 'path';
import {AbstractTemplate} from './AbstractTemplate';

/**
 * Readme template
 */
export class Readme extends AbstractTemplate {
  /**
   * @returns {String}
   */
  static get BADGES_PLACEHOLDER() {
    return '[Repository_Badges_Placeholder]'
  }
  /**
   * @returns {String}
   */
  static get DESCRIPTION_PLACEHOLDER() {
    return '[Repository_Description_Placeholder]';
  }
  /**
   * @returns {String}
   */
  static get NAME_PLACEHOLDER() {
    return 'deep-microservices-skeleton';
  }

  /**
   * @param {String} microserviceName
   * @param {String} badges
   * @param {String} description
   */
  constructor(microserviceName, badges, description) {
    super();

    this._microserviceName = microserviceName;
    this._badges = this._tryToReadFromFile(badges) || Readme.BADGES_PLACEHOLDER;
    this._description = this._tryToReadFromFile(description) || Readme.DESCRIPTION_PLACEHOLDER;
  }

  /**
   * @returns {String}
   */
  get templatePath() {
    return path.join(__dirname, '../../../README.md');
  }

  /**
   * @returns {String}
   */
  render() {
    let replacementMap = {};
    replacementMap[Readme.BADGES_PLACEHOLDER] = this._badges.trim();
    replacementMap[Readme.DESCRIPTION_PLACEHOLDER] = this._description.trim();
    replacementMap[Readme.NAME_PLACEHOLDER] = this._microserviceName;

    let processedTemplate = this.template;

    for (let placeholder in replacementMap) {
      if (!replacementMap.hasOwnProperty(placeholder)) {
        continue;
      }

      let replacement = replacementMap[placeholder];
      let regexpPlaceholder = this._strToRegexp(placeholder);

      processedTemplate = processedTemplate.replace(regexpPlaceholder, replacement);
    }

    processedTemplate = this._adjustHeaderLine(processedTemplate);

    return processedTemplate;
  }

  /**
   * @param {String} template
   * @returns {String}
   * @private
   */
  _adjustHeaderLine(template) {
    return template.replace(/\={3,}/, '='.repeat(this._microserviceName.length));
  }
}
