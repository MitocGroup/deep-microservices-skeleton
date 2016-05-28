/* global System */
'use strict';
'format es6';

export default function skeleton() {
  var deepAsset = DeepFramework.Kernel.container.get('asset');
  return System.import(deepAsset.locate('@deep-skeleton:js/app/angular/index.js'));
}
