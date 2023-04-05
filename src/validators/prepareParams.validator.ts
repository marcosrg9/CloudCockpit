import Joi from 'joi';

export const prepareTerminalValidator = Joi.object({
	host:		Joi.string().required(),
	auth:		Joi.alternatives(
		Joi.string().required(),
		Joi.object({
			username:	Joi.string().required(),
			password:	Joi.string().required()
		})
	)
})