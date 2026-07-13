# BriefVault — Authentication System

A secure, email-OTP–verified authentication system built on **MySQL + Prisma**,
with database-backed sessions, hashed passwords, rate limiting, and automatic
cleanup of unverified accounts.

## How it works

### Sign up (with email verification)

1. User submits the sign-up form → `POST /api/auth/signup`.
2. The server validates input (Zod), hashes the password (**bcrypt**, 12 rounds),
   and creates an **unverified** user.
3. A **6-digit OTP** is generated, hashed (SHA-256 + pepper), stored with a
   **5-minute expiry**, and emailed to the user.
4. An **animated OTP modal** opens on the sign-up page with 6 input blocks, a
   live countdown, and a resend option.
5. User enters the code → `POST /api/auth/verify-otp`. On success the user is
   marked verified, all OTPs consumed, and a **session** is created (secure
   httpOnly cookie).
6. If the user does **not** verify within 5 minutes, a background job deletes
   the unverified account (cascading its OTPs/sessions).

### Sign in

- `POST /api/auth/signin` verifies the password with a constant-ish path to
  resist user enumeration, requires a verified email, and creates a session.

### Sessions

- Random 256-bit token; only its **SHA-256 hash** is stored in the DB.
- The raw token lives in an **httpOnly, SameSite=Lax, Secure (prod)** cookie
  (`bv_session`).
- Sessions are revocable (delete the row) and expire (7 days, or 30 with
  “remember me”). Expired sessions are purged by the background job.

## Security measures

- **Password hashing**: bcrypt, cost 12.
- **OTP**: hashed at rest, 5-min TTL, max 5 attempts, single-use, throttled resends.
- **Rate limiting**: per-IP / per-email sliding window on signup, signin, verify,
  and resend (in-memory; swap for Redis to scale horizontally).
- **Sessions**: hashed tokens, httpOnly cookies, revocable + expiring.
- **Validation**: Zod on every endpoint; generic error messages.
- **Cleanup**: `src/instrumentation.ts` runs a minutely job to remove expired
  unverified users and sessions.

## API routes

| Method | Route                   | Purpose                                  |
| ------ | ----------------------- | ---------------------------------------- |
| POST   | `/api/auth/signup`      | Create pending user + send OTP           |
| POST   | `/api/auth/verify-otp`  | Verify OTP, mark verified, start session |
| POST   | `/api/auth/resend-otp`  | Resend a fresh OTP (throttled)           |
| POST   | `/api/auth/signin`      | Password sign in + start session         |
| POST   | `/api/auth/signout`     | Destroy session                          |
| GET    | `/api/auth/me`          | Current user (or `null`)                 |

## Setup

### 1. Environment (`.env`)

```env
DATABASE_URL="mysql://user:password@host:3306/briefvault"
APP_URL="http://localhost:3000"
OTP_TTL_MINUTES=5
OTP_MAX_ATTEMPTS=5
SESSION_TTL_DAYS=7
SESSION_TTL_DAYS_REMEMBER=30

# SMTP — if blank, OTPs are logged to the server console (dev fallback)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="BriefVault <no-reply@briefvault.ai>"
```

> **Note:** if your DB password contains special characters like `@`, they must
> be percent-encoded in the URL (`@` → `%40`).

### 2. Create the schema

```bash
npm run db:push      # creates users, verification_otps, sessions tables
```

### 3. Run

```bash
npm run dev
```

## Database access note

If `prisma db push` returns **`P1010: User was denied access`**, the MySQL
server is refusing the connection. This is a server-side grant/whitelist issue,
not an application bug. On the MySQL server, ensure the database exists and the
user is granted access from the connecting host:

```sql
CREATE DATABASE IF NOT EXISTS briefvault;
CREATE USER 'bookmytime_remote'@'%' IDENTIFIED BY 'BookMyTimeRemote@123';
GRANT ALL PRIVILEGES ON briefvault.* TO 'bookmytime_remote'@'%';
FLUSH PRIVILEGES;
```

Also confirm the host firewall allows inbound connections on port 3306 from your
IP. Once access is granted, re-run `npm run db:push`.

## SMTP

Set the `SMTP_*` variables to deliver real emails (e.g. Postmark, SES, Resend
SMTP, Gmail app password). Without them, the OTP is printed to the server
console so the full flow remains testable in development.
