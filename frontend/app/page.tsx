"use client";

import { useEffect, useState } from "react";

export default function Home() {
  interface DynamoDBAttribute {
    S?: string;
    N?: string;
    BOOL?: boolean;
  }

  interface DynamoDBItem {
    [key: string]: DynamoDBAttribute;
  }

  const [messages, setMessages] = useState<DynamoDBItem[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/events`
    );

    eventSource.onmessage = (event) => {
      console.log("Received update:", event.data);
      setMessages((prev) => [...prev, JSON.parse(event.data)]);
    };

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Live DynamoDB Updates</h1>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>
            <pre>{JSON.stringify(msg, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
