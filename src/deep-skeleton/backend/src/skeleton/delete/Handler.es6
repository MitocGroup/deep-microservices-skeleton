'use strict';

import DeepFramework from 'deep-framework';

export default class extends DeepFramework.Core.AWS.Lambda.Runtime {
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
      throw new DeepFramework.Core.Exception.InvalidArgumentException(itemId, 'string');
    }

    let Model = this.kernel.get('db').get('Skeleton');

    Model.deleteById(itemId, (err) => {
      if (err) {
        throw new DeepFramework.Core.Exception.DatabaseOperationException(err);
      }

      return this.createResponse({}).send();
    });
  }
}