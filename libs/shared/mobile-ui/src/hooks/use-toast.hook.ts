import { useCallback } from 'react';
import { useToastContext, type ToastMessage } from '../providers/toast.context';

export interface UseToastReturn {
  showSuccess: (message: string, description?: string) => void;
  showError: (message: string, description?: string) => void;
  showWarning: (message: string, description?: string) => void;
  showInfo: (message: string, description?: string) => void;
  show: (toast: ToastMessage) => void;
  hide: () => void;
}

/**
 * Convenience hook wrapping the toast context. Provides shorthand methods
 * for each variant so callers do not need to import `ToastVariant`.
 */
export function useToast(): UseToastReturn {
  const { showToast, hideToast } = useToastContext();

  const showSuccess = useCallback(
    (message: string, description?: string) =>
      showToast({ message, description, variant: 'success' }),
    [showToast],
  );
  const showError = useCallback(
    (message: string, description?: string) =>
      showToast({ message, description, variant: 'error' }),
    [showToast],
  );
  const showWarning = useCallback(
    (message: string, description?: string) =>
      showToast({ message, description, variant: 'warning' }),
    [showToast],
  );
  const showInfo = useCallback(
    (message: string, description?: string) => showToast({ message, description, variant: 'info' }),
    [showToast],
  );

  return { showSuccess, showError, showWarning, showInfo, show: showToast, hide: hideToast };
}
