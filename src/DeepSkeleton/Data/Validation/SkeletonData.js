'use strict';

module.exports = function(Joi) {
    return Joi.object().keys({
        Field1: Joi.string().min(2).max(255).required()
    });
};
