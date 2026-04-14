import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  message: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState extends ToastMessage {
  visible: boolean;
}

export interface ToastContextValue {
  toast: ToastState;
  showToast: (message: ToastMessage) => void;
  hideToast: () => void;
}

const INITIAL_STATE: ToastState = {
  visible: false,
  message: '',
  variant: 'info',
};

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastState>(INITIAL_STATE);

  const showToast = useCallback((msg: ToastMessage) => {
    setToast({ ...msg, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const value = useMemo(() => ({ toast, showToast, hideToast }), [toast, showToast, hideToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return ctx;
}
