/* global System */
/* global DeepFramework */
/*eslint strict: 0 */

'use strict';

export default function skeleton() {
  var deepAsset = DeepFramework.Kernel.container.get('asset');
  return System.import(deepAsset.locate('@deep-skeleton:js/app/angular/index.js'));
}
