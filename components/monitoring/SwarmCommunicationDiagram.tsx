/**
 * SwarmCommunicationDiagram Component
 * Visualizes communication patterns between agents in a swarm
 */

"use client";

import { useMemo, useRef, useEffect } from "react";
import { useMessages, useAgentStats, useRecentMessages } from "@/hooks/useSqliteData";

export interface SwarmCommunicationDiagramProps {
  swarmId?: string;
  hours?: number;
  minMessages?: number;
}

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  messageCount: number;
}

interface Link {
  source: string;
  target: string;
  count: number;
  messageTypes: Record<string, number>;
}

export function SwarmCommunicationDiagram({
  swarmId,
  hours = 24,
  minMessages = 1,
}: SwarmCommunicationDiagramProps) {
  const { data: messages } = useRecentMessages(200);
  const { data: agents } = useAgentStats();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter messages by time
  const timeFilteredMessages = useMemo(() => {
    const cutoff = Date.now() - hours * 3600000;
    return messages.filter((m) => new Date(m.timestamp).getTime() > cutoff);
  }, [messages, hours]);

  // Build nodes and links
  const { nodes, links } = useMemo(() => {
    const agentIds = new Set<string>();
    const linkMap = new Map<string, Link>();
    const messageCountMap = new Map<string, number>();

    // Count messages and build links
    timeFilteredMessages.forEach((msg) => {
      agentIds.add(msg.fromAgentId);
      if (msg.toAgentId) agentIds.add(msg.toAgentId);

      // Count messages per agent
      messageCountMap.set(
        msg.fromAgentId,
        (messageCountMap.get(msg.fromAgentId) || 0) + 1
      );

      if (msg.toAgentId) {
        const linkKey = `${msg.fromAgentId}->${msg.toAgentId}`;
        if (!linkMap.has(linkKey)) {
          linkMap.set(linkKey, {
            source: msg.fromAgentId,
            target: msg.toAgentId,
            count: 0,
            messageTypes: {},
          });
        }
        const link = linkMap.get(linkKey)!;
        link.count++;
        link.messageTypes[msg.messageType] = (link.messageTypes[msg.messageType] || 0) + 1;
      }
    });

    // Create nodes with positions (circular layout)
    const nodeList: Node[] = Array.from(agentIds).map((id, index) => {
      const agent = agents?.find((a) => a.agentId === id);
      const angle = (index / agentIds.size) * 2 * Math.PI;
      const radius = Math.min(150, 300 / agentIds.size);
      return {
        id,
        name: agent?.agentName || id,
        x: Math.cos(angle) * radius + 200, // Center at 200, 200
        y: Math.sin(angle) * radius + 200,
        messageCount: messageCountMap.get(id) || 0,
      };
    });

    // Filter links by min messages
    const linkList = Array.from(linkMap.values())
      .filter((l) => l.count >= minMessages)
      .sort((a, b) => b.count - a.count);

    return { nodes: nodeList, links: linkList };
  }, [timeFilteredMessages, agents, minMessages]);

  // Draw diagram
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links
    links.forEach((link) => {
      const sourceNode = nodes.find((n) => n.id === link.source);
      const targetNode = nodes.find((n) => n.id === link.target);
      if (!sourceNode || !targetNode) return;

      const maxCount = Math.max(...links.map((l) => l.count));
      const lineWidth = 1 + (link.count / maxCount) * 4;

      // Draw line
      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.5)"; // Primary color with opacity
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Draw arrow
      const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x);
      const arrowSize = 8;
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;

      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX - arrowSize * Math.cos(angle - Math.PI / 6),
        midY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX - arrowSize * Math.cos(angle + Math.PI / 6),
        midY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach((node) => {
      const maxMessages = Math.max(...nodes.map((n) => n.messageCount));
      const radius = 15 + (node.messageCount / maxMessages) * 15;

      // Draw circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "rgb(99, 102, 241)";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = "white";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.name.slice(0, 10), node.x, node.y);
    });
  }, [nodes, links]);

  if (nodes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Swarm Communication Diagram
        </h3>
        <div className="h-80 flex items-center justify-center text-slate-400 dark:text-slate-600">
          No communication data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Swarm Communication Diagram
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {nodes.length} agents, {links.length} communication links in the last {hours}h
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="border border-slate-200 dark:border-slate-700 rounded-lg"
        />
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">Top Communicators</div>
          <div className="space-y-1">
            {nodes
              .sort((a, b) => b.messageCount - a.messageCount)
              .slice(0, 5)
              .map((node) => (
                <div key={node.id} className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="truncate mr-2">{node.name}</span>
                  <span className="font-mono">{node.messageCount} msgs</span>
                </div>
              ))}
          </div>
        </div>
        <div>
          <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">Busiest Links</div>
          <div className="space-y-1">
            {links.slice(0, 5).map((link, index) => {
              const source = nodes.find((n) => n.id === link.source);
              const target = nodes.find((n) => n.id === link.target);
              return (
                <div key={index} className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="truncate mr-2">
                    {source?.name.slice(0, 8)} → {target?.name.slice(0, 8)}
                  </span>
                  <span className="font-mono">{link.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwarmCommunicationDiagram;
