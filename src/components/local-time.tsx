"use client";

import { useEffect, useState } from "react";

/** Live Dhaka time. Rendered after mount so server and client never disagree. */
export function LocalTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Dhaka",
      }).format(new Date());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- server and client clocks differ; set after mount to avoid a hydration mismatch
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  return <span>{time ?? "--:--"}</span>;
}
