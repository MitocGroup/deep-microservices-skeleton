'use strict';

import DeepFramework from 'deep-framework';

export default class Handler extends DeepFramework.Core.AWS.Lambda.Runtime {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param request
   */
  handle(request) {
    let itemId = request.getParam('Id');

    if (itemId) {
      this.retrieve(itemId, (item) => {
        return this.createResponse(item).send();
      });
    } else {
      this.retrieveAll((result) => {
        return this.createResponse(result).send();
      });
    }
  }

  /**
   * @param {Function} callback
   */
  retrieveAll(callback) {
    let Model = this.kernel.get('db').get('Skeleton');

    Model.findAll((err, item) => {
      if (err) {
        throw new DeepFramework.Core.Exception.DatabaseOperationException(err);
      }

      return callback(item.Items);
    });
  }

  /**
   * @param {String} itemId
   * @param {Function} callback
   */
  retrieve(itemId, callback) {
    let Model = this.kernel.get('db').get('Skeleton');

    Model.findOneById(itemId, (err, item) => {
      if (err) {
        throw new DeepFramework.Core.Exception.DatabaseOperationException(err);
      }

      return callback(item ? item.get() : null);
    });
  }
}