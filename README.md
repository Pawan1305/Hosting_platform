# Hosting Control Panel Demo

Simple full-stack app for onboarding hosting clients and automating deployment jobs using React, Express, MongoDB, Redis/BullMQ, Docker-on-EC2 (via SSM), and AWS Lambda.

## Architecture

1. React UI sends deployment request to `POST /api/deploy`.
2. API stores deployment in MongoDB with `Pending` status.
3. API enqueues a BullMQ job in Redis and returns immediately.
4. Worker processes the job:
   - Uses AWS SSM `SendCommand` to run Docker commands on EC2.
   - Uses Lambda `InvokeCommand` for post-deployment setup.
5. Worker updates deployment status to `Completed` or `Failed`.
6. UI polls `GET /api/status/:id` every 3 seconds.

## Flow Chart

[Open the Excalidraw flow diagram](https://excalidraw.com/#json=QcsI9AshKNE722RiQWn9E,aw0O4nijoca50cg85v1vcA)

## Project Structure

- `frontend` : React control panel
- `backend` : Express API and BullMQ worker
- `docker-compose.yml` : local MongoDB + Redis

## Prerequisites

- Node.js 20+
- Docker Desktop (for local Redis/Mongo)
- AWS credentials configured in your shell or IAM role

## Setup

1. Start Redis and MongoDB:

```bash
docker compose up -d
```

2. Configure backend env:

```bash
cd backend
cp .env.example .env
```

Update `.env` with your `EC2_INSTANCE_ID` and `LAMBDA_FUNCTION_NAME`.

3. Configure frontend env:

```bash
cd ../frontend
cp .env.example .env
```

4. Run API and worker (two terminals):

```bash
cd backend
npm run dev
```

```bash
cd backend
npm run worker:dev
```

5. Run frontend:

```bash
cd frontend
npm run dev
```

## API

### POST `/api/deploy`

Body:

```json
{
  "clientName": "Acme Corp",
  "domain": "test.ourplatform.com",
  "image": "nginx:latest"
}
```

Response:

```json
{
  "id": "6652...",
  "status": "Pending"
}
```

### GET `/api/status/:id`

Returns deployment details including current status.

## Notes

- The EC2 command uses Docker + `VIRTUAL_HOST=<domain>` convention, which is commonly used behind reverse proxies.
- For production, add authentication, RBAC, stricter validation, and command result polling (`GetCommandInvocation`).
