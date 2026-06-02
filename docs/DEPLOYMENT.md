# Deployment Guide

## 1. MongoDB Atlas

1. Create a MongoDB Atlas project.
2. Create a free or shared cluster.
3. Add a database user with read/write permissions.
4. Add allowed network access. For Render, `0.0.0.0/0` is commonly used for student demos.
5. Copy the connection string and replace username/password.

Example:

```text
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/medalert
```

## 2. Backend on Render

1. Push the project to GitHub.
2. In Render, create a new Web Service from the GitHub repository.
3. Use:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

4. Add environment variables:

```env
NODE_ENV=production
PORT=10000
MONGO_URI=<mongodb atlas uri>
JWT_SECRET=<long random secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=<vercel frontend url>
CLOUDINARY_CLOUD_NAME=<optional>
CLOUDINARY_API_KEY=<optional>
CLOUDINARY_API_SECRET=<optional>
```

5. Deploy and copy the Render backend URL.

Health check:

```text
https://<render-service>.onrender.com/health
```

## 3. Frontend on Vercel

1. Import the GitHub repository in Vercel.
2. Set the root directory to `frontend`.
3. Add environment variable:

```env
VITE_API_URL=https://<render-service>.onrender.com/api
```

4. Deploy.

## 4. Post-Deployment Checklist

- Register a new user.
- Login using seeded user credentials.
- Update medical profile.
- Add emergency contact.
- Trigger SOS after allowing browser location permission.
- Check emergency history.
- Upload a PDF or image medical record.
- Generate and download QR card.
- Login as admin and verify dashboard analytics.
- Add a hospital from admin dashboard and verify it appears in hospital finder.

## 5. Cloudinary Setup

If Cloudinary credentials are missing, backend stores files locally. For production Render deployments, Cloudinary should be configured because Render local disk is not durable.

Cloudinary environment variables:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
