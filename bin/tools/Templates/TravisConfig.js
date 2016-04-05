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
   * @param {Boolean} enableFrontendTests
   */
  constructor(enableFrontendTests = true) {
    super();

    this._enableFrontendTests = enableFrontendTests;
  }

  /**
   * @returns {string}
   */
  get templatePath() {
    return path.join(__dirname, '../../../.travis.yml');
  }

  /**
   * @param {Boolean} doEnable
   * @returns {TravisConfig}
   */
  enableFrontendTests(doEnable) {
    this._enableFrontendTests = doEnable;
    
    return this;
  }

  /**
   * @returns {String}
   */
  render() {
    let processedTemplate = this.template;

    if (this._enableFrontendTests) {
      this.frontendRelatedCommands.forEach((command) => {
        let commandRegexp = this._strToRegexp(command, 'ig', '#\\s*(', ')');

        processedTemplate = processedTemplate.replace(commandRegexp, '$1');
      });
    }

    return processedTemplate;
  }

  /**
   * @returns {String[]}
   */
  get frontendRelatedCommands() {
    return [
      '- npm run protractor-install',
      '- npm run protractor-prepare'
    ];
  }
}