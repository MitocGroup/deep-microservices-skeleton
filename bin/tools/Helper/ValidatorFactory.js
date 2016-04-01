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
   * @returns {Validator}
   */
  static get notEmpty() {
    return new Validator((value) => {
      return !!value.trim();
    }, 'String must be not empty: ');
  }

  /**
   * @return {Validator}
   */
  static get alphanumerical() {
    return new Validator((value) => {
      return /^[a-zA-Z\d+\-_\.]+$/.test(value);
    }, 'String must contain only letters, numbers, dashes or dots: ');
  }

  /**
   * @returns {*}
   */
  static get yesNo() {
    return new Validator((value) => {
      return /^\s*(y(es)?|n(o)?)\s*$/i.test(value);
    }, 'Please enter one of the values y(es) or n(o): ');
  }
}
