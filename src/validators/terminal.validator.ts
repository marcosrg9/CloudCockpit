import joi from 'joi';

export const terminalSizeParamsValidator = joi.object({
	cols: joi.number().required(),
	rows: joi.number().required(),
	height: joi.number().required(),
	width: joi.number().required()
})