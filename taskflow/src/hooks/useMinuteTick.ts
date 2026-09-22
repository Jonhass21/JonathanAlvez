import { useEffect, useState } from "react";

/**
 * Re-renders once a minute so "En 30 minutos" stays honest without a timer per
 * task. Aligns the first tick to the next whole minute, then settles into 60s.
 */
export function useMinuteTick(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const msToNextMinute = 60000 - (Date.now() % 60000);
    const timeout = setTimeout(() => {
      setTick((t) => t + 1);
      interval = setInterval(() => setTick((t) => t + 1), 60000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return tick;
}
