# pulse-hub
All-in-one social platform combining feeds, rooms, and messaging.

## Structure

- `frontend/`: Next.js, TypeScript, Tailwind CSS, and App Router client
- `backend/`: Node.js, TypeScript, Express, Socket.IO, and MongoDB-ready service

## Development

Install all dependencies from the repository root:

```bash
npm run install:all
```

Run the frontend and backend together:

```bash
npm run dev
```

The frontend runs at `http://localhost:3000`, and the backend runs at `http://localhost:4000`. The backend health endpoint is available at `/health`.

## GitHub Pages

The frontend is configured for GitHub Pages and deploys automatically from `main` through `.github/workflows/deploy-pages.yml`. Enable **Settings > Pages > Source: GitHub Actions** in the repository. The site will be available at `https://<github-username>.github.io/pulse-hub/`.

GitHub Pages only hosts the static frontend. Deploy the backend separately, then set `NEXT_PUBLIC_SOCKET_URL` to its public Socket.IO URL before publishing. MongoDB and Redis also need hosted instances for production use.

The app currently includes local-first posting, reactions, inline comments, and `@[username]` mention styling. The backend persists these through `/api/posts`, `/api/posts/:postId/react`, and `/api/posts/:postId/comments`.

## Host The Backend

The repository includes a production Docker image and a complete local service bundle. Run this from the repository root:

```bash
npm run docker:up
```

This starts the API on `http://localhost:5000`, MongoDB, and Redis. Check that it is alive with `curl http://localhost:5000/health`. Stop the stack with `npm run docker:down`.

For public hosting, deploy the `backend/` Dockerfile to a container host such as Render, Railway, Fly.io, or an equivalent service. Add `MONGO_URI`, `REDIS_URL`, `FRONTEND_URL`, and `PORT` as environment variables. Set `NEXT_PUBLIC_SOCKET_URL` in the frontend build environment to the deployed backend URL.

Copy `backend/.env.example` to `backend/.env` for local development. Set `JWT_SECRET` to a long random value. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` to send verification emails. Without SMTP configuration, development verification codes are printed in the backend logs; production should always configure SMTP.
