# Panel · Jonathan Alvez

Clientes, tareas, calendario e informes en un solo archivo. Sincronizado con
Firebase, con los colores de la marca.

## Subirlo a Netlify

El archivo es `panel/index.html`. Dos caminos:

**Arrastrar (1 minuto).** Descargá `panel/index.html` y arrastralo a
[app.netlify.com/drop](https://app.netlify.com/drop). Si querés el ícono en el
celular, arrastrá la carpeta `panel` entera en vez del archivo suelto.

**Conectar el repositorio (se actualiza solo).** En Netlify →
*Add new site → Import an existing project → GitHub* → este repositorio. El
`netlify.toml` ya dice qué publicar (`panel/`), no hay que tocar nada. Cada
push republica.

En el sitio que ya tenías: *Site configuration → Build & deploy → Continuous
deployment*, y ahí apuntás a este repositorio y a la rama.

## Qué cambió respecto del archivo anterior

**Se mantiene igual:** la base de datos de Firebase (misma configuración, mismo
nodo `panel`, mismo formato de datos), la contraseña de entrada, las tareas por
área (Trabajo / Personal / Otro), el calendario, los clientes con emoji y el
informe descargable como imagen.

**Nuevo:**

- **Panel propio por cliente.** Tocás un cliente y entrás a su pantalla:
  pendientes, vencidas, completadas, porcentaje de avance, próxima entrega,
  notas y un botón para generar su informe.
- **Escribir en lenguaje natural.** "Preparar el reel de San Lucas mañana a las
  10" se convierte en tarea con cliente, fecha y hora. Si nombrás un cliente, la
  tarea va sola a su panel.
- **Taski**, el asistente: responde con tus propios datos, sin conexión externa.
- **Una sola lista en Hoy.** Antes las tareas propias y las de clientes vivían
  en pantallas separadas; ahora se ven juntas, ordenadas por fecha.
- **Recordatorios** de lo que vence en la próxima hora, y aviso de vencidas.
- **Buscador** por tarea, área o cliente.
- **Tema claro y oscuro**, siguiendo el sistema por defecto.
- **Funciona sin internet.** Si Firebase no carga, la app sigue andando contra
  el navegador y avisa con el indicador "Solo este equipo" arriba a la derecha.
  Antes, sin conexión, la pantalla quedaba vacía.
- **Deshacer** al borrar una tarea, en vez de un cartel de confirmación.
- **Copia de seguridad** en Ajustes: copiar y pegar para respaldar o mudar.

## Importante: la contraseña no protege los datos

La contraseña de entrada oculta la pantalla, pero está adentro del archivo:
cualquiera que mire el código fuente la esquiva. Y la base de datos responde
igual, porque el navegador se conecta antes de que vos escribas nada.

Si en las reglas de tu Realtime Database dice `".read": true`, **cualquiera que
tenga la dirección de la base puede leer y modificar los datos de tus
clientes.** La dirección está en el archivo, que es público en el sitio.

Se arregla una vez, en la consola de Firebase:

1. **Authentication → Sign-in method → Email/contraseña → Habilitar.**
2. **Authentication → Users → Add user**: tu mail y una contraseña.
3. **Realtime Database → Reglas**, y pegar:

   ```json
   { "rules": { ".read": "auth != null", ".write": "auth != null" } }
   ```

4. Avisame y cambio la pantalla de entrada por el login real de Firebase.

Hasta que eso esté, lo que hay es un cartel en la puerta, no una cerradura.

## Los datos

Viven en Firebase, en el nodo `panel`, con el mismo formato de siempre:
`{ tareas, nextId, clientes, tareasCliente, nextCliId }`. Los campos nuevos
(hora, prioridad en tareas de cliente, notas) son opcionales, así lo que ya
estaba cargado sigue funcionando sin migrar nada.

Además se guarda una copia local en cada navegador, que es la que se usa cuando
no hay conexión.
