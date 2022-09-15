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

> Nota: JavaScript tiene una limitación de 16.777.216 registros en un mapa.\
Para arrays, el límite de índices es 4.294.967.294.

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