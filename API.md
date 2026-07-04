# API.md — Smart Pantry

## Overview

- **Base URL:** `https://api.smartpantry.com/v1`
- **Authentication:** Bearer token (JWT) via `Authorization: Bearer <token>` header
- **Response format:** All endpoints return `{ "data": ..., "message": "..." }` JSON
- **Content-Type:** `application/json`

---

## 1. Auth

### POST `/auth/register`

Register a new user account.

**Request**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `201`**
```json
{
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "usr_01",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar_url": null
    }
  },
  "message": "Registration successful"
}
```

---

### POST `/auth/login`

Authenticate and receive a token.

**Request**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `200`**
```json
{
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "usr_01",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar_url": "https://..."
    }
  },
  "message": "Login successful"
}
```

---

### POST `/auth/logout`

> Requires auth

Invalidate the current token.

**Response `200`**
```json
{
  "data": null,
  "message": "Logged out"
}
```

---

## 2. Profile

### GET `/profile`

> Requires auth

Get the authenticated user's profile. Used by `ProfileTab` to display name, email, and avatar.

**Response `200`**
```json
{
  "data": {
    "id": "usr_01",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://..."
  },
  "message": "OK"
}
```

---

## 3. Inventory

### GET `/inventory`

> Requires auth

Fetch pantry items. Used by `InventoryTab` to display items per storage category and the summary counts in the header.

**Query params**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | `string` | No | Filter by `kulkas`, `freezer`, or `rak_dapur`. Returns all if omitted. |

**Response `200`**
```json
{
  "data": [
    {
      "id": "inv_01",
      "name": "Sawi Hijau",
      "icon": "🥬",
      "stock": 2,
      "unit": "ikat",
      "expired_at": "2026-07-06",
      "category": "kulkas"
    },
    {
      "id": "inv_02",
      "name": "Daging Sapi",
      "icon": "🥩",
      "stock": 1,
      "unit": "kg",
      "expired_at": "2026-08-02",
      "category": "freezer"
    }
  ],
  "message": "OK"
}
```

> `expired_at` is an ISO 8601 date string (`YYYY-MM-DD`). The app calculates the "X Hari Lagi" label and color from it:
> - ≤ 2 days → red
> - ≤ 5 days → yellow
> - \> 5 days → green

---

### POST `/inventory`

> Requires auth

Add a new item to the pantry. Used by the "Input Langsung" tab inside `AddTab`.

**Request**
```json
{
  "name": "Wortel Segar",
  "icon": "🥕",
  "stock": 5,
  "unit": "biji",
  "expired_at": "2026-07-08",
  "category": "kulkas"
}
```

**Field rules**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | |
| `icon` | string | Yes | Single emoji character |
| `stock` | integer | Yes | Must be > 0 |
| `unit` | string | Yes | e.g. `kg`, `biji`, `ikat`, `liter`, `bungkus` |
| `expired_at` | string | Yes | ISO date `YYYY-MM-DD` |
| `category` | string | Yes | `kulkas` \| `freezer` \| `rak_dapur` |

**Response `201`**
```json
{
  "data": {
    "id": "inv_03",
    "name": "Wortel Segar",
    "icon": "🥕",
    "stock": 5,
    "unit": "biji",
    "expired_at": "2026-07-08",
    "category": "kulkas"
  },
  "message": "Item added"
}
```

---

## 4. Shopping List

### GET `/shopping`

> Requires auth

Fetch the current shopping list. Used by the "Daftar Belanja" tab inside `AddTab`.

**Response `200`**
```json
{
  "data": [
    {
      "id": "shop_01",
      "name": "Ayam Fillet",
      "quantity": 1,
      "unit": "kg",
      "is_bought": false
    }
  ],
  "message": "OK"
}
```

---

### POST `/shopping`

> Requires auth

Add an item to the shopping list.

**Request**
```json
{
  "name": "Telur",
  "quantity": 10,
  "unit": "butir"
}
```

**Response `201`**
```json
{
  "data": {
    "id": "shop_02",
    "name": "Telur",
    "quantity": 10,
    "unit": "butir",
    "is_bought": false
  },
  "message": "Item added to shopping list"
}
```

---

### PATCH `/shopping/:id/toggle`

> Requires auth

Toggle the `is_bought` status of a shopping list item. Triggered by the checkbox in `ShoppingListItem`.

**Response `200`**
```json
{
  "data": {
    "id": "shop_01",
    "is_bought": true
  },
  "message": "Updated"
}
```

---

## 5. Notifications

### GET `/notifications`

> Requires auth

Fetch all notifications for the authenticated user, ordered by `created_at` descending. Used by `NotificationTab`.

**Response `200`**
```json
{
  "data": [
    {
      "id": "notif_01",
      "title": "Waktunya Masak!",
      "description": "Rekomendasi menu hari ini sudah siap untukmu",
      "type": "cooking",
      "created_at": "2026-07-03T08:00:00Z"
    },
    {
      "id": "notif_02",
      "title": "Stok Telur Menipis",
      "description": "Jangan lupa masukan tempe ke daftar belanja",
      "type": "stock",
      "created_at": "2026-07-02T10:00:00Z"
    }
  ],
  "message": "OK"
}
```

**Notification types**

| `type` | Trigger | Icon in app |
|--------|---------|-------------|
| `cooking` | Daily menu recommendation | 🍳 |
| `stock` | Item stock is low | 📦 |
| `warning` | Item expiring within 3 days | ⚠️ |
| `expired` | Item has expired and was removed | 🗑️ |

> Notifications are **server-generated** (e.g., via a scheduled job that checks inventory expiry dates daily). The app only reads them.

---

## Endpoint Summary

| Method | Endpoint | Auth | Used by |
|--------|----------|------|---------|
| POST | `/auth/register` | No | Register screen |
| POST | `/auth/login` | No | Login screen |
| POST | `/auth/logout` | Yes | Profile tab |
| GET | `/profile` | Yes | Profile tab |
| GET | `/inventory` | Yes | Inventory tab |
| POST | `/inventory` | Yes | Add tab (Input Langsung) |
| GET | `/shopping` | Yes | Add tab (Daftar Belanja) |
| POST | `/shopping` | Yes | Add tab (Daftar Belanja) |
| PATCH | `/shopping/:id/toggle` | Yes | Add tab (Daftar Belanja) |
| GET | `/notifications` | Yes | Notification tab |

---

## Error Responses

All endpoints return consistent error shapes:

```json
{
  "data": null,
  "message": "Unauthorized"
}
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request / validation error |
| `401` | Missing or invalid token |
| `404` | Resource not found |
| `422` | Unprocessable entity (field errors) |
| `500` | Internal server error |
