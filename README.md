<div align="center">
	<img src="./.src/readme_banner.png">

# CloudCockpit
</div>

CloudCockpit es (por ahora) un emulador de terminal basado en tecnologías web escrito enteramente en TypeScript.\
Usa Angular para representar la terminal y NodeJS para crear pseudo terminales.

Bajo el capó, Node abre un servidor WebSockets (realmente SocketIo se encarga de gestionar todo esto), después crea una nueva terminal y envía la salida a Angular, que recoge los datos y los representa en un terminal visible con ngTerminal.

En el momento en que se recogen los datos, el usuario puede interactuar con la terminal mediante el prompt, igual que una terminal real.

En este momento se han encontrado varios bugs:

- El historial no funciona, hay que configurar la secuencia de escape correcta.
- Faltan bastantes secuencias de escape por configurar, por lo que las teclas Escape, Arrows y demás no funcionarán de la manera adecuada.
- La base de datos de la terminal es inaccesible (según se indica), y herramientas como `clear` o `nano` no funcionan.

> ⚠️ Debido a la falta de secuencias de escape, el funcionamiento de las flechas arriba y abajo no funcionan correctamente, por lo que modificar texto en vi o cualquier otro editor es una tarea casi imposible.

## 💿 Instalación

Clonar el repositorio `https://github.com/marcosrg9/CloudCockpit.git`, después acceder a él.

A continuación se deben instalar las dependencias:

	npm i

Iniciar el servidor con el comando start:

	npm start

Después abrir otra terminal en el mismo directorio y acceder al directorio `public`.

Instalar las dependencias de Angular igual que las de NodeJS (`npm i`).

Por último iniciar el servidor de desarrollo de Angular

	npm start

Para permitir el acceso desde otros hosts (para lo cual ha sido diseñado este software), iniciar el servidor de la siguiente forma:

	ng serve --host=0.0.0.0

En caso de no disponer de Angular CLI instalado de forma global, usar el siguiente comando:

	npx ng serve --host=0.0.0.0

CloudCockpit ha sido probado bajo Zsh, Bash y Ash (en Alpine Linux), todos han tenido un comportamiento medianamente normal (teniendo en cuenta las limitaciones).

## 📖 Documentación importante

Las secuencias de escape es uno de los factores más importantes para interactuar con la terminal (por no decir que el que más).

Hay bastante documentación en la web, sin embargo es complejo de compreder, xtrem.js tienen documentación algo más sencilla de entender, además en foros se puede encontrar más información para saber cómo insertar estas secuencias.

Algunas páginas que han sido de gran utilidad a la hora de desarrollar CloudCockpit:

- https://xtermjs.org/docs/api/vtfeatures/
- https://www.windmill.co.uk/ascii-control-codes.html