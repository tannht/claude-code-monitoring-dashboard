# Troubleshooting Guide

This guide helps you resolve common issues with the Claude Code Monitoring Dashboard.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Connection Issues](#database-connection-issues)
- [Performance Issues](#performance-issues)
- [Display Issues](#display-issues)
- [Data Issues](#data-issues)
- [Deployment Issues](#deployment-issues)
- [Getting Help](#getting-help)

## Installation Issues

### npm install Fails

**Problem**: `npm install` command fails with errors.

**Solutions**:

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   npm install
   ```

2. **Delete node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use Node.js 18 or higher**:
   ```bash
   node --version  # Should be 18+ or 20+
   ```

4. **Install dependencies individually**:
   ```bash
   npm install better-sqlite3 --build-from-source
   npm install
   ```

### Build Fails

**Problem**: `npm run build` fails with errors.

**Solutions**:

1. **Check TypeScript errors**:
   ```bash
   npm run type-check
   ```

2. **Fix ESLint errors**:
   ```bash
   npm run lint
   ```

3. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

4. **Check environment variables**:
   ```bash
   # Ensure .env file exists with required variables
   cat .env
   ```

## Database Connection Issues

### "Database Connection Error" Message

**Problem**: Dashboard shows "Database Connection Error" on page load.

**Solutions**:

1. **Check database paths in .env**:
   ```bash
   # Use absolute paths, not relative
   SWARM_DB_PATH=/Users/username/.hive-mind/hive.db
   HIVE_DB_PATH=/Users/username/.swarm/memory.db
   ```

2. **Verify database files exist**:
   ```bash
   ls -la $SWARM_DB_PATH
   ls -la $HIVE_DB_PATH
   ```

3. **Check file permissions**:
   ```bash
   # Ensure read permissions on database files
   chmod +r ~/.hive-mind/hive.db
   chmod +r ~/.swarm/memory.db
   ```

4. **Test database manually**:
   ```bash
   sqlite3 ~/.hive-mind/hive.db "SELECT COUNT(*) FROM agents;"
   ```

### "No Data Found" on Pages

**Problem**: Pages load but show "No agents found" or similar messages.

**Solutions**:

1. **Verify MCP servers are running**:
   ```bash
   # Check if claude-flow MCP server is running
   ps aux | grep claude-flow
   ```

2. **Check database has data**:
   ```bash
   sqlite3 ~/.hive-mind/hive.db "SELECT * FROM agents LIMIT 5;"
   ```

3. **Restart MCP servers** to populate databases:
   - Run a Claude Code session with agent tasks
   - Databases populate as agents work

4. **Check database schema**:
   ```bash
   sqlite3 ~/.hive-mind/hive.db ".schema"
   ```

## Performance Issues

### Slow Page Load Times

**Problem**: Pages take more than 5 seconds to load.

**Solutions**:

1. **Check database size**:
   ```bash
   ls -lh ~/.hive-mind/hive.db
   ls -lh ~/.swarm/memory.db
   ```

2. **Enable database indexing** (if applicable):
   ```bash
   sqlite3 ~/.hive-mind/hive.db "CREATE INDEX IF NOT EXISTS idx_agents_last_active ON agents(last_active);"
   ```

3. **Reduce polling interval**:
   ```bash
   # In .env
   POLLING_INTERVAL_MS=10000  # Increase from 5000
   ```

4. **Disable real-time updates**:
   ```bash
   # In .env
   REALTIME_ENABLED=false
   ```

### High Memory Usage

**Problem**: Dashboard uses excessive memory.

**Solutions**:

1. **Reduce data fetch size**:
   - Edit component code to limit records fetched
   - Add `LIMIT` clauses to queries

2. **Clear browser cache**:
   - Chrome: DevTools → Application → Clear storage
   - Firefox: Settings → Privacy & Security → Clear Data

3. **Restart the server**:
   ```bash
   # Stop and restart
   npm start
   ```

## Display Issues

### Charts Not Rendering

**Problem**: Charts show as blank or don't load.

**Solutions**:

1. **Check browser console for errors**:
   - Open DevTools (F12)
   - Check Console tab for JavaScript errors

2. **Verify ApexCharts is loading**:
   - Check Network tab in DevTools
   - Look for ApexCharts script

3. **Clear browser cache and reload**:
   ```bash
   # Hard refresh
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

4. **Disable browser extensions**:
   - Ad blockers may interfere with chart rendering

### Mobile Layout Issues

**Problem**: Layout broken on mobile devices.

**Solutions**:

1. **Clear mobile browser cache**
2. **Check viewport meta tag** is present
3. **Test in different mobile browsers** (Chrome Mobile, Safari Mobile)
4. **Report issue** with device and browser information

## Data Issues

### Stale Data Showing

**Problem**: Dashboard shows old data that doesn't update.

**Solutions**:

1. **Check real-time connection**:
   - Look for SSE connection in browser DevTools Network tab
   - Check if polling fallback is working

2. **Manually refresh**:
   - Click the Refresh button on pages
   - Or press `R` keyboard shortcut

3. **Check database update timestamps**:
   ```bash
   sqlite3 ~/.hive-mind/hive.db "SELECT MAX(updated_at) FROM agents;"
   ```

4. **Restart the development server**:
   ```bash
   # Stop and restart
   npm run dev
   ```

### Incorrect Data Displayed

**Problem**: Data shown doesn't match actual agent/swarm state.

**Solutions**:

1. **Verify database integrity**:
   ```bash
   sqlite3 ~/.hive-mind/hive.db "PRAGMA integrity_check;"
   ```

2. **Check for multiple database instances**:
   ```bash
   # Ensure you're reading from the correct database
   echo $SWARM_DB_PATH
   echo $HIVE_DB_PATH
   ```

3. **Recreate databases**:
   ```bash
   # Backup and recreate
   mv ~/.hive-mind/hive.db ~/.hive-mind/hive.db.backup
   # Restart MCP servers to recreate
   ```

## Deployment Issues

### Vercel Deployment Fails

**Problem**: Build fails on Vercel.

**Solutions**:

1. **Check build logs** in Vercel dashboard
2. **Verify environment variables** are set in Vercel project settings
3. **Ensure database paths** are accessible to serverless functions
4. **Consider using MCP HTTP wrapper** for database access

### Docker Container Won't Start

**Problem**: Docker container exits immediately.

**Solutions**:

1. **Check container logs**:
   ```bash
   docker logs claude-monitor
   ```

2. **Verify volume mounts**:
   ```bash
   docker inspect claude-monitor | grep Mounts
   ```

3. **Test locally first**:
   ```bash
   docker run -it --rm claude-monitor-dashboard /bin/sh
   ```

4. **Check database file paths** in container:
   ```bash
   # Paths must match container filesystem
   docker exec claude-monitor ls -la /data
   ```

## Error Messages

### "Cannot read property of undefined"

**Cause**: Data structure mismatch or missing data.

**Solution**:
1. Check browser console for full error details
2. Verify database schema matches expected structure
3. Report bug with error details

### "Failed to fetch"

**Cause**: Network or server issue.

**Solution**:
1. Check if development server is running
2. Verify API endpoints are accessible
3. Check CORS settings if accessing from different domain

### "Circuit breaker open"

**Cause**: Too many failed requests to a service.

**Solution**:
1. Wait for circuit breaker to reset (default: 60 seconds)
2. Check underlying service (database, API)
3. Adjust circuit breaker thresholds if needed

## Getting Help

### Diagnostic Information

When reporting issues, collect:

1. **System Information**:
   ```bash
   node --version
   npm --version
   uname -a  # Linux/Mac
   systeminfo  # Windows
   ```

2. **Dashboard Version**:
   ```bash
   git log -1 --oneline
   ```

3. **Browser Information**:
   - Browser name and version
   - Operating system
   - Screen resolution

4. **Error Details**:
   - Full error message
   - Browser console output
   - Server logs

5. **Database Status**:
   ```bash
   sqlite3 ~/.hive-mind/hive.db ".tables"
   sqlite3 ~/.swarm/memory.db ".tables"
   ```

### Log Files

Check these locations for logs:

- **Server logs**: Terminal output when running `npm run dev` or `npm start`
- **Browser console**: DevTools (F12) → Console tab
- **Network logs**: DevTools → Network tab

### Resources

- **GitHub Issues**: [Report bugs](https://github.com/yourusername/claude-code-monitoring-dashboard/issues)
- **Documentation**: [docs/](./)
- **API Reference**: [API.md](API.md)

## Common Debugging Commands

```bash
# Check if ports are in use
lsof -i :8800  # Mac/Linux
netstat -ano | findstr :8800  # Windows

# Test database connection
sqlite3 ~/.hive-mind/hive.db "SELECT 1;"

# Check environment variables
env | grep -E "(SWARM_DB|HIVE_DB|PORT)"

# Restart with clean build
rm -rf .next node_modules
npm install
npm run dev
```

## Prevention Tips

1. **Use absolute paths** for database locations
2. **Regular backups** of database files
3. **Monitor disk space** - databases grow over time
4. **Keep dependencies updated** with `npm update`
5. **Test changes** in development before deploying to production
6. **Monitor server logs** for early warning signs
