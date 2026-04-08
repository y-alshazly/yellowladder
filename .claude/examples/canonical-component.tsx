// @ts-nocheck
// CANONICAL EXAMPLE: React + MUI Component Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new web component.
//
// Key conventions demonstrated:
// 1. Functional component, named export only (no default export)
// 2. Props interface named {Component}Props, also exported
// 3. useTranslation() for all user-facing strings — no hardcoded EN/AR
// 4. RTK Query hooks for API calls (useCreateMenuItemMutation) — no raw fetch
// 5. MUI components from @mui/material — no Tailwind, no styled-components, no CSS files
// 6. Forms use React Hook Form + Zod via @hookform/resolvers/zod
// 7. Zod schema co-located with the component as {action}-{entity}.schema.ts
// 8. CASL UI gating via <CanAction> and <CanField> from shared/web-ui
// 9. Error handling via RTK Query's `error` state — never expose raw errors
// 10. sx prop for styling — never inline style attribute, never CSS modules

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CanAction, CanField } from '@yellowladder/shared-web-ui';
import { useCreateMenuItemMutation } from '@yellowladder/shared-api';
import {
  createMenuItemSchema,
  type CreateMenuItemForm,
} from './create-menu-item.schema';

// Props interface — exported, named {Component}Props
export interface MenuItemFormProps {
  initialValues?: Partial<CreateMenuItemForm>;
  onSuccess?: (id: string) => void;
}

// Functional component with named export
export function MenuItemForm({ initialValues, onSuccess }: MenuItemFormProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [createMenuItem, { isLoading, error }] = useCreateMenuItemMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMenuItemForm>({
    resolver: zodResolver(createMenuItemSchema),
    defaultValues: initialValues,
  });

  const onSubmit = async (data: CreateMenuItemForm) => {
    try {
      const result = await createMenuItem(data).unwrap();
      onSuccess?.(result.id);
      // Locale-prefixed routes: /(en|ar)/...
      navigate(`/${i18n.language}/catalog/menu-items/${result.id}`);
    } catch {
      // RTK Query already exposes the error via `error` state — handled below
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Backend errors mapped to user-friendly messages via i18n */}
        {error && (
          <Alert severity="error">
            {t('catalog.menuItems.errors.createFailed')}
          </Alert>
        )}

        {/* Every form field wrapped in <CanField> for CASL field-level authorization.
            The field name matches the backend DTO field name. */}
        <CanField action="Create" subject="MenuItem" field="nameEn">
          <TextField
            {...register('nameEn')}
            label={t('catalog.menuItems.nameEn')}
            error={!!errors.nameEn}
            helperText={errors.nameEn?.message}
            fullWidth
            required
          />
        </CanField>

        <CanField action="Create" subject="MenuItem" field="nameAr">
          <TextField
            {...register('nameAr')}
            label={t('catalog.menuItems.nameAr')}
            error={!!errors.nameAr}
            helperText={errors.nameAr?.message}
            fullWidth
            required
            // Arabic input — RTL is handled by the global theme based on locale
          />
        </CanField>

        <CanField action="Create" subject="MenuItem" field="basePrice">
          <TextField
            {...register('basePrice', { valueAsNumber: true })}
            label={t('catalog.menuItems.basePrice')}
            type="number"
            error={!!errors.basePrice}
            helperText={errors.basePrice?.message ?? t('catalog.menuItems.priceHelper')}
            fullWidth
            required
            inputProps={{ min: 0, step: 1 }}
          />
        </CanField>

        {/* Submit button uses mode="disable" — visible but greyed out if no permission */}
        <CanAction action="Create" subject="MenuItem" mode="disable">
          <Button type="submit" variant="contained" disabled={isLoading} sx={{ alignSelf: 'flex-start' }}>
            {isLoading ? <CircularProgress size={20} /> : t('common.save')}
          </Button>
        </CanAction>
      </Stack>
    </Box>
  );
}

// =====================================================================================
// CO-LOCATED SCHEMA FILE: create-menu-item.schema.ts
// =====================================================================================
//
// import { z } from 'zod';
//
// export const createMenuItemSchema = z.object({
//   nameEn: z.string().min(1, 'Name (English) is required'),
//   nameAr: z.string().min(1, 'Name (Arabic) is required'),
//   descriptionEn: z.string().optional(),
//   descriptionAr: z.string().optional(),
//   categoryId: z.string().uuid('Category is required'),
//   basePrice: z.number().int().min(0, 'Price must be a positive integer (pence)'),
//   isActive: z.boolean().optional(),
// });
//
// export type CreateMenuItemForm = z.infer<typeof createMenuItemSchema>;
//
// NOTE: The Zod schema conforms to the shared/types CreateMenuItemRequest interface,
// which is also implemented by the backend's CreateMenuItemDto class. Single source of truth.
