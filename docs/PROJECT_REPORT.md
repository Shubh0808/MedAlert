# MedAlert Project Report

## 1. Title

MedAlert - Smart Medical Emergency Response System

## 2. Abstract

MedAlert is a full-stack web application designed to assist users during medical emergencies. The system provides one-click SOS alerts, real-time GPS location capture, emergency contact management, nearby hospital discovery, medical profile storage, secure medical document upload, QR-based emergency cards, emergency history, and an administrative monitoring dashboard. The project demonstrates real-world full-stack development using React, Node.js, Express, MongoDB, JWT authentication, secure file upload validation, and cloud deployment readiness.

## 3. Problem Statement

During medical emergencies, victims or bystanders often lose critical time while trying to contact family members, share location, identify nearby hospitals, or communicate medical conditions such as blood group and allergies. MedAlert solves this by centralizing emergency identity, contact, document, and location workflows in a single responsive web platform.

## 4. Objectives

- Provide one-click SOS alert creation.
- Capture and store GPS location during emergencies.
- Maintain emergency contacts for notification workflows.
- Store medical profile details such as blood group, allergies, diseases, and medications.
- Support PDF and image upload for medical records.
- Display nearby hospitals with distance and directions.
- Generate downloadable QR emergency cards.
- Provide admin analytics and monitoring tools.
- Demonstrate secure, deployable MERN architecture.

## 5. Scope

The system is intended for patients, students, working professionals, elderly users, and administrators who manage emergency operations. The current implementation supports browser-based geolocation and notification queue simulation. It can be extended with SMS, WhatsApp, ambulance APIs, and hospital partner integrations.

## 6. Technology Used

| Layer | Technology |
| --- | --- |
| Frontend | React.js, Vite, Tailwind CSS, React Router |
| State/Data | React Query, Axios, React Hook Form |
| Maps | Leaflet, OpenStreetMap |
| Backend | Node.js, Express.js |
| Authentication | JWT, bcrypt |
| Uploads | Multer, Cloudinary-ready storage |
| Database | MongoDB Atlas, Mongoose |
| Deployment | Vercel, Render |

## 7. System Modules

### Authentication Module

Users can register, login, request password reset, and access protected routes. Passwords are hashed with bcrypt and JWT tokens secure API access.

### Medical Profile Module

Stores full name, phone, age, gender, blood group, allergies, diseases, medications, and address.

### Emergency Contact Module

Users can add, edit, delete, and mark primary emergency contacts.

### SOS Emergency Module

Creates an emergency alert with latitude, longitude, timestamp, status, user reference, and queued contact notification metadata.

### Location and Hospital Module

Uses browser geolocation and Leaflet maps to show current location, active SOS position, hospitals, distance, and direction links.

### Medical Records Module

Allows PDF/image upload with server-side file type and size validation. Stores file metadata in MongoDB.

### QR Emergency Card Module

Generates a QR code containing critical emergency details such as name, blood group, allergies, and primary emergency contact.

### Admin Dashboard

Admins can view total users, active emergencies, uploaded records, registered hospitals, user lists, emergency lists, records, and hospital management.

## 8. Database Design

Main Mongoose models:

- `User`
- `Admin`
- `EmergencyContact`
- `EmergencyAlert`
- `MedicalRecord`
- `Hospital`

Relationships:

- One user has many emergency contacts.
- One user has many emergency alerts.
- One user has many medical records.
- Admin metadata references a user with role `admin`.
- Hospital data is shared across users and managed by admins.

## 9. Security Features

- JWT authentication.
- bcrypt password hashing.
- Protected route middleware.
- Admin role authorization.
- Helmet security headers.
- CORS allow-listing.
- Rate limiting.
- Input validation with express-validator.
- MongoDB query sanitization.
- XSS cleanup.
- Multer file type and size validation.

## 10. Deployment Architecture

```text
User Browser
    |
    v
Vercel React Frontend
    |
    v
Render Express API
    |
    v
MongoDB Atlas
    |
    v
Cloudinary optional file storage
```

## 11. Testing and Demonstration Plan

1. Register a new user.
2. Login and update medical profile.
3. Add emergency contacts.
4. Trigger SOS after enabling location permission.
5. Verify alert appears in emergency history.
6. Open hospital finder and view nearby hospitals.
7. Upload PDF/image medical record.
8. Generate and download QR emergency card.
9. Login as admin.
10. Verify dashboard analytics and emergency monitoring.
11. Add a hospital and verify hospital listing.

## 12. Future Enhancements

- SMS/WhatsApp integration using Twilio, MSG91, or WhatsApp Business API.
- Ambulance dispatch integration.
- Real-time WebSocket tracking.
- Push notifications.
- OCR-based medical document parsing.
- Doctor/hospital partner portal.
- Native Android/iOS app.

## 13. Conclusion

MedAlert demonstrates how modern web technologies can be used to build a practical emergency response system. The project combines user-centered design, secure backend APIs, MongoDB data modeling, responsive UI, maps, QR generation, and deployment readiness, making it suitable for a final-year major project demonstration.
