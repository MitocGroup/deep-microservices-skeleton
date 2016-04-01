/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/31/16.
 */

'use strict';

import readline from 'readline';

/**
 * Prompt Question
 */
export class Question {
  /**
   * @param {String} question
   * @param {Validator[]} validators
   * @param {Boolean} doRepeat
   */
  constructor(question, validators = [], doRepeat = true) {
    this._question = question;
    this._validators = validators;
    this._doRepeat = doRepeat;
  }

  /**
   * @param {String} answer
   * @private
   */
  _validateAnswer(answer) {
    this._validators.forEach((validator) => {
      if (!validator.validate(answer)) {
        throw new Error(validator.failReason);
      }
    });
  }

  /**
   * @param {String} reason
   * @private
   */
  _fail(reason) {
    console.error(reason);

    process.exit();
  }

  /**
   * @param {Function} handler
   */
  ask(handler) {
    let doAsk = (question) => {
      let readlineInterface = this._createReadlineInterface();

      readlineInterface.question(question, (answer) => {
        readlineInterface.close();

        try {
          this._validateAnswer(answer);
        } catch (reason) {
          (this._doRepeat ? doAsk : this._fail)(reason.message);
          return;
        }

        handler(answer.trim());
      });
    };

    doAsk(this._question);
  }

  /**
   * @returns {*}
   * @private
   */
  _createReadlineInterface() {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      historySize: 0,
    });
  }
}
