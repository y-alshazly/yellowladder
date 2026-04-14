import { useTranslation } from 'react-i18next';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useAppTheme } from '../theme/use-app-theme.hook';

export interface DeleteConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * Label for the confirm action. Defaults to `t('common.delete')`.
   * Pass a custom value for non-delete confirmations (e.g., remove member,
   * reset password) that still want the same dialog layout.
   */
  confirmLabel?: string;
  /**
   * When `true` (default), the confirm action renders in `theme.colors.error`
   * to signal a destructive operation. Set to `false` for non-destructive
   * confirmations (e.g., sending a password reset email).
   */
  destructive?: boolean;
}

/**
 * Generic confirm/cancel dialog. Wraps a Paper `Dialog` inside a `Portal`.
 * By default the confirm action is rendered destructively (error color +
 * `common.delete` label), but `confirmLabel` and `destructive` allow reuse
 * for any two-button confirm flow.
 */
export function DeleteConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  destructive = true,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel} style={{ backgroundColor: '#FFFFFF' }}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel}>{t('common.cancel')}</Button>
          <Button onPress={onConfirm} textColor={destructive ? theme.colors.error : undefined}>
            {confirmLabel ?? t('common.delete')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
