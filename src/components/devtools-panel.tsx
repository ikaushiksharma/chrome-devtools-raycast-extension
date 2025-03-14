import { List, showToast, Toast } from "@raycast/api";
import React, { useEffect, useState } from "react";
import { DebugTarget, LogEntry } from "../../types";
import { WebSocket } from "ws";

const DevtoolsPanel = ({ selectedTarget, targets }: { selectedTarget: string | null; targets: DebugTarget[] }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  useEffect(() => {
    if (!selectedTarget) return;

    const target = targets.find((t) => t.id === selectedTarget);
    if (!target) return;

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let messageId = 0;

    ws.on("open", () => {
      // Enable Console domain
      ws.send(
        JSON.stringify({
          id: ++messageId,
          method: "Console.enable",
        }),
      );

      // Enable Network domain
      ws.send(
        JSON.stringify({
          id: ++messageId,
          method: "Network.enable",
        }),
      );
    });

    ws.on("message", (rawData) => {
      const data = JSON.parse(rawData.toString());

      // Handle Console logs
      if (data.method === "Console.messageAdded") {
        const message = data.params.message;
        setLogs((prev) => [
          {
            type: "console",
            message: message.text,
            level: message.level,
          },
          ...prev,
        ]);
      }

      // Handle Network requests
      if (data.method === "Network.requestWillBeSent") {
        const request = data.params.request;
        setLogs((prev) => [
          {
            type: "network",
            url: request.url,
            method: request.method,
          },
          ...prev,
        ]);
      }
    });

    ws.on("error", (error) => {
      showToast(Toast.Style.Failure, "WebSocket Error", error.message);
    });

    return () => ws.close();
  }, [selectedTarget]);
  return (
    <List>
      <List.Section title="Live Monitoring">
        {logs.map((log, index) => (
          <List.Item
            key={index}
            title={log.type === "console" ? log.message : `${log.method} ${log.url}`}
            accessories={[
              {
                tag: {
                  value: log.type === "console" ? log.level.toUpperCase() : "NETWORK",
                  color:
                    log.type === "console"
                      ? log.level === "error"
                        ? "red"
                        : log.level === "warning"
                          ? "yellow"
                          : "blue"
                      : "green",
                },
              },
            ]}
          />
        ))}
      </List.Section>
    </List>
  );
};

export default DevtoolsPanel;
