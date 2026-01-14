# API Documentation

This document describes the REST API endpoints available in the Claude Code Monitoring Dashboard.

## Base URL

```
http://localhost:8800/api
```

## Authentication

Currently, the API does not require authentication. For production deployments, consider implementing API keys or OAuth.

## Response Format

All API responses follow this structure:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string; // ISO 8601 format
}
```

## Endpoints

### Health & Status

#### Check Database Health

```http
GET /api/sqlite/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "healthy": true,
    "swarmDb": true,
    "hiveDb": true,
    "tables": {
      "swarmDb": ["swarms", "agents", "tasks", "messages", "performance_metrics"],
      "hiveDb": ["patterns", "task_trajectories", "memory_entries"]
    }
  },
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

#### System Status

```http
GET /api/status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "uptime": 3600,
    "memory": {
      "used": 128,
      "total": 512
    },
    "databases": {
      "healthy": true
    }
  },
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Agents

#### Get Agent Statistics

```http
GET /api/sqlite/agents
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "agentId": "agent-001",
      "agentName": "Orchestrator",
      "agentType": "orchestrator",
      "totalTasks": 42,
      "completedTasks": 38,
      "failedTasks": 4,
      "successRate": 90.5,
      "avgDuration": 2500,
      "lastActive": "2025-01-11T11:55:00.000Z"
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

#### Get Agent State

```http
GET /api/agents/state
```

**Response:**

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent-001",
        "name": "Orchestrator",
        "status": "active",
        "lastHeartbeat": "2025-01-11T11:59:00.000Z"
      }
    ]
  },
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Tasks

#### Get Task Status

```http
GET /api/sqlite/tasks?status=in_progress&limit=50
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | `null` | Filter by status: `pending`, `in_progress`, `completed`, `failed` |
| limit | number | `100` | Maximum number of tasks to return |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "taskId": "task-123",
      "description": "Process user request",
      "status": "in_progress",
      "priority": "high",
      "assignedAgent": "agent-001",
      "createdAt": "2025-01-11T11:50:00.000Z",
      "completedAt": null,
      "duration": null
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Swarms

#### Get Swarm Information

```http
GET /api/sqlite/coordination
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "swarmId": "swarm-001",
      "objective": "Process user queries",
      "topology": "hierarchical",
      "maxAgents": 10,
      "status": "active"
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Messages

#### Get Recent Messages

```http
GET /api/sqlite/messages?limit=100
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | `100` | Maximum number of messages to return |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "msg-001",
      "fromAgentId": "agent-001",
      "toAgentId": "agent-002",
      "messageType": "coordination",
      "content": "Starting task execution",
      "timestamp": "2025-01-11T11:59:30.000Z"
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Metrics

#### Get Performance Metrics

```http
GET /api/sqlite/metrics
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "metricId": "metric-001",
      "agentId": "agent-001",
      "metricName": "response_time",
      "value": 250,
      "unit": "ms",
      "timestamp": "2025-01-11T11:59:00.000Z"
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

#### Get Performance Metrics by Agent

```http
GET /api/sqlite/performance-metrics
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "agentId": "agent-001",
      "avgDuration": 2500,
      "totalTasks": 42,
      "successRate": 90.5
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Patterns

#### Get Discovered Patterns

```http
GET /api/sqlite/patterns
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "patternId": "pattern-001",
      "patternType": "task_failure",
      "description": "Tasks failing after 30 seconds",
      "confidence": 0.85,
      "usageCount": 12,
      "lastUsedAt": "2025-01-11T11:55:00.000Z"
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Memory

#### Get Memory Entries

```http
GET /api/sqlite/memory
```

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 1234,
      "byNamespace": {
        "episodic": 450,
        "semantic": 600,
        "skills": 184
      }
    },
    "entries": [...]
  },
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Trajectories

#### Get Task Trajectories

```http
GET /api/sqlite/trajectories
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "trajectoryId": "traj-001",
      "taskId": "task-123",
      "steps": ["step1", "step2", "step3"],
      "outcome": "success",
      "judgeLabel": "positive",
      "confidence": 0.92
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Alerts

#### Get Alerts

```http
GET /api/alerts
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| severity | string | `null` | Filter by severity: `critical`, `error`, `warning`, `info` |
| status | string | `null` | Filter by status: `active`, `acknowledged`, `resolved` |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "alert-001",
      "severity": "warning",
      "message": "High task failure rate detected",
      "source": "agent-001",
      "status": "active",
      "createdAt": "2025-01-11T11:50:00.000Z"
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Queries

#### Get Query Tracking

```http
GET /api/queries
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "queryId": "query-001",
      "query": "SELECT * FROM agents",
      "duration": 15,
      "status": "completed",
      "timestamp": "2025-01-11T11:59:00.000Z"
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Circuit Breaker

#### Get Circuit Breaker Status

```http
GET /api/circuit-breaker
```

**Response:**

```json
{
  "success": true,
  "data": {
    "circuits": [
      {
        "name": "sqlite-db",
        "state": "closed",
        "failureCount": 0,
        "lastFailureTime": null
      }
    ]
  },
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

Common HTTP status codes:

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

Currently, there is no rate limiting. For production deployments, consider implementing rate limiting based on:

- IP address
- API key
- Endpoint-specific limits

## CORS

The API supports Cross-Origin Resource Sharing (CORS). Configure allowed origins in your deployment settings.

## WebSocket/SSE

For real-time updates, the dashboard uses Server-Sent Events (SSE). Contact endpoint information is available in the client-side hooks.

See `hooks/useRealTimeUpdates.ts` for implementation details.
