# PRD: Comprehensive Claude Code Monitor Dashboard

## Version: 1.0
## Date: 2025-01-11

---

## Executive Summary

Build a comprehensive real-time monitoring dashboard for Claude Code multi-agent swarm systems. The dashboard provides complete observability into agent states, task execution, system performance, and operational metrics with zero human intervention required.

---

## Product Goals

### Primary Objectives
1. **Complete Observability**: Monitor every aspect of Claude Code multi-agent operations
2. **Real-Time Updates**: Sub-second updates via SSE/WebSocket with fallback polling
3. **Actionable Insights**: Alert on anomalies, predict failures, optimize performance
4. **Zero Config**: Auto-discover agents, tasks, swarms from SQLite databases

### Success Metrics
- Latency: < 100ms for real-time updates
- Coverage: 100% of database tables visualized
- Reliability: 99.9% uptime, graceful degradation
- Usability: Single-click deployment, no manual config

---

## User Personas

| Persona | Role | Goals | Pain Points |
|---------|------|-------|-------------|
| **DevOps Engineer** | System Monitoring | Detect issues early, capacity planning | Too many tools, fragmented data |
| **ML Engineer** | Model Optimization | Track token usage, cost optimization | No visibility into per-agent metrics |
| **Developer** | Debugging | Understand task failures, agent behavior | Logs scattered, no timeline view |
| **Manager** | Resource Planning | Team productivity, cost analysis | Manual reporting, delayed insights |

---

## Functional Requirements

### 1. Agent Monitoring (Priority: P0)
- **Agent List**: All agents with status (idle, busy, active, offline, pending, running)
- **Agent Details**: Type, role, capabilities, performance score, task count, success rate
- **Performance Timeline**: Historical performance trends per agent
- **Resource Usage**: CPU, memory, token consumption (if available)
- **Agent Topology**: Visual representation of agent relationships

### 2. Task Tracking (Priority: P0)
- **Task Queue**: Kanban board (pending, in_progress, completed, failed)
- **Task Details**: ID, name, description, priority, complexity, time estimates
- **Execution Timeline**: Started at, completed at, duration breakdown
- **Task History**: Searchable task history with filters
- **Failure Analysis**: Error messages, stack traces, retry patterns

### 3. Swarm Orchestration (Priority: P0)
- **Swarm List**: All swarms with status (active, stopped, initializing)
- **Swarm Details**: Objective, topology (mesh, hierarchical, ring, star), max agents
- **Agent Assignment**: Which agents belong to which swarm
- **Communication Flow**: Inter-agent message visualization

### 4. Communication Monitoring (Priority: P1)
- **Message Feed**: Real-time inter-agent communication stream
- **Message Types**: Coordination, result, error, status
- **Filtering**: By agent, type, time range, content search
- **Communication Graph**: Network diagram of message flow

### 5. Performance Metrics (Priority: P0)
- **Agent Performance**: Metric name, value, unit, timestamp
- **Trends**: Time-series charts for all metrics
- **Filtering**: By agent, metric name, time range
- **Aggregations**: Min, max, avg, percentiles

### 6. Pattern Discovery (Priority: P1)
- **Pattern List**: Discovered patterns with confidence scores
- **Pattern Types**: Categorized by pattern type
- **Usage Metrics**: Usage count, last used timestamp
- **Confidence Trends**: Pattern quality over time

### 7. Task Trajectories (Priority: P1)
- **Execution Paths**: Step-by-step task execution history
- **Judge Labels**: Success/failure classification with confidence
- **Trajectory Comparison**: Compare similar tasks
- **Learning Insights**: Patterns from successful/failed executions

### 8. Query Tracking (Priority: P1)
- **Active Queries**: Currently running queries with progress
- **Query History**: Past queries with duration and status
- **Performance**: Query latency, success rate
- **Debugging**: Query parameters, results, errors

### 9. System Status (Priority: P0)
- **Health Dashboard**: Database health, API status, connection status
- **Resource Metrics**: CPU, memory, disk, network
- **Alert Status**: Active alerts, alert history
- **Uptime Metrics**: Availability, response times

### 10. Alerting System (Priority: P0)
- **Real-Time Alerts**: Live alert feed with severity levels
- **Alert Channels**: Log, Slack, webhook (configurable)
- **Alert Rules**: Threshold-based, anomaly detection
- **Alert History**: Past alerts with resolution status

### 11. Configuration (Priority: P2)
- **Polling Settings**: Configurable refresh intervals
- **Alert Configuration**: Threshold settings, channel config
- **Display Preferences**: Theme, density, chart types
- **Data Retention**: Configurable retention policies

### 12. Memory & Learning (Priority: P1)
- **Memory Namespaces**: Breakdown by namespace (episodic, semantic, skills)
- **Memory Entries**: Searchable memory store
- **Learning Metrics**: Pattern discovery rate, confidence trends

---

## Non-Functional Requirements

### Performance
- Page load: < 2 seconds
- Real-time update latency: < 100ms
- Chart rendering: < 500ms for 1000 data points
- Database queries: < 50ms for indexed queries

### Scalability
- Support 1000+ concurrent agents
- Handle 10,000+ tasks/hour
- Store 30+ days of historical data

### Reliability
- Graceful degradation when databases unavailable
- Auto-reconnection with exponential backoff
- Circuit breakers for failing services

### Security
- Read-only database access (no writes)
- No sensitive data in logs
- CORS configuration for API routes

---

## Technical Architecture

### Database Sources
| Database | Path | Tables |
|----------|------|--------|
| Hive DB | `.hive-mind/hive.db` | swarms, agents, tasks, messages, performance_metrics |
| Memory DB | `.swarm/memory.db` | patterns, task_trajectories, memory_entries |

### Technology Stack
- **Frontend**: Next.js 15, React 19, Mantine UI, ApexCharts
- **Backend**: Next.js API Routes (server-side)
- **Database**: better-sqlite3 (read-only)
- **Real-Time**: Server-Sent Events (SSE) with polling fallback
- **Deployment**: Vercel/Docker, optional HTTP wrapper

### Page Structure
```
/                           - Dashboard overview (home)
/agents                     - Agent monitoring with kanban
/metrics                    - Performance metrics & charts
/swarms                     - Swarm management
/tasks                      - Task tracking
/messages                   - Communication feed (NEW)
/patterns                   - Pattern discovery (NEW)
/trajectories               - Task trajectories (NEW)
/performance-metrics        - Agent performance (NEW)
/queries                    - Query tracking
/status                     - System health
/settings                   - Configuration
/alerts                     - Alert management (NEW)
```

---

## Open Questions

1. **Authentication**: Should we add user authentication? (Currently: open access)
2. **Multi-Tenancy**: Support multiple swarms/environments? (Currently: single)
3. **Data Retention**: Auto-purge old data? (Currently: keeps all)
4. **Export**: CSV/JSON export functionality? (Currently: not implemented)
5. **Mobile**: Responsive design priority? (Currently: desktop-first)

---

## Dependencies

### External Services
- Claude Code CLI (running swarm)
- MCP servers (claude-flow, ruv-swarm)
- SQLite databases (auto-populated by MCP)

### Integration Points
- HTTP wrapper on port 8900 (optional)
- SSE stream endpoint for real-time updates
- REST API for all data queries

---

## Success Criteria

### Minimum Viable Product (MVP)
- [x] All 4 database tables have pages
- [x] Real-time updates working
- [x] Basic alerting functional
- [ ] Mobile responsive
- [ ] Export functionality
- [ ] Documentation complete

### Stretch Goals
- [ ] Predictive failure detection
- [ ] Automated alert tuning
- [ ] Multi-swarm comparison
- [ ] Cost optimization recommendations
- [ ] A/B testing for agent selection

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Discovery** | 1 hour | Architecture review, gap analysis |
| **Infrastructure** | 2 hours | Database integration, API routes |
| **Core Features** | 4 hours | Agent/task/swarm monitoring |
| **Advanced Features** | 3 hours | Patterns, trajectories, alerts |
| **Polish** | 2 hours | UI refinement, performance |
| **Testing** | 2 hours | E2E tests, load tests |
| **Documentation** | 1 hour | README, deployment guide |

**Total Estimated**: 15 hours of development time

---

## Appendix

### Existing Features (Implemented)
- ✅ Agents page with kanban board
- ✅ Metrics page with charts
- ✅ Swarms page with topology
- ✅ Queries page with tracking
- ✅ Status page with health
- ✅ Settings page with alert config
- ✅ Messages page (recently added)
- ✅ Patterns page (recently added)
- ✅ Trajectories page (recently added)
- ✅ Performance Metrics page (recently added)
- ✅ Real-time alerts feed (recently added)
- ✅ Connection status indicators (recently added)
- ✅ Agent performance timeline (recently added)
- ✅ Task duration distribution (recently added)
- ✅ Swarm communication diagram (recently added)
- ✅ Token usage trends (recently added)

### Gaps Identified
- ⬜ Home page needs comprehensive overview
- ⬜ Mobile responsiveness not fully implemented
- ⬜ Export functionality missing
- ⬜ Predictive analytics not implemented
- ⬜ Cost optimization recommendations missing
- ⬜ Multi-swarm comparison not available
- ⬜ Documentation incomplete
