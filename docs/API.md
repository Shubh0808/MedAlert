# MedAlert API Documentation

Base URL for local development:

```text
http://localhost:5000/api
```

Use a bearer token for protected routes:

```text
Authorization: Bearer <jwt-token>
```

## Public Config

### GET `/public/maps-config`

Returns the Google Maps browser key configured in `backend/.env`.

```json
{
  "googleMapsApiKey": "<key>",
  "hasGoogleMapsApiKey": true
}
```

## Authentication

### POST `/register`

Creates a user account.

```json
{
  "fullName": "Demo Patient",
  "email": "user@example.com",
  "phone": "+91 98765 43210",
  "password": "Password@123"
}
```

### POST `/login`

Authenticates user or admin.

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

### POST `/forgot-password`

Generates a reset token. In development, the token is returned in the response for demo purposes.

```json
{
  "email": "user@example.com"
}
```

### POST `/reset-password/:token`

Updates password for a valid reset token.

```json
{
  "password": "NewPassword@123"
}
```

## Profile

### GET `/profile`

Returns authenticated user profile and contacts.

### PUT `/profile`

Updates medical profile.

```json
{
  "fullName": "Demo Patient",
  "phone": "+91 98765 43210",
  "medicalProfile": {
    "age": 22,
    "gender": "male",
    "bloodGroup": "O+",
    "allergies": ["Penicillin"],
    "existingDiseases": ["Asthma"],
    "currentMedications": ["Salbutamol inhaler"],
    "address": "Chennai, Tamil Nadu"
  }
}
```

## Emergency Contacts

### GET `/contacts`

Returns user contacts.

### POST `/contacts`

```json
{
  "name": "Ravi Kumar",
  "relation": "Father",
  "phone": "+91 98765 43210",
  "isPrimary": true
}
```

### PUT `/contacts/:id`

Updates a contact.

### DELETE `/contacts/:id`

Deletes a contact.

## Emergency Alerts

### POST `/sos`

Creates an SOS alert.

```json
{
  "latitude": 13.0827,
  "longitude": 80.2707,
  "notes": "SOS triggered from MedAlert web app"
}
```

### GET `/alerts`

Returns user alerts. Admin users receive all alerts.

### GET `/alerts/:id`

Returns one alert.

### PATCH `/alerts/:id/resolve`

Marks an alert as resolved.

## Medical Records

### POST `/upload`

Uploads one medical record file. Use `multipart/form-data`.

Fields:

| Field | Type | Required |
| --- | --- | --- |
| `title` | string | yes |
| `category` | string | no |
| `tags` | comma-separated string | no |
| `file` | PDF/JPG/PNG/WebP | yes |

### GET `/records`

Returns user records. Admin users receive all records.

### DELETE `/records/:id`

Deletes a user-owned record.

## Hospitals

### GET `/hospitals`

Returns active hospitals.

Optional query:

```text
/hospitals?lat=13.0827&lng=80.2707&radius=100
```

### POST `/hospitals`

Admin only.

```json
{
  "name": "Apollo Emergency Care",
  "phone": "+91 44 2829 3333",
  "address": "Greams Road, Chennai",
  "latitude": 13.0635,
  "longitude": 80.2516,
  "services": ["Emergency", "ICU", "Ambulance"]
}
```

### PUT `/hospitals/:id`

Admin only.

### DELETE `/hospitals/:id`

Admin only. Soft-deactivates the hospital.

## Admin

### GET `/admin/dashboard`

Returns:

```json
{
  "stats": {
    "totalUsers": 10,
    "activeEmergencies": 1,
    "totalRecordsUploaded": 12,
    "registeredHospitals": 4
  },
  "recentEmergencies": []
}
```

### GET `/admin/users`

Returns all users.

### GET `/admin/alerts`

Returns all alerts with user details.

### GET `/admin/records`

Returns all uploaded records.
