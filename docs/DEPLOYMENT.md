# Deployment Guide

This guide covers deploying the Claude Code Monitoring Dashboard to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Vercel Deployment](#vercel-deployment)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Post-Deployment](#post-deployment)

## Prerequisites

Before deploying, ensure you have:

1. SQLite databases from MCP servers (claude-flow, ruv-swarm)
2. Database files accessible to the deployment environment
3. Environment variables configured

## Environment Configuration

### Required Environment Variables

Create a `.env` file or configure these in your deployment platform:

```bash
# Database Configuration (REQUIRED)
SWARM_DB_PATH=/absolute/path/to/.hive-mind/hive.db
HIVE_DB_PATH=/absolute/path/to/.swarm/memory.db

# Server Configuration
PORT=8800
NODE_ENV=production

# Real-Time Updates
POLLING_INTERVAL_MS=5000
REALTIME_ENABLED=true
```

### Database Setup

The dashboard requires two SQLite databases:

```bash
# Example directory structure
/data/
├── .hive-mind/
│   └── hive.db          # Swarms, agents, tasks, messages, metrics
└── .swarm/
    └── memory.db        # Patterns, trajectories, memory entries
```

> **Note**: The MCP servers (claude-flow, ruv-swarm) create and populate these databases automatically.

## Vercel Deployment

Vercel is the recommended deployment platform for Next.js applications.

### Step 1: Prepare for Vercel

Since Vercel uses a serverless environment, you'll need to use a database proxy or external storage:

1. **Option A**: Use the MCP HTTP wrapper (`mcp-server/http-wrapper.ts`)
2. **Option B**: Host databases on a persistent file system (Vercel Blob, AWS S3)
3. **Option C**: Use an external SQLite hosting service

### Step 2: Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 3: Configure Environment Variables

In the Vercel dashboard, add your environment variables:

1. Go to Project Settings → Environment Variables
2. Add each variable from the [Environment Configuration](#environment-configuration) section
3. Redeploy to apply changes

### Vercel Build Output

```
★  Production: https://your-app.vercel.app
★  Deployment completed in 45s
```

## Docker Deployment

### Dockerfile

The project includes a Dockerfile for containerized deployment.

### Build and Run

```bash
# Build the image
docker build -t claude-monitor-dashboard .

# Run the container
docker run -d \
  --name claude-monitor \
  -p 8800:8800 \
  -e SWARM_DB_PATH=/data/.hive-mind/hive.db \
  -e HIVE_DB_PATH=/data/.swarm/memory.db \
  -v $(pwd)/data:/data:ro \
  claude-monitor-dashboard
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  dashboard:
    build: .
    ports:
      - "8800:8800"
    environment:
      - SWARM_DB_PATH=/data/.hive-mind/hive.db
      - HIVE_DB_PATH=/data/.swarm/memory.db
      - NODE_ENV=production
    volumes:
      - ./data:/data:ro
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

## Manual Deployment

### Build the Application

```bash
npm run build
```

This creates a `.next` directory with optimized production files.

### Start the Production Server

```bash
npm start
```

The server will start on the configured port (default: 8800).

### Using PM2 (Process Manager)

```bash
# Install PM2
npm i -g pm2

# Start the application
pm2 start npm --name "claude-monitor" -- start

# Configure PM2 to start on system boot
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

Configure Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name monitor.example.com;

    location / {
        proxy_pass http://localhost:8800;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Post-Deployment

### Health Check

Verify the deployment is working:

```bash
curl http://your-domain.com/api/sqlite/health
```

Expected response:

```json
{
  "healthy": true,
  "hiveDb": "/path/to/.hive-mind/hive.db",
  "memoryDb": "/path/to/.swarm/memory.db"
}
```

### Monitor Performance

- Check the Status page at `/status` for system health
- Review logs for any errors
- Monitor database connection health

### Database Updates

The MCP servers continuously update the SQLite databases. The dashboard reads these changes in real-time:

- **SSE (Server-Sent Events)**: Primary method for real-time updates
- **Polling fallback**: 5-second interval if SSE is unavailable

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common deployment issues.

## Security Considerations

1. **Read-Only Access**: The dashboard only reads from databases (no writes)
2. **No Secrets**: Ensure no sensitive data in logs
3. **CORS**: Configure CORS if accessing from different domains
4. **Rate Limiting**: Consider rate limiting for public deployments

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/claude-code-monitoring-dashboard/issues)
- Documentation: [docs/](./)
