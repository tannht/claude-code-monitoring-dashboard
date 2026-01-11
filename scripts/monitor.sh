#!/usr/bin/env bash
#
# Claude Code Monitoring Dashboard - Monitor Wrapper Script
# Autonomous execution with status updates and auto-resume
#
# Usage:
#   ./scripts/monitor.sh              # Start with defaults
#   ./scripts/monitor.sh --interval 10  # Custom status interval (seconds)
#   ./scripts/monitor.sh --verbose     # Verbose output
#   ./scripts/monitor.sh --help        # Show help
#

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Default configuration
STATUS_INTERVAL=${STATUS_INTERVAL:-5}
VERBOSE=${VERBOSE:-false}
DAEMON=${DAEMON:-false}
LOG_FILE=".claude-monitor/logs/monitor.log"
PID_FILE=".claude-monitor/monitor.pid"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --interval|-i)
      STATUS_INTERVAL="$2"
      shift 2
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --daemon|-d)
      DAEMON=true
      shift
      ;;
    --help|-h)
      echo "Claude Code Monitoring Dashboard - Monitor Wrapper Script"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --interval, -i SECONDS  Status update interval (default: 5)"
      echo "  --verbose, -v           Enable verbose output"
      echo "  --daemon, -d            Run as daemon (background)"
      echo "  --help, -h              Show this help message"
      echo ""
      echo "Environment Variables:"
      echo "  STATUS_INTERVAL         Status update interval in seconds"
      echo "  VERBOSE                 Enable verbose output (true/false)"
      echo "  DAEMON                  Run as daemon (true/false)"
      echo ""
      echo "Examples:"
      echo "  $0                      # Start with defaults"
      echo "  $0 --interval 10        # Update status every 10 seconds"
      echo "  $0 --daemon             # Run in background"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Logging functions
log_info() {
  local msg="[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*"
  echo -e "${BLUE}$msg${NC}"
  mkdir -p "$(dirname "$LOG_FILE")"
  echo "$msg" >> "$LOG_FILE"
}

log_success() {
  local msg="[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $*"
  echo -e "${GREEN}$msg${NC}"
  mkdir -p "$(dirname "$LOG_FILE")"
  echo "$msg" >> "$LOG_FILE"
}

log_warn() {
  local msg="[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $*"
  echo -e "${YELLOW}$msg${NC}"
  mkdir -p "$(dirname "$LOG_FILE")"
  echo "$msg" >> "$LOG_FILE"
}

log_error() {
  local msg="[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*"
  echo -e "${RED}$msg${NC}"
  mkdir -p "$(dirname "$LOG_FILE")"
  echo "$msg" >> "$LOG_FILE"
}

log_debug() {
  if [[ "$VERBOSE" == "true" ]]; then
    local msg="[$(date +'%Y-%m-%d %H:%M:%S')] DEBUG: $*"
    echo -e "${PURPLE}$msg${NC}"
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "$msg" >> "$LOG_FILE"
  fi
}

# Prerequisite checks
check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    log_info "Please install Node.js from https://nodejs.org/"
    exit 1
  fi
  log_debug "Node.js version: $(node --version)"

  # Check npm
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
  fi
  log_debug "npm version: $(npm --version)"

  # Check if we're in the right directory
  if [[ ! -f "package.json" ]]; then
    log_error "Not in a valid project directory (package.json not found)"
    exit 1
  fi

  log_success "Prerequisites check passed"
}

# Initialize monitor directory
init_monitor_dir() {
  log_info "Initializing monitor directory..."

  mkdir -p .claude-monitor/{state,logs,config}

  # Create default config if not exists
  if [[ ! -f .claude-monitor/config/monitoring.yaml ]]; then
    cat > .claude-monitor/config/monitoring.yaml << 'EOF'
# Claude Code Monitoring Configuration

status:
  interval: 5  # seconds
  file: .claude-monitor/STATUS.txt

agent_tracking:
  heartbeat_interval: 60  # seconds
  stale_timeout: 300  # seconds (5 minutes)

circuit_breaker:
  failure_threshold: 5
  cooldown_seconds: 300
  half_open_attempts: 3

alerts:
  enabled: true
  global_cooldown: 60
  channels:
    slack:
      enabled: false
      webhook_url: ""
    webhook:
      enabled: false
      url: ""
    log:
      enabled: true
      path: .claude-monitor/logs/alerts.log
EOF
    log_debug "Created default monitoring config"
  fi

  log_success "Monitor directory initialized"
}

# Start the development server
start_dev_server() {
  log_info "Starting development server..."

  # Check if already running
  if [[ -f "$PID_FILE" ]]; then
    local pid=$(cat "$PID_FILE")
    if ps -p "$pid" &> /dev/null; then
      log_warn "Dev server already running (PID: $pid)"
      return 0
    else
      log_debug "Removing stale PID file"
      rm -f "$PID_FILE"
    fi
  fi

  # Start server in background
  if [[ "$DAEMON" == "true" ]]; then
    nohup npm run dev > .claude-monitor/logs/dev-server.log 2>&1 &
    echo $! > "$PID_FILE"
    log_success "Dev server started in background (PID: $!)"
  else
    npm run dev > .claude-monitor/logs/dev-server.log 2>&1 &
    echo $! > "$PID_FILE"
    log_success "Dev server started (PID: $!)"
  fi

  # Wait for server to be ready
  log_info "Waiting for server to be ready..."
  local max_wait=30
  local waited=0
  while [[ $waited -lt $max_wait ]]; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
      log_success "Server is ready at http://localhost:3000"
      return 0
    fi
    sleep 1
    ((waited++))
  done

  log_warn "Server may not be fully ready yet"
}

# Stop the dev server
stop_dev_server() {
  log_info "Stopping dev server..."

  if [[ -f "$PID_FILE" ]]; then
    local pid=$(cat "$PID_FILE")
    if ps -p "$pid" &> /dev/null; then
      kill "$pid"
      rm -f "$PID_FILE"
      log_success "Dev server stopped"
    else
      log_debug "Server not running (stale PID file)"
      rm -f "$PID_FILE"
    fi
  else
    log_warn "No PID file found"
  fi
}

# Update status file
update_status() {
  curl -s http://localhost:3000/api/status > /dev/null 2>&1
}

# Monitor loop
monitor_loop() {
  log_info "Starting monitor loop (interval: ${STATUS_INTERVAL}s)"
  log_info "Press Ctrl+C to stop"

  local counter=0

  while true; do
    ((counter++))
    log_debug "Status update #$counter"

    if update_status; then
      log_debug "Status updated"
    else
      log_warn "Failed to update status"
    fi

    sleep "$STATUS_INTERVAL"
  done
}

# Cleanup on exit
cleanup() {
  log_info "Shutting down..."
  stop_dev_server
  log_success "Monitor stopped"
  exit 0
}

# Main execution
main() {
  echo -e "${CYAN}"
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║         Claude Code Monitoring Dashboard - Monitor            ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"

  check_prerequisites
  init_monitor_dir
  start_dev_server

  # Set up signal handlers
  trap cleanup SIGINT SIGTERM

  # Start monitoring
  monitor_loop
}

# Run main
main "$@"
