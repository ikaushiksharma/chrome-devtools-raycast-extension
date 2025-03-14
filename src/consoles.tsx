import { Action, ActionPanel, List, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import fetch from "node-fetch";

interface DebugTarget {
  id: string;
  title: string;
  url: string;
  devtoolsFrontendUrl: string;
  webSocketDebuggerUrl: string;
}

export default function Command() {
  const [targets, setTargets] = useState<DebugTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDebugTargets() {
      try {
        const response = await fetch("http://localhost:9222/json/list");
        const data = (await response.json()) as DebugTarget[];
        setTargets(data);
        setIsLoading(false);
      } catch (error) {
        showToast(
          Toast.Style.Failure,
          "Failed to connect to Chrome. Ensure it's running with --remote-debugging-port=9222",
        );
        setIsLoading(false);
      }
    }
    fetchDebugTargets();
  }, []);

  return (
    <List isLoading={isLoading}>
      {targets.map((target) => (
        <List.Item
          key={target.id}
          title={target.title}
          subtitle={target.url}
          actions={
            <ActionPanel>
              <Action.Push
                title="Open DevTools"
                target={<DevToolsPanel devtoolsUrl={`http://localhost:9222${target.devtoolsFrontendUrl}`} />}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function DevToolsPanel({ devtoolsUrl }: { devtoolsUrl: string }) {
  return (
    <List>
      <List.Item
        title="Chrome DevTools"
        actions={
          <ActionPanel>
            <Action.OpenInBrowser url={devtoolsUrl} />
            {/* Optional: Use WebView if compatible */}
            {/* <Action.Push title="Embed" target={<WebView url={devtoolsUrl} />} /> */}
          </ActionPanel>
        }
      />
    </List>
  );
}
