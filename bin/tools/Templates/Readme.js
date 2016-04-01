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
  static get DETAILS_PLACEHOLDER() {
    return '[Repository_Details_Placeholder]';
  }
  /**
   * @returns {String}
   */
  static get MS_NAME_PLACEHOLDER() {
    return 'deep-microservices-skeleton';
  }

  /**
   * @param {String} microserviceName
   * @param {String} badges
   * @param {String} details
   */
  constructor(microserviceName, badges, details) {
    super();

    this._microserviceName = microserviceName;
    this._badges = this._tryToReadFromFile(badges) || Readme.BADGES_PLACEHOLDER;
    this._details = this._tryToReadFromFile(details) || Readme.DETAILS_PLACEHOLDER;
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
    replacementMap[Readme.BADGES_PLACEHOLDER] = this._badges;
    replacementMap[Readme.DETAILS_PLACEHOLDER] = this._details;
    replacementMap[Readme.MS_NAME_PLACEHOLDER] = this._microserviceName;

    let processedTemplate = this.template;

    for (let placeholder in replacementMap) {
      if (!replacementMap.hasOwnProperty(placeholder)) {
        continue;
      }

      let replacement = replacementMap[placeholder];
      let regexpPlaceholder = this._strToRegexp(placeholder);

      processedTemplate = processedTemplate.replace(regexpPlaceholder, replacement);
    }

    return processedTemplate;
  }
}