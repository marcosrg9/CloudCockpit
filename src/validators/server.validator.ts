import joi from 'joi';
import { joiHostValidation, joiMACValidation, joiPortValidation } from './addresses.validator';
import { ObjectId } from 'mongodb';

const isValidMongoID: joi.CustomValidator = (value: string | string[] | ObjectId | ObjectId[], helper) => {

	// Comprueba si es una instancia de ObjectId de mongo.
	if (value instanceof ObjectId) return value;
	
	// Comprueba si el tipo del identificador es permitido.
	//if (typeof value !== 'string' && typeof value !== 'object') return helper.error('Owner ID unkown type');

	// string | string[] | ObjectID[]

	// Comprueba si es una cadena.
	if (typeof value === 'string') {

		// Trata de instanciar un identificador de mongo.
		try { return new ObjectId(value)
		// Se ha producido un error en la instanciación, el identificador no es válido.
		} catch { return helper.error(`User id ${value} is not a valid identifier.`) }
		
	}

	// string[] | ObjectID[]

	// Si se trata de un objeto, comprueba la validez por cada elemento que lo contiene.
	if (typeof value === 'object') {

		// Primero comprueba que sea exclusivamente un array.
		if (value instanceof Array !== true) return helper.error('User ID collection is not an array')

		// string[] | ObjectID[]

		const checks: ObjectId[] = [];
		
		// Comprueba la validez del identificador.
		for (let id of value) {

			// string | ObjectID

			// Si el id es una instacia de ObjectID, continúa con el siguiente índice.
			if (id instanceof ObjectId) checks.push(id);

			// string

			// Intenta instanciar el identificador.
			try {
				checks.push(new ObjectId(id as string))
			}
			// Si se produce un error es porque no es un id válido.
			catch { return helper.error(`User ID ${id} is not a valid MongoID.`) };

		}

		// Si no se ha producido ningún error, los identificadores son válidos y se devuelven ya instanciados.
		return checks;

	}

}

export const serverValidator = joi.object({

	/** Nombre del servidor. */
	name: joi.string()
			 .required()
			 .min(1),

	/** Dirección del servidor. */
	host: joi.string()
			 .required()
			 .custom(joiHostValidation),

	/** Puerto del servidor. */
	port: joi.custom(joiPortValidation)
			 .optional()
			 .allow('')
			 .when('MAC', {
				// Si la dirección MAC existe, el puerto ssh no puede tener los valores 7 o 9.
				is: joi.exist(),
				then: joi.invalid(7, 9)
			 }),

	/** Propietario del servidor. */
	owner: joi.required()
			  .custom(isValidMongoID),

	/** Dirección física del servidor. */
	MAC: joi.string()
			.optional()
			.custom(joiMACValidation),

	/** Puerto para Wake On Lan */
	wolPort: joi.number()
				.optional()
				.min(0)
				.max(65535)
				.when('port', {
					// Cuando el puerto SSH existe, el puerto wol no puede tener el mismo valor.
					// De otra manera (cuando no existe), el puerto no puede ser 22 (puerto bien conocido).
					is: joi.exist(),
					then: joi.disallow(joi.ref('port')),
					otherwise: joi.disallow(22)
				})
				.when('MAC', {
					is: joi.exist(),
					then: joi.optional(),
					otherwise: joi.forbidden()
				})
				

})

/* const validation = serverValidator.validate({
	name: 'Tesla',
	//host: '[2001:0db8:1234::0001]',
	//host: 'cloudcockpit.marcosrg9.dev:200',
	host: '192.168.1.1',
	MAC: 'FF:FF:FF:FF:FF:FF',
	owner: '63036aeed116d11f6b8a99b0'
	//wolPort: 22,
}, { stripUnknown: true, abortEarly: false })


console.log(validation.error);
 */