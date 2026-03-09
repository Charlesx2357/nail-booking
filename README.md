# Nail Booking System

A lightweight web application for managing a home-based nail salon booking system.

Customers can view available time slots and submit reservations online, while the salon owner can manage availability and monitor bookings through an admin interface.

This project demonstrates a simple full-stack architecture built with **Next.js, TypeScript, and Supabase**.

---

# Features

## Customer

- View available booking slots
- Select date and start time
- Submit reservation with WeChat ID
- Automatic conflict prevention
- Booking duration constraint (90 minutes)
- Success notification after booking

## Admin

### Availability Management

```
/admin/availability
```

- Generate available slots by date
- Slot interval: 15 minutes
- Enable or remove time slots

### Booking Management

```
/admin/bookings
```

Displays:

- Upcoming bookings (next 30 days)
- Recent bookings (past 30 days)

Each booking includes:

- Date
- Time
- WeChat ID
- Status

---

# Tech Stack

Frontend

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS

Backend

- Next.js Route Handlers (REST API)

Database

- PostgreSQL (Supabase)

Deployment

- Vercel

---

# Project Structure

```
src
 ├── app
 │   ├── page.tsx                # Customer booking page
 │   ├── admin
 │   │   ├── bookings
 │   │   │   └── page.tsx        # Booking management
 │   │   └── availability
 │   │       └── page.tsx        # Availability management
 │
 │   └── api
 │       ├── bookings
 │       │   ├── route.ts        # Create booking
 │       │   └── list
 │       │       └── route.ts    # Query booking list
 │       │
 │       ├── available
 │       │   └── route.ts        # Query available slots
 │       │
 │       └── availability
 │           ├── generate
 │           │   └── route.ts    # Generate slots
 │           └── delete
 │               └── route.ts    # Remove slots
 │
 └── lib
     ├── time.ts
     ├── bookingConfig.ts
     └── supabaseClient.ts
```

---

# Database Schema

## bookings

Stores reservation records.

Fields:

```
id
date
time
wechat_id
status
created_at
```

## availability_slots

Stores available booking slots.

```
date
time
is_open
```

## booking_whitelist

Stores users allowed to make reservations.

```
wechat_id
is_active
created_at
```

Only users in the whitelist are allowed to create bookings.

---

# Booking Logic

When a reservation request is submitted:

1. Validate input data  
2. Check whitelist permission  
3. Detect time conflicts  
4. Insert booking record

Time conflict rule:

```
existing_start < new_end
AND
new_start < existing_end
```

---

# API Endpoints

Create booking

```
POST /api/bookings
```

Query available slots

```
GET /api/available?date=YYYY-MM-DD
```

Query booking list

```
GET /api/bookings/list?date=YYYY-MM-DD
```

---

# Installation

Clone repository

```
git clone https://github.com/yourusername/nail-booking
```

Install dependencies

```
pnpm install
```

Create environment variables

```
.env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
```

Run development server

```
pnpm dev
```

Open

```
http://localhost:3000
```

---

# Deployment

Recommended platform:

Vercel

Steps:

1. Push repository to GitHub
2. Import project in Vercel
3. Configure environment variables

---

# Future Improvements

- Authentication system
- Admin access control
- Real-time booking updates
- Payment integration
- Customer notification system

---

# Author

Charles
