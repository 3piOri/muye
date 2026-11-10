# Configuración del administrador de Muyë

La página usa Supabase para guardar el catálogo y autenticar a la persona administradora. El sitio público solo necesita la clave pública de Supabase; las reglas de la base de datos reservan los cambios a las cuentas que agregues expresamente como administradoras.

## 1. Crear el proyecto y la cuenta

1. Crea una cuenta en [supabase.com](https://supabase.com/) y crea un proyecto nuevo. Guarda la contraseña del proyecto en un gestor de contraseñas.
2. En el panel del proyecto abre **SQL Editor**, pega el contenido de `supabase-setup.sql` y ejecuta la consulta. Esto crea las tablas y políticas, e importa los cuatro productos que actualmente están en `services-data.js` (incluyendo sus cambios locales).
3. En **Authentication → Users**, elige **Add user**. Registra el correo y una contraseña segura que quieras usar para entrar a la administración; confirma/verifica el correo desde el panel si se solicita.
4. Copia el **User UID** de esa cuenta. En SQL Editor ejecuta esta consulta reemplazando el UUID de ejemplo por el UID copiado:

   ```sql
   insert into public.admin_users (user_id)
   values ('PEGA-AQUI-EL-USER-UID');
   ```

5. Desactiva el registro público de usuarios en **Authentication → Settings** (o **Sign up**, según la versión del panel). La cuenta administradora ya fue creada desde el panel; no se necesita habilitar registro desde la página.

## 2. Conectar la página

1. En el panel de Supabase abre **Project Settings → API Keys** (en algunas versiones aparece como **Data API**). Copia el **Project URL** y la clave **publishable** (`sb_publishable_...`) o la clave heredada **anon/public**.
2. Abre `supabase-config.js` y pega esos valores:

   ```js
   window.supabaseConfig = {
       url: "https://TU-PROJECT-REF.supabase.co",
       anonKey: "TU-CLAVE-PUBLICA"
   };
   ```

3. Guarda los cambios y publica el sitio en GitHub Pages como haces normalmente. La URL de administración será `https://3piori.github.io/muye/admin.html`.
4. Inicia sesión con el correo y la contraseña que diste de alta en el paso 1.

La URL y la clave **publishable/anon** son públicas por diseño y pueden estar en el código del sitio. **Nunca** copies la contraseña del proyecto, una clave `service_role` ni otra clave `secret` a `supabase-config.js` o al repositorio.

## Uso del catálogo

Desde `/admin.html` puedes cambiar todos los campos de los productos, agregar productos sin límite fijado por la página o eliminarlos por completo. La imagen se indica con una ruta del sitio (por ejemplo, `6.png`) o una URL pública; los archivos locales nuevos deben agregarse y publicarse en el repositorio. Los cambios se guardan en Supabase y aparecen en la página pública.

Mientras no completes la conexión con Supabase, la página pública seguirá mostrando los productos locales de `services-data.js`. Una vez configurada la conexión, el catálogo se lee desde Supabase.
