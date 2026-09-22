# TaskFlow

Sistema personal de clientes y tareas. **Un solo archivo, sin instalar nada.**

## Cómo usarlo

Abrí `taskflow.html` (doble clic, o subilo a cualquier hosting). No hay servidor,
no hay cuentas, no hay nada que configurar.

Los datos se guardan en el navegador donde lo abras. Nadie más los ve y no
viajan a ningún lado.

> Si lo abrís haciendo doble clic al archivo en el disco, algunos navegadores
> (Safari sobre todo) no guardan nada. Para uso diario conviene tenerlo en una
> dirección web; el archivo suelto sirve igual para probarlo.

## Qué hace

- **Hoy** — el saludo, el campo para escribir lo que tenés que hacer, los
  recordatorios de la próxima hora, lo vencido, lo de hoy y lo que sigue.
- **Taski** — el botón azul abajo a la derecha. Preguntale *"¿qué tengo hoy?"*,
  *"¿qué tengo pendiente de Kaia?"*, *"¿qué está vencido?"* o *"¿qué hice esta
  semana?"*. Responde leyendo tus propias tareas: no hay conexión ni modelo
  externo, así que anda igual sin internet.
- **Clientes** — alta, renombrado y baja. Al borrar un cliente sus tareas se
  quedan, solo pierden la etiqueta.
- **Calendario** — semana y mes, con el detalle del día que elijas.
- **Ajustes** — tema claro/oscuro, copia de seguridad, datos de ejemplo y
  vaciar todo.
- **Buscar** — arriba a la derecha, busca por tarea, categoría o cliente.

## Escribir una tarea

Se escribe como se dice. El sistema separa cliente, fecha, hora, categoría y
urgencia, y muestra lo que entendió para que lo corrijas antes de crearla.

    Preparar el reel de San Lucas mañana a las 10
    El jueves enviar el calendario de Estilo Car
    Urgente: factura de Kaia el 5 de octubre

Entiende, entre otras cosas:

| Fecha | Hora | Urgencia |
|---|---|---|
| hoy, mañana, pasado mañana | a las 10, 10:30, 18hs | urgente, importante |
| el jueves, el jueves que viene | a las 9 y media, y cuarto | cuanto antes, sí o sí |
| en 3 días, la semana que viene | al mediodía, a la una | sin apuro, cuando puedas |
| 5 de octubre, 5/10 | 4 pm, 9 am | |

No es inteligencia artificial: son patrones de cómo escribe uno. Lo que no
reconoce queda vacío y se completa a mano en el mismo paso.

## Mover los datos a otro dispositivo

**Ajustes → Copia de seguridad → Copiar al portapapeles.** Pegá ese texto en el
mismo lugar del otro dispositivo y tocá Restaurar. Sirve también como respaldo:
guardalo en una nota y tenés todo a salvo.

## El diseño

Lienzo blanco con auras azules difusas, paneles de vidrio líquido
(translúcidos, con borde claro y reflejo interior), esquinas tipo squircle y un
único azul de marca (`#0084FF`) para todo lo accionable. Los colores fuertes
—rojo, ámbar, violeta, verde— son semánticos: vencido, recordatorio, en curso,
prioridad. Nunca hacen de acento.

Tipografías: **Outfit** para los títulos, **Fustat** para el logo y el nombre de
Taski, **Inter** para el resto. Hay tema claro y oscuro; por defecto sigue al
sistema y se cambia en Ajustes.

## La otra versión

En `taskflow/` está la versión hecha con React y Vite, con más piezas armadas
(bandeja de mensajes entrantes, asistente de preguntas, y el lugar preparado
para conectar base de datos, Telegram y WhatsApp). Necesita Node.js y
`npm install`. Las dos versiones son independientes y no comparten datos.
