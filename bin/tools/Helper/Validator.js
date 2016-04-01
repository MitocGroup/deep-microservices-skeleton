/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/31/16.
 */

'use strict';

/**
 * Answer Validator
 */
export class Validator {
  /**
   * @param {Function} validatorCallback
   * @param {String} failReason
   */
  constructor(validatorCallback, failReason) {
    this._validatorCallback = validatorCallback;
    this._failReason = failReason;
  }

  /**
   * @param {String} args
   * @returns {*}
   */
  validate(...args) {
    return this._validatorCallback(...args);
  }

  /**
   * @returns {String|*}
   */
  get failReason() {
    return this._failReason;
  }
}
