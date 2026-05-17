# ByteBloom

## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) (con el plugin de Compose)
- Python 3.12 con entorno virtual en `backend/venv`
- Node.js

---

## Configuración inicial

Copiá el ejemplo y completá los valores:

```bash
cp backend/.env.example backend/.env
```

---

## Base de datos (Docker + Postgres)

### Iniciar la base de datos (aplica migraciones pendientes automáticamente)

```bash
docker compose up -d
```

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

## Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend-react
npm install
npm run dev
```
