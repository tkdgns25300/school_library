"use client";

import { useEffect, useState } from "react";

const FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

export function TodayDate() {
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    setToday(FORMATTER.format(new Date()));
  }, []);

  return <time>{today}</time>;
}
