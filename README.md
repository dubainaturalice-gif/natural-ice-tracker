# Natural Ice Production Tracker

A full-stack web application for tracking daily ice production by shift, managing raw materials, and viewing monthly summaries for a Dubai ice factory.

## Features

- **User Authentication** — Role-based access (Admin, Manager, Worker)
- **Shift Production Entry** — Hourly production grid for morning and night shifts
- **Two Production Teams** — Production Team 1 (tubes, crushed ice, cups) and Cutting Team 2 (luxury ice balls, cubes)
- **Raw Materials Tracking** — Initial stock, usage, and automatic carry-over from previous shifts
- **Monthly Summary** — Calendar view with daily/monthly totals and pallet calculations
- **User Management** — Admin can create, edit, and delete user accounts
- **Cell Locking** — Workers can only edit cells once; admins/managers can always edit
- **Auto-Save** — Changes are automatically saved after 2 seconds of inactivity

## Default Accounts

| Username | Password | Role | Team | Shift |
|---|---|---|---|---|
| admin | admin123 | Admin | — | — |
| manager1 | manager123 | Manager | — | — |
| team1_morning | worker123 | Worker | Team 1 | Morning |
| team1_night | worker123 | Worker | Team 1 | Night |
| team2_morning | worker123 | Worker | Team 2 | Morning |
| team2_night | worker123 | Worker | Team 2 | Night |

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Development

```bash
# Install all dependencies
npm run setup

# Start both server and client in dev mode
npm run dev
```

The server runs on `http://localhost:3000` and the client dev server on `http://localhost:5173` (with API proxy to port 3000).

### Production Build

```bash
# Build the client
npm run build

# Start the production server
npm start
```

The production server serves both the API and the built React app on port 3000.

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t natural-ice-tracker .
docker run -p 3000:3000 -v ./data:/app/data natural-ice-tracker
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | `change-this-to-a-secure-secret` | Secret key for JWT tokens |

Copy `.env.example` to `.env` and update the values for production use.

## Tech Stack

- **Backend**: Node.js, Express, better-sqlite3, bcryptjs, jsonwebtoken
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, DaisyUI, lucide-react
- **Database**: SQLite (file-based, stored in `./data/`)
- **Deployment**: Docker, Docker Compose
