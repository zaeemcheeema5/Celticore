# CeltiCore Architecture & Interaction Flowcharts

This document describes the high-level system architecture and interaction flowcharts for the CeltiCore E-Commerce platform.

---

## 1. High-Level System Architecture

The diagram below details the client-to-server data flows across pages, API client modules, Express middleware layers, controllers, and SQLite database storage.

```mermaid
graph TD
    %% Styling
    classDef client fill:#10b981,stroke:#0f766e,stroke-width:2px,color:#000;
    classDef server fill:#1e1b4b,stroke:#4338ca,stroke-width:2px,color:#fff;
    classDef db fill:#065f46,stroke:#047857,stroke-width:2px,color:#fff;
    classDef external fill:#701a75,stroke:#86198f,stroke-width:2px,color:#fff;

    %% Nodes
    subgraph Client ["Client Side (React / Vite Frontend)"]
        UI["React Pages & Components<br/>(Category, Product, Admin Dashboard)"]:::client
        API["Axios API Clients<br/>(products.ts, settings.ts, orders.ts)"]:::client
    end

    subgraph Server ["Server Side (Node.js / Express Backend)"]
        RT["Express Router Modules<br/>(authRoutes, settingsRoutes, etc.)"]:::server
        MW["Middleware Chain<br/>(adminAuthMiddleware, bodyParsers)"]:::server
        CTL["Domain Controllers<br/>(authController, settingsController)"]:::server
    end

    subgraph Storage ["Persistence Layer"]
        DB[("SQLite Database<br/>(nutrova.db)")]:::db
    end

    subgraph External ["External Integration"]
        Stripe["Stripe Checkout API<br/>(Payment Intents & Webhooks)"]:::external
    end

    %% Flows
    UI -->|Triggers Action| API
    API -->|HTTP Requests| RT
    RT -->|Verifies Token| MW
    MW -->|Passes Clean Request| CTL
    CTL -->|Queries / Writes| DB
    CTL -->|Creates Session| Stripe
    Stripe -->|Triggers Payment webhook| RT
```

---

## 2. Customer Purchase & Stripe Webhook Flow

This flowchart illustrates the sequence of actions starting from user checkout, creating a session, redirected payment, and backend database updating via Stripe webhooks.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Frontend)
    participant Backend as Express Backend
    participant Stripe as Stripe API
    participant DB as SQLite Database

    Customer->>Backend: POST /api/orders (Submit Order details)
    activate Backend
    Backend->>DB: INSERT INTO orders (Status: pending)
    Backend-->>Customer: Order Created (ID: #123)
    deactivate Backend

    Customer->>Backend: POST /api/payment/create-checkout-session (Request Session)
    activate Backend
    Backend->>Stripe: stripe.checkout.sessions.create()
    Stripe-->>Backend: Returns Session URL & Client Secret
    Backend-->>Customer: Return Checkout URL
    deactivate Backend

    Customer->>Stripe: Complete payment on Stripe checkout form
    activate Stripe
    Stripe-->>Customer: Render Success Page
    Stripe->>Backend: POST /api/webhook (Stripe Webhook: checkout.session.completed)
    deactivate Stripe

    activate Backend
    Backend->>DB: UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = #123
    Backend-->>Stripe: Respond 200 OK
    deactivate Backend
```

---

## 3. Administrative Privilege & Deletion Restrictions

This flowchart visualizes the strict permission logic applied to user accounts and secondary administrator profiles.

```mermaid
flowchart TD
    %% Styling
    classDef main fill:#b91c1c,stroke:#991b1b,stroke-width:2px,color:#fff;
    classDef sec fill:#1d4ed8,stroke:#1e40af,stroke-width:2px,color:#fff;
    classDef rule fill:#0f172a,stroke:#334155,stroke-width:2px,color:#fff;
    classDef outcome fill:#15803d,stroke:#166534,stroke-width:2px,color:#fff;
    classDef reject fill:#7f1d1d,stroke:#991b1b,stroke-width:2px,color:#fff;

    %% Nodes
    AdminType{"Requester Identity"}:::rule
    MainAdmin["Master Administrator<br/>(role: 'main_admin')"]:::main
    SecAdmin["Secondary Administrator<br/>(role: 'admin')"]:::sec

    DeleteAction{"Target Account to Delete?"}:::rule
    DeleteSecCheck{"Target Account to Delete?"}:::rule

    AllowDelete["Allow Deletion<br/>(DELETE FROM users)"]:::outcome
    RejectDelete["Reject Deletion<br/>(403 Forbidden Response)"]:::reject

    %% Connections
    AdminType -->|Logs In| MainAdmin
    AdminType -->|Logs In| SecAdmin

    MainAdmin -->|Requests Deletion| DeleteAction
    DeleteAction -->|Target is Secondary Admin| AllowDelete
    DeleteAction -->|Target is Customer| AllowDelete
    DeleteAction -->|Target is Master Admin| RejectDelete

    SecAdmin -->|Requests Deletion| DeleteSecCheck
    DeleteSecCheck -->|Target is Customer| AllowDelete
    DeleteSecCheck -->|Target is Secondary Admin| RejectDelete
    DeleteSecCheck -->|Target is Master Admin| RejectDelete
```
