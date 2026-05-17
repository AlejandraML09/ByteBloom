# ByteBloom

## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) (con el plugin de Compose)
- Python 3.12 con entorno virtual en `backend/venv`
- Node.js

---

## Configuración inicial (La config inicial ya la tienen hecha, no lo hagan :D )
Copiá el ejemplo y completá los valores:

```bash
cp backend/.env.example backend/.env
```
---

Abrir Docker Desktop desde Windows (les va a decir algo como Starting the Docker Engine...
Docker Engine is the underlying technology that runs containers)

## Base de datos (Docker + Postgres)

### Iniciar la base de datos (aplica migraciones pendientes automáticamente)

```bash
docker compose up -d
```
La primera vez que lo inicien tiene que descargar un par de cositas (va a decir Pulling y cuando termina Pulled)
Una vez que hacen eso, la base de datos ya está corriendo.
Para saber si está corriendo o no la base de datos, pueden fijarse desde la aplicación
Docker Desktop(se llama proyectoingeii en mi caso), o correr:

```bash
docker ps
```
Eso va a listar los containers de docker que están corriendo actualmente.
Si ven el que dice db-bytebloom, significa que la base de datos está corriendo

## Ver los datos
Ingresar a http://localhost:8080/ y usar los siguientes datos:

Motor de base de datos: PostgreSQL
Servidor: db-bytebloom
Usuario: postgres
Contraseña: postgres
Base de datos: bytebloom

Y ahí están las tablas!!! :D fin

## Comandos útiles:
### Detener (los datos se conservan)

```bash
docker compose stop
```

### Reiniciar después de un stop

```bash
docker compose start
```

### Borrar todo y empezar de cero

```bash
docker compose down -v && docker compose up -d
```

### Ver el estado de los contenedores

```bash
docker compose ps
```

### Ver los logs de las migraciones

```bash
docker logs bytebloom-migrate-1
```
---

## Aplicar migraciones en Supabase (producción)

Ejecutar antes de cada deploy. La URL se encuentra en el dashboard de Supabase en **Project Settings → Database → Connection string → URI**. 

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:6543/<db>?sslmode=require" alembic upgrade head
```
---

## Cómo correr el Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

## Como correr el Frontend

```bash
cd frontend-react
npm install
npm run dev
```
