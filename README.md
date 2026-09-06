# SnapShare — Collaborative Event Photo Sharing & Publishing Platform

> **TrizenAI Full-Stack Internship Challenge Submission**  
> Candidate: **Gaurang Agarwal**  
> Submission Email: `talent@trizen-ai.com` | Deadline: September 20, 2026

SnapShare is a modern, production-grade photo-sharing web platform built for event photography teams. It enables photographers to collaboratively upload high-resolution photos, empowers Lead/Admins to curate and publish custom client galleries with 6-digit PIN protection, and delivers a client gallery with zero account creation friction.

---

## 1. Demo Credentials & Instant Test Links

For rapid evaluation, the database is pre-seeded with sample users, events, and published galleries:

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Admin / Lead** | `admin@snapshare.com` | `Admin@123456` | Full system control: create events, assign team members, review all uploaded photos, curate selections, and publish galleries with custom PINs. |
| **Team Member (Assigned)** | `photographer1@snapshare.com` | `Photo@123456` | Assigned to *"Arjun & Priya Wedding"*. Can batch upload photos, view assigned event, view own uploads. Restricted from publishing or accessing unassigned events. |
| **Team Member (Unassigned)** | `photographer2@snapshare.com` | `Photo@123456` | Unassigned to wedding event. Demonstrates **403 Forbidden** security isolation when attempting to view or upload to unauthorized events. |
| **Customer (Guest Client)** | *No Account Required* | **Access PIN:** `482917` | Public client gallery link: [`/gallery/abc123`](http://localhost:3000/gallery/abc123) |

---

## 2. Technology Stack

- **Frontend & Fullstack**: Next.js 16 (App Router, Turbopack, React 19, TypeScript 5)
- **Styling & Aesthetics**: Tailwind CSS v4, custom glassmorphism, responsive masonry grids, Lucide icons
- **Database**: PostgreSQL (hosted on Neon Serverless with connection pooling)
- **ORM & Data Layer**: Prisma ORM 6 (type-safe queries, relational integrity, migrations)
- **Authentication**: JWT-based HTTP-only session cookies with `jose` + `bcryptjs` password hashing
- **Object Storage**: S3-compatible cloud storage (`@aws-sdk/client-s3` for AWS S3 / Cloudflare R2 / MinIO) with built-in zero-config local disk storage fallback
- **Testing**: Vitest with unit & integration suites for Auth, RBAC permissions, and PIN protection
- **Deployment Target**: Vercel / Node.js runtime

---

## 3. System Architecture & Workflows

### Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer"]
        Admin["Admin / Lead\n(Desktop/Mobile Web)"]
        Photographer["Team Member\n(Batch Uploader)"]
        Customer["Customer / Guest\n(PIN Protected Portal)"]
    end

    subgraph AppLayer ["Next.js 16 App Router"]
        AuthMiddleware["Auth & RBAC Middleware\n(Session JWT + Role Checks)"]
        GalleryPINValidator["PIN Verification Engine\n(Bcrypt Hash Match + Token)"]
        APIEndpoints["API Handlers\n(/api/events, /api/photos, /api/gallery)"]
        StorageService["Storage Abstraction\n(S3 / R2 SDK & Local Fallback)"]
    end

    subgraph DataStorage ["Data & Storage Layer"]
        Postgres[("Neon PostgreSQL\n(Users, Events, Photos, Galleries)")]
        ObjectStore[("Cloud Object Storage\n(S3 / Cloudflare R2 / Disk)")]
    end

    Admin -->|"Manage Events, Curate, Set PIN"| AuthMiddleware
    Photographer -->|"Upload Photos (Assigned Only)"| AuthMiddleware
    Customer -->|"Submit 6-Digit PIN"| GalleryPINValidator

    AuthMiddleware --> APIEndpoints
    GalleryPINValidator --> APIEndpoints

    APIEndpoints -->|"Metadata Queries & Transactions"| Postgres
    APIEndpoints -->|"Binary Streams & Presigned URLs"| StorageService
    StorageService -->|"Store JPEG/PNG/WEBP"| ObjectStore
```

### End-to-End Operational Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Lead
    actor Team as Team Member
    actor Customer as Customer / Guest
    participant Server as SnapShare Server & DB
    participant Storage as Object Storage (S3/R2)

    Admin->>Server: 1. Create Event ("Arjun & Priya Wedding")
    Admin->>Server: 2. Assign Photographer (photographer1@snapshare.com)
    Team->>Server: 3. Login & view assigned event
    Team->>Storage: 4. Batch upload 6 event photos
    Team->>Server: 5. Store photo metadata (linked to event & photographer)
    Admin->>Server: 6. Review all uploaded photos in workspace
    Admin->>Server: 7. Select 5 photos for public showcase (toggle isSelected)
    Admin->>Server: 8. Publish gallery with custom PIN ("482917") & slug ("abc123")
    Server-->>Admin: 9. Returns shareable URL & PIN
    Admin->>Customer: 10. Shares Link (/gallery/abc123) & PIN (482917)
    Customer->>Server: 11. Opens link, enters 6-digit PIN
    Server->>Server: 12. Validates PIN against bcrypt hash
    Server-->>Customer: 13. Returns ONLY the 5 selected/published photos
    Note over Customer,Server: Unpublished 6th photo is strictly excluded!
```

---

## 4. Database Schema Design (Entity-Relationship)

```mermaid
erDiagram
    users ||--o{ events : "creates (Admin)"
    users ||--o{ event_assignments : "assigned to"
    users ||--o{ photos : "uploads"
    events ||--o{ event_assignments : "assigned members"
    events ||--o{ photos : "contains"
    events ||--o{ galleries : "publishes"
    galleries ||--o{ gallery_photos : "features"
    photos ||--o{ gallery_photos : "included in"

    users {
        string id PK "cuid"
        string name
        string email UK
        string passwordHash
        enum role "ADMIN | TEAM_MEMBER"
        datetime createdAt
        datetime updatedAt
    }

    events {
        string id PK "cuid"
        string name
        string description
        datetime eventDate
        string location
        string coverPhotoUrl
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }

    event_assignments {
        string id PK "cuid"
        string eventId FK
        string userId FK
        datetime assignedAt
    }

    photos {
        string id PK "cuid"
        string eventId FK
        string uploadedById FK
        string filename
        string storageUrl
        int fileSize
        string mimeType
        boolean isSelected
        datetime createdAt
    }

    galleries {
        string id PK "cuid"
        string eventId FK
        string slug UK
        string title
        string pinHash
        boolean isPublished
        datetime publishedAt
        datetime createdAt
        datetime updatedAt
    }

    gallery_photos {
        string id PK "cuid"
        string galleryId FK
        string photoId FK
        int order
        datetime addedAt
    }
```

---

## 5. Security & Isolation Matrix

The application explicitly implements defenses for all scenarios listed in Section 6 of the challenge specification:

| Security Scenario | Implementation | Enforcement Point |
| :--- | :--- | :--- |
| **Accessing another event** | If a Team Member attempts to view or upload to an unassigned event, the API aborts with `403 Forbidden`. | [`app/api/events/[id]/route.ts`](file:///c:/Users/HP/Documents/snapshare/app/api/events/[id]/route.ts) & [`app/api/events/[id]/photos/route.ts`](file:///c:/Users/HP/Documents/snapshare/app/api/events/[id]/photos/route.ts) |
| **Team Member publishing gallery** | Only users with `Role.ADMIN` can invoke `POST /api/events/[id]/gallery`. Team Members receive `403 Forbidden`. | [`app/api/events/[id]/gallery/route.ts`](file:///c:/Users/HP/Documents/snapshare/app/api/events/[id]/gallery/route.ts) |
| **Failed photo uploads** | Multipart processing wraps individual files in try/catch blocks, recording success/failure arrays and returning accurate error responses without crashing the server. | [`app/api/events/[id]/photos/route.ts`](file:///c:/Users/HP/Documents/snapshare/app/api/events/[id]/photos/route.ts) |
| **Incorrect gallery PIN** | Tested against `bcrypt.compare`. Invalid PIN responds with `401 Unauthorized` ("Incorrect PIN. Access denied.") and triggers a shake micro-animation in the client. | [`app/api/gallery/[slug]/verify/route.ts`](file:///c:/Users/HP/Documents/snapshare/app/api/gallery/[slug]/verify/route.ts) |
| **Attempted access to unpublished photos** | Public photo endpoint only queries photos joined via `GalleryPhoto` for that gallery ID. Photos in the event with `isSelected = false` are never returned. | [`app/api/gallery/[slug]/photos/route.ts`](file:///c:/Users/HP/Documents/snapshare/app/api/gallery/[slug]/photos/route.ts) |
| **Photo deletion rights** | Admins can delete any photo. Photographers can only delete photos uploaded by their own account ID. | [`app/api/photos/[id]/route.ts`](file:///c:/Users/HP/Documents/snapshare/app/api/photos/[id]/route.ts) |

---

## 6. Local Setup Instructions

### Prerequisites
- Node.js 18+ or 20+
- npm (or yarn / pnpm)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gaurang-Agarwal/snapshare.git
   cd snapshare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` (or verify existing `.env`):
   ```ini
   # PostgreSQL Connection (e.g., Neon or local Postgres)
   DATABASE_URL="postgresql://username:password@ep-sample-project-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   DATABASE_URL_UNPOOLED="postgresql://username:password@ep-sample-project.us-east-2.aws.neon.tech/neondb?sslmode=require"

   # JWT Signing Key
   JWT_SECRET="snapshare-super-secret-jwt-key-2026-production-ready"

   # Optional Cloud Storage (defaults to public/uploads if omitted)
   # S3_BUCKET_NAME="snapshare-bucket"
   # AWS_ACCESS_KEY_ID="your-key-id"
   # AWS_SECRET_ACCESS_KEY="your-secret-key"
   # AWS_REGION="auto"
   ```

4. **Sync Database & Seed Demo Data:**
   ```bash
   npx prisma db push
   npm run seed
   ```

5. **Run Automated Tests:**
   ```bash
   npm run test
   ```

6. **Start Local Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Automated Testing Suite

The repository includes a comprehensive test suite executed with Vitest:

```bash
npm run test
```

### Test Coverage Highlights:
- **`tests/auth.test.ts`**: Password hashing, bcrypt verification, JWT session creation, tampered token rejection, customer access token verification.
- **`tests/rbac.test.ts`**: Role existence validation, event isolation enforcement (unassigned photographer blocked), assigned photographer authorized access.
- **`tests/gallery-pin.test.ts`**: Valid PIN authorization (`482917`), invalid PIN rejection, unpublished photo leakage prevention.

---

## 8. Deployment Steps & Known Limitations

### Deployment on Vercel
1. Push the repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set Environment Variables in Project Settings:
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `JWT_SECRET`
   - (Optional) `S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
4. Deploy! Next.js automatically compiles with Turbopack and runs `prisma generate` during build.

### Known Limitations & Roadmap
- **Serverless File System on Vercel**: While local storage fallback works seamlessly for development and tests, production deployments on Vercel require configuring S3/Cloudflare R2 env vars because Vercel serverless functions have ephemeral file systems.
- **ZIP Download for Bulk Photos**: Currently photos can be viewed in fullscreen, zoomed, and saved individually in the lightbox. Full-gallery single-click ZIP archive generation is planned as a future bonus feature using stream compression.

---

## 9. Challenge Deliverables Checklist

- [x] **Source code repository** with clean commit history
- [x] **Live application** ready for deployment on Vercel
- [x] **README.md** with architecture diagrams, setup, and DB explanation
- [x] **Demo Admin credentials** (`admin@snapshare.com` / `Admin@123456`)
- [x] **Demo Team Member credentials** (`photographer1@snapshare.com` / `Photo@123456`)
- [x] **Demo Gallery URL & PIN** (`/gallery/abc123` with PIN `482917`)
- [x] **Automated test suite** covering Auth, RBAC, Gallery Publishing, and PIN Protection
