import { useEffect, useState } from "react";

let firstMountConsumed = false;

export const useFirstMount = (): boolean => {
  const [isFirstMount] = useState(() => !firstMountConsumed);

  useEffect(() => {
    if (!isFirstMount) return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) firstMountConsumed = true;
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isFirstMount]);

  return isFirstMount;
};
