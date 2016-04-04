/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/31/16.
 */

'use strict';

import {Validator} from './Validator';

/**
 * @todo: cache them?
 *
 * Validator Factory
 */
export class ValidatorFactory {
  /**
   * @return {Validator}
   */
  static get alphanumerical() {
    return (value) => {
      if (/^[a-zA-Z\d+\-_\.]+$/.test(value)) {
        return true;
      }

      return 'String must contain only letters, numbers, dashes or dots: ';
    };
  }
}
