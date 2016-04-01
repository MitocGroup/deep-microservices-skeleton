/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/31/16.
 */

'use strict';

import {Question} from './Question';
import {ValidatorFactory} from './ValidatorFactory';
import global from './Global';

/**
 * Bool Question
 */
export class BoolQuestion extends Question {
  /**
   * @param {String} question
   * @param doRepeat
   */
  constructor(question, doRepeat = true) {
    super(question, [ValidatorFactory.yesNo], doRepeat);
  }

  /**
   * @param {Function} handler
   */
  ask(handler) {
    if (global.NO_INTERACTION) {
      handler(true);

      return;
    }

    super.ask((response) => {
      handler(/^\s*y(es)?\s*$/i.test(response));
    });
  }
}
