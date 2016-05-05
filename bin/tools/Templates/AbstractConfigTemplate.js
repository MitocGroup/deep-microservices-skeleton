/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/5/16.
 */

'use strict';

import {AbstractTemplate} from './AbstractTemplate';

/**
 * Abstract Config Template
 */
export class AbstractConfigTemplate extends AbstractTemplate {
  /**
   * @param {Object} config
   * @param {Object} extendedConfig
   * @return {Object}
   * @protected
   */
  _extendConfig(config, extendedConfig) {
    for (let key in extendedConfig) {
      if (!extendedConfig.hasOwnProperty(key)) {
        continue;
      }

      if (!config.hasOwnProperty(key)) {
        config[key] = extendedConfig[key];
      } else if (typeof config[key] === typeof extendedConfig[key]) {
        if (Array.isArray(extendedConfig[key])) {
          config[key].concat(extendedConfig[key]);
        } else if (typeof extendedConfig[key] === 'object') {
          config[key] = this._extendConfig(config[key], extendedConfig[key]);
        } else {
          config[key] = extendedConfig[key];
        }
      }
    }

    return config;
  }
}