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

## Si Chrome marca el sitio como "Peligroso"

Les pasa seguido a los subdominios `*.netlify.app`: como se usan mucho para
páginas de phishing, el clasificador de Google los mira con lupa, y una página
que pide mail y contraseña en un dominio anónimo entra justo en ese molde. No
es que el sitio esté comprometido; es reputación de dominio.

Qué hacer, en orden:

1. **Cambiá la contraseña del usuario de Firebase por una única.** El aviso de
   "Comprueba tus contraseñas" aparece porque la que escribiste coincide con
   una que ya tenés guardada para otra cuenta. Eso sí es un riesgo real,
   independiente del cartel.
2. **Reportá el falso positivo** en
   [safebrowsing.google.com/safebrowsing/report_error](https://safebrowsing.google.com/safebrowsing/report_error/).
   Suele destrabarse en horas.
3. **Ponele un nombre al sitio**: Netlify → *Site configuration → Change site
   name*. Un `panel-jalvez.netlify.app` levanta menos sospecha que
   `moonlit-concha-0d18fc`.
4. **Lo que lo resuelve de fondo: un dominio con reputación.** Si tenés uno
   propio, Netlify → *Domain management → Add a domain*. Si no, está la opción
   de GitHub Pages, más abajo.

## Publicarlo en GitHub Pages

Es la alternativa gratuita a Netlify, con un dominio (`github.io`) que Chrome
no marca. Se configura una sola vez:

1. En el repositorio: **Settings → Pages**.
2. En **Source**, elegí **GitHub Actions**.
3. Listo. El workflow `.github/workflows/pages.yml` publica la carpeta `panel/`
   en cada push, y también podés correrlo a mano desde la pestaña *Actions*.

La dirección queda como `https://jonhass21.github.io/JonathanAlvez/`.

> Ojo: los datos se guardan por dirección. Si venías usando el sitio de
> Netlify, en la dirección nueva vas a arrancar de cero — salvo lo que esté en
> Firebase, que viaja con tu usuario. La copia local de cada navegador no.

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
- **Login real con Firebase Authentication**, en lugar de la contraseña
  escondida en el archivo.
- **Funciona sin internet.** Si Firebase no carga, la app sigue andando contra
  el navegador y avisa con el indicador "Solo este equipo" arriba a la derecha.
  Antes, sin conexión, la pantalla quedaba vacía.
- **Deshacer** al borrar una tarea, en vez de un cartel de confirmación.
- **Copia de seguridad** en Ajustes: copiar y pegar para respaldar o mudar.

## Entrada y seguridad

La pantalla de entrada usa **Firebase Authentication**: entrás con el usuario
y la contraseña que creaste en la consola, y la sesión queda guardada en ese
dispositivo. Las reglas de la base exigen esa sesión, así que sin login no se
lee ni se escribe nada.

Para que funcione tienen que estar hechas estas tres cosas en la consola:

1. **Authentication → Sign-in method → Email/contraseña → Habilitar.**
2. **Authentication → Users → Add user**: tu mail y una contraseña.
3. **Realtime Database → Reglas** con la sesión exigida, y **Publicar**.

Si falta alguna, la pantalla de entrada lo dice con el error exacto en lugar
de fallar en silencio.

### El aviso de Firebase sobre las reglas

Firebase marca `{".read": "auth != null"}` como poco confiable, y tiene razón:
**cualquier usuario autenticado del proyecto puede leer y escribir.** Como el
alta por mail está habilitada y la clave de API es pública (está en el archivo,
que es público en el sitio — eso es normal y esperado en Firebase), alguien
podría crearse una cuenta y entrar.

Se cierra atando las reglas a tu usuario:

1. **Authentication → Users** y copiá tu **User UID**.
2. **Realtime Database → Reglas**, reemplazá por esto poniendo tu UID:

   ```json
   { "rules": { ".read": "auth.uid === 'TU_UID'", ".write": "auth.uid === 'TU_UID'" } }
   ```

3. **Publicar**. El aviso naranja desaparece.
4. Opcional pero recomendado: **Authentication → Settings → User actions** y
   desmarcá el alta de usuarios, para que nadie pueda registrarse.

### Si no hay internet

Si Firebase no carga, la pantalla de entrada cambia a **"Entrar sin conexión"**
y pide la contraseña local de siempre. Ahí ves la copia guardada en ese
navegador y los cambios no viajan a la nube; el indicador de arriba lo aclara.
Esa contraseña no da acceso a la base: las reglas la rechazan igual.

## Los datos

Viven en Firebase, en el nodo `panel`, con el mismo formato de siempre:
`{ tareas, nextId, clientes, tareasCliente, nextCliId }`. Los campos nuevos
(hora, prioridad en tareas de cliente, notas) son opcionales, así lo que ya
estaba cargado sigue funcionando sin migrar nada.

Además se guarda una copia local en cada navegador, que es la que se usa cuando
no hay conexión.
