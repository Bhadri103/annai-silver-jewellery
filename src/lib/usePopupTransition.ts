import { useEffect, useState } from "react";

const EXIT_DURATION_MS = 240;

export const usePopupTransition = (open: boolean, exitDurationMs = EXIT_DURATION_MS) => {
  const [mounted, setMounted] = useState(open);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(frame);
    }

    setActive(false);
    const timer = window.setTimeout(() => setMounted(false), exitDurationMs);
    return () => window.clearTimeout(timer);
  }, [exitDurationMs, open]);

  return { mounted, active };
};
