/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/5/16.
 */

'use strict';

import {AbstractTemplate} from './AbstractTemplate';
import deepExtend from 'deep-extend';

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

    deepExtend(config, extendedConfig);

    return config;
  }
}