import Joi from 'joi';

export const credentialsValidator = Joi.object({

	username:	 Joi.string().required(),
	password: 	 Joi.string().required(),
	description: Joi.string().optional()

})