# Launchpad Backend ⚙️

The core engine responsible for orchestrating source code extraction, build processes, and S3 deployments. It separates the API layer from the heavy construction work via a high-performance worker system.

![Architecture Diagram](./public/architecture_diagram.png)

## 🏗️ System Components

### 1. API Server (`/server`)
- Handles authentication and project management.
- Exposes RESTful endpoints for the dashboard.
- Schedules build jobs into a priority queue.

### 2. Deployment Worker
- Consumes jobs from Redis via **BullMQ**.
- Clerically handles cloning, building (Vite), and Zipping.
- Efficiently uploads static assets to cloud storage (S3/Cloudflare R2).

## 🛠️ Tech Stack

- **Runtime**: Node.js 20 (ES Modules)
- **API Framework**: Express.js
- **ORM**: Prisma (PostgreSQL / Neon)
- **Queue System**: BullMQ + Redis
- **Storage**: AWS SDK (S3 Compatible)
- **Logging**: Winston + Morgan

## 🚀 Setting Up

### Prerequisites
- Node.js 20+
- PostgreSQL instance (e.g., [Neon](https://neon.tech))
- Redis instance (e.g., [Upstash](https://upstash.com))
- S3 Compatible Bucket (AWS S3 or Cloudflare R2)

### Installation
1. Navigate to the directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize Database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Run the services:
   - **API Server**: `npm start`
   - **Worker**: `npm run worker`

## 📦 Deployment Guide

For detailed instructions on deploying this backend to **AWS EC2**, please refer to:
- **[Manual Deployment Guide](./README.manual.md)**

---

Built for Scalability.
