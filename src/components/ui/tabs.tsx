'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('Tabs components must be used inside Tabs.');
  }

  return context;
}

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsChildProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsChildProps) {
  return (
    <div role="tablist" className={className}>
      {children}
    </div>
  );
}

interface TabsTriggerProps extends TabsChildProps {
  value: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const context = useTabsContext();

  return (
    <button
      type="button"
      role="tab"
      aria-selected={context.value === value}
      onClick={() => context.setValue(value)}
      className={className}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends TabsChildProps {
  value: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useTabsContext();

  if (context.value !== value) {
    return null;
  }

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
