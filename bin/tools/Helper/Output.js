/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/31/16.
 */

'use strict';

/**
 * Output overwriter
 */
export class Output {
  /**
   * Overwrite console
   */
  static overwriteConsole() {
    let nativeConsole = typeof window !== 'undefined' ? window.console : console;

    ['error', 'log', 'warn', 'info', 'debug'].forEach((methodName) => {
      let nativeMethod = nativeConsole[methodName];

      nativeConsole[methodName] = function() {
        let arrayArgs = [new Date().toTimeString()];

        for (let key in arguments) {
          if (arguments.hasOwnProperty(key)) {
            arrayArgs.push(arguments[key]);
          }
        }

        let processedArgs = arrayArgs.map(Output._beautify);

        nativeMethod.apply(nativeConsole, processedArgs);
      }
    });

    return Output;
  }

  /**
   * Overwrite process.stdout
   */
  static overwriteStdout() {
    let nativeWrite = process.stdout.write;

    process.stdout.write = (string) => {
      nativeWrite.call(process.stdout, Output._beautify(string));
    };

    return Output;
  }

  /**
   * @param {String} string
   * @returns {*}
   */
  static _beautify(string) {
    if (typeof string !== 'string') {
      return string;
    }

    let colorMap = {
      error: 31,
      err: 31,
      info: 32,
      warning: 33,
      warn: 33
    };

    let processedString = string;

    for (let colorAlias in colorMap) {
      if (!colorMap.hasOwnProperty(colorAlias)) {
        continue;
      }

      let colorCode = colorMap[colorAlias];
      let regexp = new RegExp('<' + colorAlias + '>([^<]+)</' + colorAlias + '>', 'g');

      processedString = processedString.replace(regexp, '\x1b[' + colorCode + 'm' + '$1\x1b[39m');
    }

    return processedString;
  }
}
