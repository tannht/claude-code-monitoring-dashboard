#!/usr/bin/env bash
#
# Status File Watcher
# Monitors the STATUS.txt file and displays changes
#
# Usage:
#   ./scripts/status-watcher.sh            # Watch default status file
#   ./scripts/status-watcher.sh --file PATH  # Watch custom file
#   ./scripts/status-watcher.sh --tail    # Show last 10 lines
#

set -euo pipefail

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Default status file
STATUS_FILE=".claude-monitor/STATUS.txt"
TAIL_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --file|-f)
      STATUS_FILE="$2"
      shift 2
      ;;
    --tail|-t)
      TAIL_ONLY=true
      shift
      ;;
    --help|-h)
      echo "Status File Watcher"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --file, -f PATH    Status file to watch (default: .claude-monitor/STATUS.txt)"
      echo "  --tail, -t         Show last 10 lines and exit"
      echo "  --help, -h         Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Print colored status
print_status() {
  local line="$1"

  # Colorize based on content
  if [[ "$line" =~ *Status:.*MONITORING* ]]; then
    echo -e "${GREEN}$line${NC}"
  elif [[ "$line" =~ *Status:.*ALERT* ]]; then
    echo -e "${RED}$line${NC}"
  elif [[ "$line" =~ *Status:.*IDLE* ]]; then
    echo -e "${YELLOW}$line${NC}"
  elif [[ "$line" =~ *Circuit Breaker:.*OPEN* ]]; then
    echo -e "${RED}$line${NC}"
  elif [[ "$line" =~ *Circuit Breaker:.*CLOSED* ]]; then
    echo -e "${GREEN}$line${NC}"
  elif [[ "$line" =~ *Active:.*0* ]]; then
    echo -e "${CYAN}$line${NC}"
  else
    echo "$line"
  fi
}

# Tail mode
if [[ "$TAIL_ONLY" == "true" ]]; then
  if [[ -f "$STATUS_FILE" ]]; then
    echo -e "${CYAN}═══ Status File (last 10 lines) ═══${NC}"
    tail -10 "$STATUS_FILE" | while IFS= read -r line; do
      print_status "$line"
    done
  else
    echo -e "${YELLOW}Status file not found: $STATUS_FILE${NC}"
  fi
  exit 0
fi

# Watch mode
echo -e "${CYAN}═══ Watching Status File ═══${NC}"
echo -e "File: ${BLUE}$STATUS_FILE${NC}"
echo -e "Press Ctrl+C to stop"
echo ""

if [[ ! -f "$STATUS_FILE" ]]; then
  echo -e "${YELLOW}Waiting for status file to be created...${NC}"
fi

# Watch for changes using tail -f
tail -f "$STATUS_FILE" 2>/dev/null | while IFS= read -r line; do
  print_status "$line"
done
