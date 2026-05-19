import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  registerTrigger: (value: string, node: HTMLButtonElement | null) => void;
  focusByValue: (value: string) => void;
  values: string[];
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error("Tabs components must be used inside <Tabs>");
  }
  return ctx;
}

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const triggersRef = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const [values, setValues] = React.useState<string[]>([]);

  const registerTrigger = React.useCallback((tabValue: string, node: HTMLButtonElement | null) => {
    if (node) {
      triggersRef.current.set(tabValue, node);
    } else {
      triggersRef.current.delete(tabValue);
    }
    const nextValues = Array.from(triggersRef.current.keys());
    setValues((prevValues) => {
      if (prevValues.length === nextValues.length && prevValues.every((v, i) => v === nextValues[i])) {
        return prevValues;
      }
      return nextValues;
    });
  }, []);

  const focusByValue = React.useCallback((tabValue: string) => {
    triggersRef.current.get(tabValue)?.focus();
  }, []);

  const context = React.useMemo<TabsContextValue>(
    () => ({ value, onValueChange, registerTrigger, focusByValue, values }),
    [focusByValue, onValueChange, registerTrigger, value, values],
  );

  return (
    <TabsContext.Provider value={context}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div role="tablist" className={cn(className)}>{children}</div>;
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { value: currentValue, onValueChange, registerTrigger, focusByValue, values } = useTabsContext();
  const isActive = currentValue === value;
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    registerTrigger(value, triggerRef.current);
    return () => registerTrigger(value, null);
  }, [registerTrigger, value]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (values.length === 0) {
      return;
    }

    const currentIndex = values.indexOf(value);
    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % values.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + values.length) % values.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = values.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextValue = values[nextIndex];
    onValueChange(nextValue);
    focusByValue(nextValue);
  };

  return (
    <button
      ref={triggerRef}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabs-content-${value}`}
      id={`tabs-trigger-${value}`}
      tabIndex={isActive ? 0 : -1}
      data-state={isActive ? "active" : "inactive"}
      className={cn(className)}
      onClick={() => onValueChange(value)}
      onKeyDown={onKeyDown}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { value: currentValue } = useTabsContext();
  if (currentValue !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabs-content-${value}`}
      aria-labelledby={`tabs-trigger-${value}`}
      className={cn(className)}
    >
      {children}
    </div>
  );
}
