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

    if (typeof itemId !== 'string') {
      throw new InvalidArgumentException(itemId, 'string');
    }

    let Model = this.kernel.get('db').get('Skeleton');

    Model.updateItem(itemId, request.data, (err, item) => {
      if (err) {
        throw new DeepFramework.Core.Exception.DatabaseOperationException(err);
      }

      return this.createResponse(item.get()).send();
    });
  }
}