import Joi from 'joi';

export const credentialsValidator = Joi.object({

	username:	 Joi.string().required(),
	password: 	 Joi.string().required(),
	description: Joi.string().min(0).optional()

})

export const updateCredentialsValidator = Joi.object({

	username:	 Joi.string().min(0).optional().required(),
	password: 	 Joi.string().min(0).optional().optional(),
	description: Joi.string().min(0).optional().optional()

})