'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _deepFramework = require('deep-framework');

var _deepFramework2 = _interopRequireDefault(_deepFramework);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

let Handler = function (_DeepFramework$Core$A) {
  _inherits(Handler, _DeepFramework$Core$A);

  /**
   * @param {Array} args
   */

  function Handler() {
    var _Object$getPrototypeO;

    _classCallCheck(this, Handler);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(Handler)).call.apply(_Object$getPrototypeO, [this].concat(args)));
  }

  /**
   * @param request
   */


  _createClass(Handler, [{
    key: 'handle',
    value: function handle(request) {
      let itemId = request.getParam('Id');

      if (itemId) {
        this.retrieve(itemId, item => {
          return this.createResponse(item).send();
        });
      } else {
        this.retrieveAll(result => {
          return this.createResponse(result).send();
        });
      }
    }

    /**
     * @param {Function} callback
     */

  }, {
    key: 'retrieveAll',
    value: function retrieveAll(callback) {
      let Model = this.kernel.get('db').get('Skeleton');

      Model.findAll((err, item) => {
        if (err) {
          throw new _deepFramework2.default.Core.Exception.DatabaseOperationException(err);
        }

        return callback(item.Items);
      });
    }

    /**
     * @param {String} itemId
     * @param {Function} callback
     */

  }, {
    key: 'retrieve',
    value: function retrieve(itemId, callback) {
      let Model = this.kernel.get('db').get('Skeleton');

      Model.findOneById(itemId, (err, item) => {
        if (err) {
          throw new _deepFramework2.default.Core.Exception.DatabaseOperationException(err);
        }

        return callback(item ? item.get() : null);
      });
    }
  }]);

  return Handler;
}(_deepFramework2.default.Core.AWS.Lambda.Runtime);

exports.default = Handler;
module.exports = exports['default'];