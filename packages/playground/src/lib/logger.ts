import { useEffect, useState } from "react";

const logQueues: Record<string, string[]> = {};
const subscribers: Record<string, (() => void)[]> = {};

export function createLogger(name: string) {
  if (!logQueues[name]) {
    logQueues[name] = [];
    subscribers[name] = [];
  }

  const log = (message: string) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    const formattedMessage = `[${timestamp}] ${message}`;

    logQueues[name].push(formattedMessage);

    setTimeout(() => {
      subscribers[name].forEach((callback) => callback());
    }, 0);
  };

  const getLogs = () => {
    return [...logQueues[name]];
  };

  const subscribe = (callback: () => void) => {
    subscribers[name].push(callback);
    return () => {
      const index = subscribers[name].indexOf(callback);
      if (index !== -1) {
        subscribers[name].splice(index, 1);
      }
    };
  };

  const clear = () => {
    logQueues[name] = [];
    subscribers[name].forEach((callback) => callback());
  };

  return { log, getLogs, subscribe, clear, name };
}

export function useLogs(
  logger: ReturnType<typeof createLogger>,
  maxLogs: number
) {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setLogs(logger.getLogs().slice(-maxLogs));

    const unsubscribe = logger.subscribe(() => {
      setLogs(logger.getLogs().slice(-maxLogs));
    });

    return unsubscribe;
  }, [logger, maxLogs]);

  return logs;
}
