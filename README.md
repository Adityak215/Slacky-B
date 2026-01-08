## 🧠 Ticketing Backend System (Slack-Inspired)

A backend service that mimics a ticket-based collaboration workflow similar to systems used in tools like Slack, Linear, or Jira.

Built with **Node.js, Express, and PostgreSQL**, focusing on **correctness, security, and real-world backend tradeoffs** rather than just CRUD APIs.

---

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based stateless authentication
- Role-based access control (RBAC) scoped to workspaces
- Authorization enforced via reusable middleware
- Proper HTTP semantics (`401`, `403`, `409`, etc.)

### 🗂️ Workspaces & Projects

- Users can belong to multiple workspaces
- Projects scoped to workspaces
- Permissions evaluated per workspace, not globally

### 🎟️ Ticket System

- Create, assign, update, and soft-delete tickets
- Denormalized current ticket status for fast reads
- Append-only ticket status history for auditability
- Business-rule enforced state transitions (`open → in_progress → resolved → closed`)

### 🔁 Concurrency Safety

- Explicit database transactions
- Row-level locking (`SELECT … FOR UPDATE`) for status transitions and deletes
- Guarantees consistency under concurrent requests
- Clear tradeoff: **pessimistic locking for correctness over throughput**

### 📜 Audit Logging

- Append-only audit logs for destructive or significant actions
- Clear separation between:
    - **State history** (ticket lifecycle)
    - **Audit logs** (user actions)

### 📄 Pagination & Filtering

- Cursor-based pagination using indexed timestamps
- Efficient filtering by status and assignee
- Partial indexes for active (non-deleted) tickets

### 🛡️ Security Hardening

- Parameterized SQL queries (SQL injection safe)
- Input validation using schema-based validation
- Rate limiting (global + stricter auth limits)
- Secure HTTP headers via Helmet
- Controlled CORS configuration

---

## 🏗️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Auth:** JWT (jsonwebtoken)
- **Security:** bcrypt, express-rate-limit, helmet
- **Validation:** Zod
- **SQL:** Raw SQL (no ORM)

---

## 🧩 Architecture Overview

```
Client
  ↓
Express App
  ├─ Validation Middleware
  ├─ Rate Limiting
  ├─ Auth Middleware (JWT)
  ├─Authorization Middleware (RBAC)
  ├─ Controllers
  │    ├─ Transactions
  │    ├─Row-level locks
  │    └─ Business rules
  ↓
PostgreSQL

```

Key design principles:

- Explicit transactions
- Clear separation of concerns
- Database as source of truth for authorization
- Application-level enforcement of business rules

---

## ⚖️ Design Tradeoffs

### Pessimistic Locking

Chosen to prioritize **correctness and consistency** in ticket state transitions.

- Lower write throughput
- Strong guarantees under concurrency

### Denormalized Status

- Faster reads
- Requires transactional consistency with history table
- Chosen intentionally for real-world performance patterns

### No ORM

- Full control over queries
- Clear understanding of execution plans and indexes
- Better learning outcome for database internals

---

## 🚀 What I’d Improve Next

- Move audit logging to async workers
- Add optimistic locking for low-contention paths
- Introduce read replicas for scaling reads
- Add comment APIs & notifications
- Dockerize and deploy with horizontal scaling

---

## 📚 What I Learned

- Designing APIs beyond CRUD
- Handling concurrency correctly
- Cursor-based pagination at scale
- Real-world authorization pitfalls
- Tradeoffs between consistency and throughput
