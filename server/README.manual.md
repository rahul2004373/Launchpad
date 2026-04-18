# AWS Manual Deployment Guide (No Docker)

Since you prefer a manual setup, this guide details the exact steps to transform a clean AWS Ubuntu VM into a production environment for your backend.

---

## 1. Server Prerequisites
You must install the runtime and tools directly on your AWS VM.

### A. Install Node.js 20
Run these commands in your AWS terminal:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### B. Install Global Tools
You will need **PM2** to keep your server running in the background.
```bash
sudo npm install -g pm2
```

---

## 2. Deployment Steps

### A. Clone and Install
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo/server
npm install
```

### B. Configure Environment
Create your `.env` file manually. This is where your Postgres and Redis URLs go.
```bash
nano .env
```
*Paste your .env contents and save.*

### C. Database Synchronization
Generate the Prisma client so your code can talk to Neon:
```bash
npx prisma generate
```

---

## 3. Starting the Backend

We will use **PM2** to run both the API and the Worker. PM2 will automatically restart them if they crash.

### Start the API Server:
```bash
pm2 start index.js --name "backend-api"
```

### Start the Worker:
```bash
pm2 start worker-standalone.js --name "backend-worker"
```

### Check Status:
```bash
pm2 list
pm2 logs
```

---

## 4. Port Management (Important)
Your server runs on port **8080** by default. To access it on the standard web port (80) without Docker, run this command on your VM:
```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
```

---

## Why this is different from Docker?
- **Manual Maintenance**: You are responsible for upgrading Node.js and managing global npm packages.
- **Port Mapping**: You must use `iptables` or a firewall to map port 80 to 8080 manually.
- **Worker Environment**: Your worker will now run on the host's direct Docker daemon. Since Docker is installed on the host, it will work fine as long as your VM has enough permissions.
