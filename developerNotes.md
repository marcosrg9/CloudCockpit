# **✍️ Notas del desarrollador**

## **🔐 Cifrado de registros**
En la versión ```0.0.3``` se ha integrado en la abstracción de entidades identificadas por IDs una marca de cifrado (```enc``` en ```src/database/entity/AbstractID.ts```), la cual permitirá identificar el estado de cifrado del registro.

La abstracción de administrador de entidades identificadas por IDs (```src/database/database_abstraction.ts```) detecta esta marca, pero hay que especificar en cada ```super``` las propiedades que están cifradas (revisar el administrador de credenciales ```src/database/auth.db.ts```, el cual ya implementa las propiedades cifradas).


## **⌨️ Instanciación de terminales del lado del cliente**

Para instanciar una terminal, es necesario indicar las dimensiones.\
En el cliente hay un gran inconveniente:
- No se puede mostrar una terminal hasta que no haya una conexión establecida.
- Tampoco se puede instanciar la terminal (por ende no se puede abrir una conexión SSH) hasta que no hayan datos de dimensiones (requeridos por el servidor).

He estado comprobando si existe una forma factible de hacer un cálculo inicial de las dimensiones de la terminal, sin embargo no ha sido posible.

Para obtener el tamaño de una terminal, es necesario seguir el siguiente flujo:

1. Una directiva que detecte la instanciación de un nuevo elemento.
2. Pasar a una función la referencia de dicho elemento.
3. En ella, instanciar una nueva terminal xtermjs.
4. Adjuntar la terminal al contenedor.
5. Ajustar las dimensiones de la terminal acorde al contenedor.
6. Esperar unos milisegundos (el ajuste parece no ser inmediato).
7. Obtener las dimensiones de la terminal.
8. Emitir la señal de nueva conexión al servidor con los parámetros de dimensiones, servidor y credenciales.

Este enfoque tiene un gran inconveniente, es exageradamente confuso, sin embargo por el momento no encuentro otra alternativa más óptima.

## **⌨️ Instanciación de terminales del lado del cliente [V2]**
La instanciación de terminales anterior requería un pid de conexión, sin embargo la conexión no se podía instanciar hasta que los parámetros de dimensiones estuvieran disponibles.

Para solventar esto, se ha añadido un proceso previo que consiste en preparar una conexión, de forma que el servidor pueda generar un pid antes de instanciar la conexión, con el cual el cliente podrá instanciar la terminal y el servidor podrá iniciar la conexión con los parámetros de dimensiones.

Esto se lleva a cabo a través de un diálogo de eventos entre el cliente y el servidor:
```
[C:prepare]
El cliente emite los datos requeridos para una conexión.
// Nota: no emitir en broadcast para la respuesta a prepare, el resto de clientes responderán con los parámetros de cada una de sus terminales.

[S:preparedConnection]
El servidor acepta y emite los datos requeridos para la conexión con el pid.
// El cliente instancia la shell y extrae las dimensiones.

[C:openTerminal]
El cliente emite los datos requeridos para instanciar la terminal (dimensiones).

[S:connectionUpdate]
El servidor instancia una conexión con los parámetros recogidos por el evento anterior y responde con el estado.
// Los clientes indican al usuario que se está llevando a cabo la conexión...

[S:connectionUpdate]
El servidor se conecta y responde con el estado.
// Los clientes muestran la interfaz por defecto.

[S:terminalData]
El servidor difunde el buffer proveniente de la terminal instanciada.
// Los clientes insertan en la terminal web los datos.
```
Este enfoque resuelve los siguientes inconvenientes:
- No se podía identificar una terminal web en estado de espera.
- No se podía instanciar una terminal

## **🚀 Rendimiento de las estructuras de datos basadas en mapas**

Para tener un acceso rápido y seguro a regiones de memoria, se ha optado por usar instancias de mapas. Su acceso es instantáneo y no hay riesgos de colisión.
En un principio no se han realizado pruebas de rendimiento, aunque tenía en cuenta que eran bastante óptimas para la tarea.

Posteriormente he preparado un script para correr pruebas de rendimiento, realizando una búsqueda en el peor de los casos, asignando ```n``` registros y obteniendo ```n - 1```.

Se debe considerar que el acceso a un registro en un array implica primero su búsqueda, y que esta es secuencial. El **acceso** a un objeto dentro de otro objeto no implica ninguna búsqueda, simplemente con tener la clave, dispondremos del valor. Los mapas es bastante parecido, un valor se obtiene a partir de su clave.


1. Objetos.
2. Mapas.
3. Arrays.

```
Object by index: 0.013ms
Array by index: 0.014ms
Map: 0.017ms
Array: 74.122ms
```

Los números indican que los objetos son más veloces (0.004ms), sin embargo, bajo mi punto de vista, usar ```delete``` para eliminar una propiedad no me agrada.

También es evidente que el acceso a un índice de array es más rápido que un mapa, pero como se comentó anteriormente, requiere una búsqueda secuencial previa del índice.

Con todas las opciones sobre la mesa, los mapas me parecen la mejor estructura.

> Nota: JavaScript tiene una limitación de 16.777.216 (2^24) registros en un mapa.\
Para arrays, el límite de índices es 4.294.967.294 (2^32 - 2).

## **🏗 Arquitectura de múltiples sesiones y sockets**

Para lograr un funcionamiento sincronizado entre todos los dispositivos, se ha llevado a cabo un rediseño del funcionamiento de las sesiones y sockets.

Cuando un usuario incia sesión, se crea un registro del usuario de la base de datos en la memoria, este usuario puede contener varias sesiones simultáneas (el mismo usuario puede conectarse desde diferentes dispositivos simultáneamente).

De la misma forma en que un usuario puede tener varias sesiones abiertas de forma simultánea (varios navegadores), estos también pueden tener varias pestañas abiertas a la vez. Esto implica que, intuitivamente, cada pestaña va a tener su propio socket, por lo que, con todo esto en mente, tenemos el siguiente esquema:

```
Usuarios
│
├── Usuario 1
│   │
│   ├── Sesión 1 (equipo laptop)
│   │   └── Socket (pestaña 1)
│   │
│   ├── Sesión 2 (equipo desktop)
│   │   ├── Socket (pestaña 1)
│   │   └── Socket (pestaña 2)
│   │
│   └── Sesión 3 (dispositivo móvil)
│       └── Socket (pestaña 1)
│
├── Usuario 2
│   │
│   ├── Sesión 1 (dispositivo móvil)
│   │   └── Socket (pestaña 1)
│   │
│   └── Sesión 2 (equipo laptop)
│       ├── Socket (pestaña 1)
│       └── Socket (pestaña 2)
│
└── ...n users
```