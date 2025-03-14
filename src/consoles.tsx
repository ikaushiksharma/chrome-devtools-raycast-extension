import { Action, ActionPanel, List, showToast, Toast, Detail } from "@raycast/api";
import fetch from "node-fetch";
import { useEffect, useState } from "react";
import WebSocket from "ws";

import { DebugTarget, LogEntry } from "../types";
import DevtoolsPanel from "./components/devtools-panel";

export default function Command() {
  const [targets, setTargets] = useState<DebugTarget[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch debug targets
  useEffect(() => {
    fetch("http://localhost:9222/json")
      .then((res) => res.json())
      .then((data) => {
        setTargets(data as DebugTarget[]);
        setIsLoading(false);
      })
      .catch(() => showToast(Toast.Style.Failure, "Failed to connect to Chrome"));
  }, []);

  // WebSocket connection and CDP handling
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
    <List isLoading={isLoading}>
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
      <List.Section title="Debug Targets">
        {targets.map((target) => (
          <List.Item
            key={target.id}
            title={target.title}
            subtitle={target.url}
            actions={
              <ActionPanel>
                <Action title="Start Monitoring" onAction={() => setSelectedTarget(target.id)} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
