"use client";

import { useEffect, useState } from "react";

export default function Typewriter({
  text,
  charDelay = 55,
  startDelay = 0,
}: {
  text: string;
  charDelay?: number;
  startDelay?: number;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      let i = 0;
      intervalId = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, ++i));
        } else {
          clearInterval(intervalId);
        }
      }, charDelay);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, charDelay, startDelay]);

  return <span>{displayed}</span>;
}
