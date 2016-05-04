'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _deepFramework = require('deep-framework');

var _deepFramework2 = _interopRequireDefault(_deepFramework);

var _Handler = require('./Handler');

var _Handler2 = _interopRequireDefault(_Handler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _deepFramework2.default.LambdaHandler(_Handler2.default);
module.exports = exports['default'];