# SkillSwap Frontend Development Guide

> **A complete guide to build, connect, and deploy the SkillSwap frontend with its Spring Boot backend (PostgreSQL + Redis)**

---

## Table of Contents
1. [Recommended Framework](#1-recommended-framework)
2. [Backend Architecture Overview](#2-backend-architecture-overview)
3. [Database Schema](#3-database-schema)
4. [Backend Connection Details](#4-backend-connection-details)
5. [Complete API Reference](#5-complete-api-reference)
6. [Authentication Flow (JWT)](#6-authentication-flow-jwt)
7. [WebSocket Real-Time Chat](#7-websocket-real-time-chat)
8. [Frontend Project Structure](#8-frontend-project-structure)
9. [State Management Strategy](#9-state-management-strategy)
10. [Component Architecture Map](#10-component-architecture-map)
11. [Step-by-Step Setup](#11-step-by-step-setup)
12. [Key Integration Patterns](#12-key-integration-patterns)
13. [Environment Variables](#13-environment-variables)

---

## 1. Recommended Framework

### ✅ Winner: **React + Vite** (TypeScript)

| Framework | Verdict | Reason |
|-----------|---------|--------|
| **React + Vite** | ✅ **BEST CHOICE** | Fast builds, rich ecosystem, already configured in CORS (port 5173) |
| Next.js | ⚠️ Overkill | SSR not needed; backend is a REST API, not a CMS |
| Angular | ❌ Skip | Heavy, steep learning curve; CORS port 4200 configured but ecosystem is Java-like |
| Vue + Vite | ⚠️ Good alt | CORS also configured (port 5173), but React has better SkillSwap-type app templates |

**Why React + Vite is the best fit:**
- The backend's CORS config explicitly allows `https://localhost:5173` (Vite's default)
- The backend uses **STOMP over WebSocket** — `@stomp/stompjs` is a mature React library
- React's component model aligns perfectly with: User cards, Session cards, Admin tables
- Huge library of chart/table libraries for the Admin dashboard
- Fastest cold-start dev server of any framework

### Recommended stack:
```
React 18 + Vite + TypeScript
  ├── React Router DOM v6        (routing)
  ├── Axios                      (HTTP client with interceptors)
  ├── @stomp/stompjs + sockjs-client (WebSocket/STOMP)
  ├── Zustand                    (lightweight global state)
  ├── React Query (TanStack)     (server state / data fetching)
  ├── React Hook Form + Zod      (forms + validation)
  ├── shadcn/ui + Radix UI       (component primitives)
  └── Lucide React               (icons)
```

---

## 2. Backend Architecture Overview

The backend is a **Spring Boot 3.2.5** application with the following layers:

```
Spring Boot Backend (runs on port 8443, HTTPS)
│
├── 🔐 Security Layer
│   ├── JWT Access Token  (15 min expiry)
│   ├── JWT Refresh Token (24 hr expiry)
│   ├── BCrypt Password Encoding (strength 12)
│   └── Role-Based Access Control (USER | MENTOR | ADMIN)
│
├── 🌐 REST Controllers (7 controllers)
│   ├── AuthController    → /auth/**
│   ├── UserController    → /api/users/**
│   ├── SessionController → /api/sessions/**
│   ├── ReviewController  → /api/sessions/{id}/review
│   ├── AdminController   → /api/admin/**
│   ├── ApplicationController → /api/mentor/**
│   └── ChatController    → WebSocket /app/chat.sendMessage
│
├── 🗃️ Database Layer
│   ├── PostgreSQL (port 5432) — primary data store
│   └── Redis/Upstash — OTP caching (10-min TTL)
│
├── 📧 Notification Layer
│   └── Gmail SMTP — async email for all major events
│
└── 🔌 WebSocket Layer
    └── STOMP over SockJS at /ws-chat
```

### User Roles and Permissions

| Role | What They Can Do |
|------|-----------------|
| **USER** | Browse mentors, book sessions, submit reviews, change password, set profile |
| **MENTOR** | Everything USER can + set availability, accept/reject session requests |
| **ADMIN** | Full system control: view all users/sessions, approve/reject mentor apps, resolve disputes, force-cancel sessions |

### Pricing Model (Dynamic Credits)
```
1 hour  → 50 credits
2 hours → 70 credits  (50 + 20)
3 hours → 90 credits  (50 + 40)
N hours → 50 + (N-1) × 20 credits
```

New users receive **1000 credits** on signup.

---

## 3. Database Schema

### PostgreSQL Tables

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT (PK) | Auto-generated |
| `name` | VARCHAR | Not null |
| `email` | VARCHAR (unique) | Indexed, not null |
| `password` | VARCHAR | BCrypt encoded |
| `credits` | INT | Default: 1000 |
| `role` | VARCHAR | USER / MENTOR / ADMIN |
| `bio` | TEXT | Set when approved as mentor |
| `created_at` | TIMESTAMP | Auto-set |

#### `user_profile_skills`
| Column | Type | Notes |
|--------|------|-------|
| `user_id` | BIGINT (FK → users.id) | |
| `skill_name` | VARCHAR | Mentor's skill list |

#### `availabilities`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT (PK) | |
| `mentor_id` | BIGINT (FK → users.id) | |
| `start_time` | TIMESTAMP | Must be in the future |
| `end_time` | TIMESTAMP | Must be after start |
| `is_booked` | BOOLEAN | Default: false |

#### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT (PK) | |
| `learner_id` | BIGINT (FK → users.id) | |
| `mentor_id` | BIGINT (FK → users.id) | |
| `availability_id` | BIGINT (FK → availabilities.id) | |
| `skill_name` | VARCHAR | |
| `duration_hours` | INT | |
| `status` | VARCHAR | See SessionStatus enum |
| `meeting_link` | VARCHAR | Jitsi link (set on accept) |
| `admin_notes` | TEXT | Admin dispute notes |
| `disputed_by` | VARCHAR | Email of who raised dispute |
| `mentor_proof_notes` | VARCHAR | Optional mentor notes |
| `reminder_sent` | BOOLEAN | Scheduler flag |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### **Session Status Flow**
```
PENDING → ACCEPTED → MENTOR_COMPLETED  ┐
                  → LEARNER_COMPLETED  ┘→ COMPLETED (payout)
         ↓                               ↓
       REJECTED              DISPUTED → REFUNDED (admin review)
         ↓
       CANCELLED
```

#### `reviews`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT (PK) | |
| `session_id` | BIGINT (FK) | One review per session |
| `reviewer_id` | BIGINT (FK → users.id) | The learner |
| `reviewee_id` | BIGINT (FK → users.id) | The mentor |
| `rating` | INT | 1–5 stars |
| `comment` | VARCHAR(500) | |
| `timestamp` | TIMESTAMP | |

> ⚠️ **Note:** Rating ≤ 2 automatically triggers a DISPUTED status and pauses payout.

#### `credit_transactions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT (PK) | |
| `user_id` | BIGINT (FK) | |
| `amount` | INT | Negative = deduction, Positive = credit |
| `description` | VARCHAR | Human-readable reason |
| `timestamp` | TIMESTAMP | |

#### `mentor_requests`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT (PK) | |
| `user_id` | BIGINT (FK) | Applicant |
| `certificate_url` | VARCHAR | Link to PDF proof |
| `proposed_bio` | TEXT | Bio used if approved |
| `status` | VARCHAR | PENDING / APPROVED / REJECTED |
| `admin_notes` | VARCHAR | Notes from admin |
| `created_at` | TIMESTAMP | |

#### `mentor_requests_proposed_skills`
| Column | Type | Notes |
|--------|------|-------|
| `mentor_request_id` | BIGINT (FK) | |
| `proposed_skills` | VARCHAR | Skills list if approved |

#### `admin_activity_log`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT (PK) | |
| `activity_type` | VARCHAR | LOGIN / SIGNUP / etc. |
| `user_id` | BIGINT (FK) | |
| `timestamp` | TIMESTAMP | |

#### `chat_messages`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT (PK) | |
| `session_id` | BIGINT (FK) | |
| `sender_email` | VARCHAR | |
| `content` | TEXT | |
| `timestamp` | TIMESTAMP | |

### Redis (Upstash)
- **Key pattern:** `otp:{email}`
- **Value:** 6-digit OTP string
- **TTL:** 10 minutes
- **Purpose:** Password reset only

---

## 4. Backend Connection Details

```
Base URL:        https://localhost:8443
WebSocket URL:   wss://localhost:8443/ws-chat
Swagger UI:      https://localhost:8443/swagger-ui.html
API Docs:        https://localhost:8443/api-docs
SSL:             Self-signed PKCS12 (.p12 format)
```

> ⚠️ **HTTPS Warning:** The backend uses a self-signed SSL certificate. You must either:
> - Accept the certificate in your browser by visiting `https://localhost:8443` once, OR
> - Configure your Axios instance to bypass SSL in development (only)

### CORS Configured Origins (from SecurityConfig.java)
- `https://localhost:3000` (Create React App)
- `https://localhost:4200` (Angular)
- `https://localhost:5173` ← **Use this with Vite**

---

## 5. Complete API Reference

> All protected routes require header: `Authorization: Bearer <accessToken>`

### 5.1 Authentication — `/auth`

| Method | Endpoint | Auth | Request Body | Response |
|--------|----------|------|-------------|----------|
| POST | `/auth/signup` | ❌ Public | `{ name, email, password }` | `"User registered successfully"` |
| POST | `/auth/login` | ❌ Public | `{ email, password }` | `{ accessToken, refreshToken, email, role, credits }` |
| POST | `/auth/refresh` | ❌ Public | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| GET | `/auth/profile` | ✅ Any User | — | `{ id, name, email, role, credits, createdAt }` |
| POST | `/auth/forgot-password` | ❌ Public | `{ email }` | `"OTP sent..."` |
| POST | `/auth/reset-password` | ❌ Public | `{ email, otp, newPassword }` | `"Password has been reset..."` |

**Signup Request Schema:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Login Response Schema:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "john@example.com",
  "role": "USER",
  "credits": 1000
}
```

---

### 5.2 User Management — `/api/users`

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/api/users/by-email?email=x` | USER | Lookup user profile by email |
| GET | `/api/users/{id}/profile` | ✅ Any | View any user's full profile |
| PUT | `/api/users/profile` | USER or MENTOR | Update own name and bio only |
| POST | `/api/users/change-password` | Any role | `{ oldPassword, newPassword }` |
| GET | `/api/users/search?skill=React&minRating=3.5` | ✅ Any | Search mentors by skill + rating |
| GET | `/api/users/leaderboard` | ✅ Any | Top 5 rated mentors |
| GET | `/api/users/all-profiles` | ✅ Any | All mentor profiles (for Explore page) |
| GET | `/api/users/stats` | USER | `{ currentBalance, totalSessionsMentored, totalSessionsLearned, totalCreditsEarned, totalCreditsSpent }` |
| GET | `/api/users/transactions` | USER | Credit transaction history |
| POST | `/api/users/availability` | MENTOR only | `{ startTime, endTime }` (ISO 8601) |
| GET | `/api/users/{id}/availability` | ✅ Any | Get mentor's open time slots |

**UserProfileDTO Response:**
```json
{
  "id": 1,
  "name": "Jane Mentor",
  "email": "jane@example.com",
  "bio": "10 years React expert",
  "skills": ["React", "TypeScript", "Node.js"],
  "averageRating": 4.7,
  "totalReviews": 23
}
```

**AvailabilityDTO Request (ISO 8601 format):**
```json
{
  "startTime": "2026-04-10T14:00:00",
  "endTime": "2026-04-10T16:00:00"
}
```

---

### 5.3 Sessions — `/api/sessions`

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| POST | `/api/sessions/request/{availabilityId}?skillName=React&durationHours=2` | USER | Book a session |
| POST | `/api/sessions/{id}/accept` | MENTOR | Accept → triggers escrow deduction + Jitsi link |
| POST | `/api/sessions/{id}/complete` | MENTOR or USER | Mutual confirmation required |
| POST | `/api/sessions/{id}/cancel` | USER or MENTOR | Cancel / reject (refunds if ACCEPTED) |
| POST | `/api/sessions/{id}/dispute` | USER or MENTOR | Raise a dispute |
| GET | `/api/sessions/pending-requests` | MENTOR | View all pending session requests |
| GET | `/api/sessions/dashboard` | USER | Full user dashboard data |

**SessionResponseDTO:**
```json
{
  "id": 42,
  "learnerId": 3,
  "mentorId": 7,
  "skillName": "React",
  "durationHours": 2,
  "status": "ACCEPTED",
  "meetingLink": "https://meet.jit.si/SkillSwap-Sess-42-abc12345",
  "createdAt": "2026-04-05T10:00:00",
  "updatedAt": "2026-04-05T10:05:00"
}
```

**UserDashboardDTO:**
```json
{
  "credits": 950,
  "myRequests": [...],
  "myMentoringSessions": [...],
  "completedHistory": [...]
}
```

---

### 5.4 Reviews — `/api/sessions/{sessionId}/review`

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| POST | `/api/sessions/{sessionId}/review` | USER | One review per session. Rating ≤ 2 auto-raises dispute |

**ReviewRequestDTO:**
```json
{
  "rating": 4,
  "comment": "Great session, learned a lot!"
}
```

**ReviewResponseDTO:**
```json
{
  "id": 10,
  "sessionId": 42,
  "reviewerName": "John Learner",
  "rating": 4,
  "comment": "Great session, learned a lot!",
  "timestamp": "2026-04-05T12:00:00"
}
```

---

### 5.5 Mentor Applications — `/api/mentor`

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| POST | `/api/mentor/apply` | ✅ Any User | Submit mentor application |

**MentorApplicationDTO:**
```json
{
  "certificateUrl": "https://drive.google.com/file/...",
  "proposedBio": "I am a React expert with 5 years experience...",
  "proposedSkills": ["React", "JavaScript", "CSS"]
}
```

---

### 5.6 Admin Panel — `/api/admin` (ADMIN role only)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/admin/users?page=0&size=10` | Paginated user list |
| GET | `/api/admin/activities?page=0&size=20` | System activity log |
| GET | `/api/admin/sessions?page=0&size=10` | All sessions (paginated) |
| POST | `/api/admin/sessions/{id}/cancel?reason=xxx` | Force-cancel a session |
| GET | `/api/admin/sessions/{id}/chat` | View all chat messages for a session |
| GET | `/api/admin/requests/pending` | All pending mentor applications |
| POST | `/api/admin/requests/{id}/approve?adminNotes=xxx` | Approve mentor application |
| POST | `/api/admin/requests/{id}/reject?adminNotes=xxx` | Reject mentor application |
| POST | `/api/admin/sessions/{id}/resolve?faultIsMentor=true&adminNotes=xxx` | Resolve dispute |

**Pagination Query Params:**
```
?page=0&size=10&sort=createdAt,desc
```

**Page Response Wrapper:**
```json
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 10,
  "size": 10,
  "number": 0
}
```

---

## 6. Authentication Flow (JWT)

### Token Storage
Store tokens in memory or `sessionStorage` (never `localStorage` for security-sensitive tokens).

```typescript
// Recommended: Zustand store in memory
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: { email: string; role: string; credits: number } | null;
}
```

### Axios Interceptor Pattern

```typescript
// src/api/axiosInstance.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:8443',
  // For dev with self-signed cert, use a proxy in vite.config.ts
});

// Request Interceptor: Attach JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const res = await api.post('/auth/refresh', { refreshToken });
        useAuthStore.getState().setAccessToken(res.data.accessToken);
        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Vite Dev Proxy (bypass self-signed SSL)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: true,  // Enable HTTPS on Vite (matches CORS config)
    proxy: {
      '/auth': {
        target: 'https://localhost:8443',
        secure: false, // Accept self-signed cert
        changeOrigin: true,
      },
      '/api': {
        target: 'https://localhost:8443',
        secure: false,
        changeOrigin: true,
      },
      '/ws-chat': {
        target: 'wss://localhost:8443',
        ws: true,
        secure: false,
        changeOrigin: true,
      },
    },
  },
});
```

### Login Flow Diagram
```
User submits email + password
        ↓
POST /auth/login
        ↓
Response: { accessToken (15min), refreshToken (24h), role, credits }
        ↓
Store in Zustand + sessionStorage
        ↓
Redirect based on role:
  - USER   → /dashboard
  - MENTOR → /mentor/dashboard
  - ADMIN  → /admin
```

---

## 7. WebSocket Real-Time Chat

The backend uses **STOMP over SockJS**. Chat is session-scoped.

### Install dependencies
```bash
npm install @stomp/stompjs sockjs-client
npm install --save-dev @types/sockjs-client
```

### Chat Hook

```typescript
// src/hooks/useSessionChat.ts
import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface ChatMessage {
  id?: number;
  sessionId: number;
  senderEmail: string;
  content: string;
  timestamp?: string;
}

export function useSessionChat(sessionId: number, userEmail: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS('https://localhost:8443/ws-chat'),
      onConnect: () => {
        // Subscribe to session-specific topic
        stompClient.subscribe(`/topic/session/${sessionId}`, (message) => {
          const received: ChatMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, received]);
        });
      },
      onDisconnect: () => console.log('Chat disconnected'),
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
    };
  }, [sessionId]);

  const sendMessage = (content: string) => {
    if (clientRef.current?.connected) {
      const chatMsg: ChatMessage = { sessionId, senderEmail: userEmail, content };
      clientRef.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(chatMsg),
      });
    }
  };

  return { messages, sendMessage };
}
```

### STOMP endpoints summary

| Direction | Endpoint | Notes |
|-----------|----------|-------|
| Client → Server | `/app/chat.sendMessage` | Send a message |
| Server → Client | `/topic/session/{sessionId}` | Subscribe to receive messages |

---

## 8. Frontend Project Structure

```
skillSwap/frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── axiosInstance.ts      ← Interceptors, base URL
│   │   ├── auth.api.ts           ← login, signup, refresh, forgotPassword
│   │   ├── user.api.ts           ← profile, search, stats, transactions
│   │   ├── session.api.ts        ← book, accept, complete, cancel, dispute
│   │   ├── mentor.api.ts         ← apply, get availability
│   │   ├── review.api.ts         ← submit review
│   │   └── admin.api.ts          ← admin panel calls
│   │
│   ├── store/
│   │   ├── authStore.ts          ← Zustand: tokens, user info, role
│   │   └── sessionStore.ts       ← Zustand: active session state
│   │
│   ├── hooks/
│   │   ├── useSessionChat.ts     ← STOMP WebSocket chat hook
│   │   ├── useAuth.ts            ← Auth helpers
│   │   └── usePagination.ts      ← Paginated queries
│   │
│   ├── components/
│   │   ├── ui/                   ← shadcn/ui base components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── ResetPasswordForm.tsx
│   │   ├── mentor/
│   │   │   ├── MentorCard.tsx
│   │   │   ├── MentorProfile.tsx
│   │   │   ├── AvailabilityPicker.tsx
│   │   │   └── MentorApplication.tsx
│   │   ├── session/
│   │   │   ├── SessionCard.tsx
│   │   │   ├── BookingModal.tsx
│   │   │   ├── SessionStatusBadge.tsx
│   │   │   └── ChatRoom.tsx
│   │   ├── review/
│   │   │   └── ReviewForm.tsx
│   │   └── admin/
│   │       ├── UserTable.tsx
│   │       ├── SessionTable.tsx
│   │       ├── MentorRequestCard.tsx
│   │       └── ActivityLog.tsx
│   │
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── ExploreMentors.tsx
│   │   ├── MentorProfile.tsx
│   │   ├── Dashboard.tsx          ← USER dashboard
│   │   ├── MentorDashboard.tsx    ← MENTOR dashboard
│   │   ├── SessionRoom.tsx        ← Active session + chat
│   │   ├── Profile.tsx
│   │   ├── Leaderboard.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminUsers.tsx
│   │       ├── AdminSessions.tsx
│   │       ├── AdminMentorRequests.tsx
│   │       └── AdminActivityLog.tsx
│   │
│   ├── router/
│   │   ├── AppRouter.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── session.types.ts
│   │   └── admin.types.ts
│   │
│   ├── utils/
│   │   ├── creditFormat.ts
│   │   ├── dateFormat.ts
│   │   └── statusColor.ts        ← Map SessionStatus → badge color
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env
├── vite.config.ts
└── package.json
```

---

## 9. State Management Strategy

### Zustand Auth Store

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  email: string;
  role: 'USER' | 'MENTOR' | 'ADMIN';
  credits: number;
}

interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ refreshToken: state.refreshToken, user: state.user }),
      // Only persist the refresh token (access token stays in memory)
    }
  )
);
```

### React Query for Server State

```typescript
// Example: Mentor Search
const { data: mentors } = useQuery({
  queryKey: ['mentors', skill, minRating],
  queryFn: () => api.get(`/api/users/search?skill=${skill}&minRating=${minRating}`),
  staleTime: 5 * 60 * 1000,  // 5 minutes
});

// Example: Dashboard
const { data: dashboard } = useQuery({
  queryKey: ['dashboard'],
  queryFn: () => api.get('/api/sessions/dashboard'),
  refetchInterval: 30_000,  // Poll every 30 seconds
});
```

---

## 10. Component Architecture Map

### Role-Based Routing

```typescript
// src/router/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  allowedRoles: ('USER' | 'MENTOR' | 'ADMIN')[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: Props) {
  const { user, accessToken } = useAuthStore();

  if (!accessToken || !user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
```

### App Router Structure

```typescript
// src/router/AppRouter.tsx
<Routes>
  {/* Public */}
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
  <Route path="/mentors" element={<ExploreMentors />} />
  <Route path="/mentors/:id" element={<MentorProfile />} />
  <Route path="/leaderboard" element={<Leaderboard />} />

  {/* USER */}
  <Route path="/dashboard" element={
    <ProtectedRoute allowedRoles={['USER', 'MENTOR']}>
      <Dashboard />
    </ProtectedRoute>
  } />
  <Route path="/sessions/:id/room" element={
    <ProtectedRoute allowedRoles={['USER', 'MENTOR']}>
      <SessionRoom />
    </ProtectedRoute>
  } />
  <Route path="/profile" element={
    <ProtectedRoute allowedRoles={['USER', 'MENTOR']}>
      <Profile />
    </ProtectedRoute>
  } />
  <Route path="/mentor/apply" element={
    <ProtectedRoute allowedRoles={['USER']}>
      <MentorApplication />
    </ProtectedRoute>
  } />

  {/* MENTOR only */}
  <Route path="/mentor/dashboard" element={
    <ProtectedRoute allowedRoles={['MENTOR']}>
      <MentorDashboard />
    </ProtectedRoute>
  } />

  {/* ADMIN only */}
  <Route path="/admin" element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminDashboard />
    </ProtectedRoute>
  } />
  <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
  <Route path="/admin/sessions" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSessions /></ProtectedRoute>} />
  <Route path="/admin/mentor-requests" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminMentorRequests /></ProtectedRoute>} />
  <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminActivityLog /></ProtectedRoute>} />
</Routes>
```

---

## 11. Step-by-Step Setup

### Step 1: Create the Vite + React project
```bash
cd C:\Users\Mani\OneDrive\Desktop\skillSwap\frontend
npx create-vite@latest . -- --template react-ts
npm install
```

### Step 2: Install all dependencies
```bash
# Routing
npm install react-router-dom

# HTTP
npm install axios

# State Management
npm install zustand

# Server State
npm install @tanstack/react-query

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# WebSocket / STOMP
npm install @stomp/stompjs sockjs-client
npm install --save-dev @types/sockjs-client

# UI Components
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-toast
npm install lucide-react

# Date utilities
npm install date-fns

# shadcn/ui (optional, run CLI)
npx shadcn-ui@latest init
```

### Step 3: Configure `.env`
```env
VITE_API_BASE_URL=https://localhost:8443
VITE_WS_URL=https://localhost:8443/ws-chat
```

### Step 4: Configure Vite proxy (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    https: {
      // Use any self-signed cert or generate one with mkcert
      // OR just set to true for a simple self-signed
    },
    proxy: {
      '/auth': { target: 'https://localhost:8443', secure: false, changeOrigin: true },
      '/api': { target: 'https://localhost:8443', secure: false, changeOrigin: true },
      '/ws-chat': { target: 'wss://localhost:8443', ws: true, secure: false, changeOrigin: true },
    },
  },
});
```

### Step 5: Start the frontend
```bash
npm run dev
```

Visit: `https://localhost:5173`

---

## 12. Key Integration Patterns

### 12.1 Session Booking Flow
```
1. GET /api/users/all-profiles          → Show mentor cards
2. GET /api/users/{id}/availability      → Show available time slots
3. POST /api/sessions/request/{slotId}   
   ?skillName=React&durationHours=2     → Book session
4. Learner sees "PENDING" in dashboard
5. Mentor hits: POST /api/sessions/{id}/accept → Status → ACCEPTED
   (Jitsi link now stored, learner gets email)
6. Both hit: POST /api/sessions/{id}/complete   → Mutual confirmation
   (Payout released when both confirm)
7. Learner hits: POST /api/sessions/{id}/review → Submit rating
```

### 12.2 Dispute Flow
```
Session stuck in ACCEPTED state?
1. POST /api/sessions/{id}/dispute → Status → DISPUTED
2. Admin is emailed automatically
3. Admin reviews chat history at: GET /api/admin/sessions/{id}/chat
4. Admin resolves: POST /api/admin/sessions/{id}/resolve
   ?faultIsMentor=true   → Learner refunded
   ?faultIsMentor=false  → Mentor paid
```

### 12.3 Mentor Application Flow
```
1. USER clicks "Become a Mentor"
2. POST /api/mentor/apply → { certificateUrl, proposedBio, proposedSkills }
3. Admin sees it at GET /api/admin/requests/pending
4. Admin approves: POST /api/admin/requests/{id}/approve?adminNotes=xxx
   → User role changes to MENTOR
   → User bio + skills are set from the application
5. Next login, role = "MENTOR", user sees Mentor Dashboard
```

### 12.4 Password Reset Flow
```
1. User enters email → POST /auth/forgot-password
2. Redis stores OTP for 10 minutes
3. Gmail SMTP sends 6-digit OTP email
4. User enters OTP + new password → POST /auth/reset-password
5. OTP is burned from Redis immediately after use
```

### 12.5 Session Status Badge Colors
```typescript
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING:           'bg-yellow-100 text-yellow-800',
    ACCEPTED:          'bg-blue-100 text-blue-800',
    MENTOR_COMPLETED:  'bg-purple-100 text-purple-800',
    LEARNER_COMPLETED: 'bg-purple-100 text-purple-800',
    COMPLETED:         'bg-green-100 text-green-800',
    CANCELLED:         'bg-gray-100 text-gray-800',
    REJECTED:          'bg-red-100 text-red-800',
    DISPUTED:          'bg-orange-100 text-orange-800',
    REFUNDED:          'bg-teal-100 text-teal-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}
```

---

## 13. Environment Variables

```env
# .env (Vite — all vars must start with VITE_)
VITE_API_BASE_URL=https://localhost:8443
VITE_WS_URL=https://localhost:8443/ws-chat
VITE_JITSI_DOMAIN=meet.jit.si
```

---

## Summary: Pages vs APIs

| Page | APIs Called | Role Required |
|------|------------|---------------|
| Landing | None | Public |
| Login | `POST /auth/login` | Public |
| Signup | `POST /auth/signup` | Public |
| Forgot Password | `POST /auth/forgot-password`, `POST /auth/reset-password` | Public |
| Explore Mentors | `GET /api/users/all-profiles`, `GET /api/users/search` | Public |
| Mentor Profile | `GET /api/users/{id}/profile`, `GET /api/users/{id}/availability` | Public |
| Leaderboard | `GET /api/users/leaderboard` | Public |
| User Dashboard | `GET /api/sessions/dashboard`, `GET /api/users/stats` | USER |
| Book Session | `POST /api/sessions/request/{slotId}` | USER |
| Session Room | WebSocket `/topic/session/{id}`, `POST /api/sessions/{id}/complete` | USER/MENTOR |
| Review | `POST /api/sessions/{id}/review` | USER |
| Profile | `GET /auth/profile`, `PUT /api/users/profile` | USER/MENTOR |
| My Transactions | `GET /api/users/transactions` | USER |
| Become Mentor | `POST /api/mentor/apply` | USER |
| Mentor Dashboard | `GET /api/sessions/pending-requests` | MENTOR |
| Set Availability | `POST /api/users/availability` | MENTOR |
| Admin Dashboard | `GET /api/admin/users`, `GET /api/admin/sessions` | ADMIN |
| Admin Requests | `GET /api/admin/requests/pending`, approve/reject | ADMIN |
| Admin Chat View | `GET /api/admin/sessions/{id}/chat` | ADMIN |
| Admin Resolve | `POST /api/admin/sessions/{id}/resolve` | ADMIN |

---

*Generated from full backend source code analysis — SkillSwap Spring Boot 3.2.5*
