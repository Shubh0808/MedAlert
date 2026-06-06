# MedAlert - Smart Medical Emergency Response System

MedAlert is a production-ready MERN web application for medical emergency response. It supports SOS alerts, GPS location sharing, emergency contacts, nearby hospitals, medical profile management, document uploads, QR emergency cards, emergency history, and an admin dashboard.

## Tech Stack

**Frontend:** React.js, Vite, React Router, Tailwind CSS, Axios, React Query, React Hook Form, Google Maps
**Backend:** Node.js, Express.js, JWT, bcrypt, Multer, Cloudinary-ready uploads  
**Database:** MongoDB Atlas with Mongoose  
**Deployment:** Vercel frontend, Render backend, MongoDB Atlas database

## Folder Structure

```text
MedAlert/
├── backend/
│   ├── scripts/seed.js
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── uploads/
│       ├── utils/
│       ├── app.js
│       └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── utils/
│   ├── vercel.json
│   └── vite.config.js
├── docs/
├── sample-data/
├── render.yaml
└── package.json
```

## Features

- JWT authentication with password hashing and protected routes
- User and admin role-based authorization
- Medical profile with age, gender, blood group, allergies, diseases, medications, and address
- Emergency contacts CRUD
- SOS alert creation with browser GPS coordinates
- Active emergency status and emergency history
- Google Maps location, SOS, hospital marker, and directions support
- Smart Medical Tools center with 26 demo-ready calculators, checklists, triage aids, first-aid tools, and trackers
- Medical records upload with PDF/image validation
- Cloudinary integration when credentials are configured, local upload fallback for development
- QR emergency card generation and download
- Admin analytics for users, alerts, records, and hospitals
- Hospital management from admin dashboard
- Helmet, CORS, rate limiting, input validation, XSS cleanup, Mongo sanitization

## Local Setup

1. Install dependencies:

```bash
npm install
npm install --workspaces
```

2. Configure backend environment:

```bash
copy backend\.env.example backend\.env
```

Set these values in `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<long random secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GOOGLE_MAPS_API_KEY=<your Google Maps JavaScript API key>
```

3. Configure frontend environment:

```bash
copy frontend\.env.example frontend\.env
```

Keep `VITE_API_URL=http://localhost:5000/api`. You can leave `VITE_GOOGLE_MAPS_API_KEY` blank when the backend `GOOGLE_MAPS_API_KEY` is configured.

4. Seed demo data:

```bash
npm run seed
```

5. Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend health check: `http://localhost:5000/health`

## Demo Run Checklist

1. Open a terminal in the project folder.
2. Run `npm install`.
3. Confirm `backend/.env` has `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL=http://localhost:5173`, and `GOOGLE_MAPS_API_KEY`.
4. Confirm `frontend/.env` has `VITE_API_URL=http://localhost:5000/api`.
5. Seed demo accounts and hospitals with `npm run seed`.
6. Start the app with `npm run dev`.
7. Open `http://localhost:5173`.
8. Login with the demo user or admin below.
9. For Google Maps, allow browser location permission on the SOS or Hospitals page.
10. Show the new Medical Tools page at `http://localhost:5173/app/tools`.

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| User | `user@medalert.local` | `User@12345` |
| Admin | `admin@medalert.local` | `Admin@12345` |

## Important API Routes

- `POST /api/register`
- `POST /api/login`
- `POST /api/forgot-password`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/contacts`
- `POST /api/contacts`
- `PUT /api/contacts/:id`
- `DELETE /api/contacts/:id`
- `POST /api/sos`
- `GET /api/alerts`
- `POST /api/upload`
- `GET /api/records`
- `GET /api/hospitals`
- `GET /api/admin/dashboard`

Detailed API documentation is available in [docs/API.md](docs/API.md).

## Deployment

Deployment instructions are available in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Project Report

A report draft for final-year submission is available in [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md).

## Notes

Emergency contact notification is implemented as a backend notification queue placeholder. It records queued notification metadata and can be connected to SMS/WhatsApp providers such as Twilio, MSG91, or Firebase Cloud Messaging during production rollout.
