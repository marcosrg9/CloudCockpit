import { CertificateCreationResult, createCertificate } from 'pem';

export abstract class TLS {

	/**
	 * 
	 * @param keySize Tamaño de la clave en bits (4096 por defecto).
	 * @param cn Nombre común (localhost por defecto).
	 * @param duration Duración en días de la clave (10 años por defecto).
	 */
	static createSelfSignedCert(keySize: 2048 | 3072 | 4096 | 8162 | number = 4096, cn: string = 'localhost', duration: number = 360 * 10): Promise<CertificateCreationResult> {
        return new Promise((resolve, reject) => {

            // Reasigna la variable al estado por defecto si el tamaño de la clave no es equivalente a alguno de los admitidos.
            if (keySize !== (2048 || 3072 || 4096 || 8162) || typeof keySize != 'number') keySize = 4096;
            
            // Reasigna la variable al estado por defecto si no se ha definido un nombre común válido.
            if (!cn || cn.length === 0 || typeof cn != 'string') cn = 'localhost';

            // Reasigna la variable al estado por defecto si no se ha definido una duración válida.
            if (!duration || duration <= 0 || typeof duration != 'number') reject('Invalid duration');

            // Intenta generar el certificado.
            createCertificate({
                days: duration,
                commonName: cn,
                keyBitsize: keySize,
                organization: 'Moccha',
                organizationUnit: 'Solis',
                selfSigned: true
            }, (err, cert) => {
                
                // Rechaza la promesa si se ha producido un error.
                if (err) reject(err)
                // Resuelve la promesa si se ha generado el certificado.
                else resolve(cert);

            })

        })
    }

}