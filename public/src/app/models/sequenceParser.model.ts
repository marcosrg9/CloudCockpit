/**
 * Intérprete de caracteres de teclado.
 * Nota: clase abstracta, no se puede instanciar. Usar el método parse.
 */
export abstract class SeqParser {

	/**
	 * Interpreta las pulsaciones de teclas y devuelve la secuencia de escape correcta.
	 * @param event Evento del teclado.
	 * @returns Secuencia de escape adecuada.
	 */
	public static parse(event: KeyboardEvent) {

		// Detiene la ejecución por defecto.
		event.preventDefault();

		const { key: k } = event;

		// Anula la inserción de teclas especiales
		if (k === 'Control') return '';
		if (k === 'Shift') return '';
		if (k === 'Meta') return '';
		if (k === 'Alt') return '';

		if (event.shiftKey) {

			// TODO: Buscar la secuencia de escape para Shift+Tab.
			// Esta secuencia es para la tecla ArrowUp.
			if (k === 'Tab') return '\u009B[A'
			
		}

		// Hex: https://en.wikipedia.org/wiki/C0_and_C1_control_codes#C0_(ASCII_and_derivatives)

		if (event.ctrlKey) {
		
			if (k.toLowerCase() === 'a') return '\x01';
			if (k.toLowerCase() === 'b') return '\x02';
			if (k.toLowerCase() === 'c') return '\x03';
			if (k.toLowerCase() === 'd') return '\x04';
			if (k.toLowerCase() === 'e') return '\x05';
			if (k.toLowerCase() === 'f') return '\x06';
			if (k.toLowerCase() === 'g') return '\x07';
			if (k.toLowerCase() === 'h') return '\x08';
			if (k.toLowerCase() === 'i') return '\x09';
			if (k.toLowerCase() === 'j') return '\x0A';
			if (k.toLowerCase() === 'k') return '\x0B';
			if (k.toLowerCase() === 'l') return '\x0C';
			if (k.toLowerCase() === 'm') return '\x0D';
			if (k.toLowerCase() === 'n') return '\x0E';
			if (k.toLowerCase() === 'o') return '\x0F';
			if (k.toLowerCase() === 'p') return '\x10';
			if (k.toLowerCase() === 'q') return '\x11';
			if (k.toLowerCase() === 'r') return '\x12';
			if (k.toLowerCase() === 's') return '\x13';
			if (k.toLowerCase() === 't') return '\x14';
			if (k.toLowerCase() === 'u') return '\x15';
			if (k.toLowerCase() === 'v') return '\x16';
			if (k.toLowerCase() === 'w') return '\x17';
			if (k.toLowerCase() === 'x') return '\x18';
			if (k.toLowerCase() === 'y') return '\x19';
			if (k.toLowerCase() === 'z') return '\x1A';

		}
		
		if (k === 'Backspace') return '\x7F';
		if (k === 'Escape') return '\x1B';
		if (k === 'Enter') return '\r';
		if (k === 'Delete') return '\r';
		if (k === 'Tab') return '\t';
		// https://stackoverflow.com/a/31017139
		// https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
		if (k === 'ArrowUp') return '\u001b[A';
		if (k === 'ArrowDown') return '\u001b[B';
		if (k === 'ArrowLeft') return '\u001b[D';
		if (k === 'ArrowRight') return '\u001b[C';
		
		// Si no se ha insertado ninguna de las secuencias anteriores, se inserta la tecla presionada.
		return k

	}

}