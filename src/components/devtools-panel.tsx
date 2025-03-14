import { List } from "@raycast/api";
import React from "react";
import { LogEntry } from "../../types";

const DevtoolsPanel = ({ logs }: { logs: LogEntry[] }) => {
  console.log(logs);
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
