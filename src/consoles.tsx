import { Action, ActionPanel, List, showToast, Toast, Detail } from "@raycast/api";
import fetch from "node-fetch";
import { useEffect, useState } from "react";
import { DebugTarget } from "../types";
import DevtoolsPanel from "./components/devtools-panel";

export default function Command() {
  const [targets, setTargets] = useState<DebugTarget[]>([]);
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

  return (
    <List isLoading={isLoading}>
      <List.Section title="Debug Targets">
        {targets.map((target) => (
          <List.Item
            key={target.id}
            title={target.title}
            subtitle={target.url}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Start Monitoring"
                  target={<DevtoolsPanel selectedTarget={target.id} targets={targets} />}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
