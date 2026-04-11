// @ts-nocheck
// CANONICAL EXAMPLE: React + MUI Component Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new web component.
//
// Key conventions demonstrated:
// 1. Functional component, named export only (no default export)
// 2. Props interface named {Component}Props, also exported
// 3. useTranslation() for all user-facing strings — no hardcoded EN/DE/FR
// 4. RTK Query hooks for API calls (useCreateMenuItemMutation) — no raw fetch
// 5. MUI components from @mui/material — no Tailwind, no styled-components, no CSS files
// 6. Forms use React Hook Form + Zod via @hookform/resolvers/zod
// 7. Zod schema co-located with the component as {action}-{entity}.schema.ts
// 8. RBAC UI gating via <HasPermission> and useHasPermission() from shared/web-ui
//    — NO CanAction, NO CanField, NO useAbilitySync (those were CASL-era)
// 9. Error handling via RTK Query's `error` state — never expose raw errors
// 10. sx prop for styling — never inline style attribute, never CSS modules

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, CircularProgress, Stack, TextField } from '@mui/material';
import { useCreateMenuItemMutation } from '@yellowladder/shared-api';
import { Permissions } from '@yellowladder/shared-types';
import { HasPermission, useHasPermission } from '@yellowladder/shared-web-ui';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createMenuItemSchema, type CreateMenuItemForm } from './create-menu-item.schema';

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

  // Imperative permission check — use the hook when you need a boolean inside logic
  // (e.g., conditionally disabling a single field while keeping the rest enabled).
  // EMPLOYEE cannot edit price under the canonical RBAC policy.
  const canEditPrice = useHasPermission(Permissions.MenuItemsUpdate);

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
      // Locale-prefixed routes: /(en|de|fr)/...
      navigate(`/${i18n.language}/catalog/menu-items/${result.id}`);
    } catch {
      // RTK Query already exposes the error via `error` state — handled below
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Backend errors mapped to user-friendly messages via i18n */}
        {error && <Alert severity="error">{t('catalog.menuItems.errors.createFailed')}</Alert>}

        {/* Name fields are always visible to anyone who can reach this screen;
            authorization for the whole screen is gated by a route guard upstream. */}
        <TextField
          {...register('nameEn')}
          label={t('catalog.menuItems.nameEn')}
          error={!!errors.nameEn}
          helperText={errors.nameEn?.message}
          fullWidth
          required
        />

        <TextField
          {...register('nameDe')}
          label={t('catalog.menuItems.nameDe')}
          error={!!errors.nameDe}
          helperText={errors.nameDe?.message}
          fullWidth
          required
        />

        <TextField
          {...register('nameFr')}
          label={t('catalog.menuItems.nameFr')}
          error={!!errors.nameFr}
          helperText={errors.nameFr?.message}
          fullWidth
          required
        />

        {/* Field-level gating via the imperative hook:
            the price input is visible but disabled for roles that lack MenuItemsUpdate
            (e.g., EMPLOYEE). The backend service ALSO redacts basePrice from the payload,
            so the UI disable is defense-in-depth, not the security boundary. */}
        <TextField
          {...register('basePrice', { valueAsNumber: true })}
          label={t('catalog.menuItems.basePrice')}
          type="number"
          error={!!errors.basePrice}
          helperText={errors.basePrice?.message ?? t('catalog.menuItems.priceHelper')}
          fullWidth
          required
          disabled={!canEditPrice}
          inputProps={{ min: 0, step: 1 }}
        />

        {/* Submit button wrapped in <HasPermission>. mode="disable" keeps the button visible
            but greyed out for users without the permission. mode="hide" (default) removes it. */}
        <HasPermission permission={Permissions.MenuItemsCreate} mode="disable">
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{ alignSelf: 'flex-start' }}
          >
            {isLoading ? <CircularProgress size={20} /> : t('common.save')}
          </Button>
        </HasPermission>
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
//   nameDe: z.string().min(1, 'Name (German) is required'),
//   nameFr: z.string().min(1, 'Name (French) is required'),
//   descriptionEn: z.string().optional(),
//   descriptionDe: z.string().optional(),
//   descriptionFr: z.string().optional(),
//   categoryId: z.string().uuid('Category is required'),
//   basePrice: z.number().int().min(0, 'Price must be a positive integer (pence)'),
//   isActive: z.boolean().optional(),
// });
//
// export type CreateMenuItemForm = z.infer<typeof createMenuItemSchema>;
//
// NOTE: The Zod schema conforms to the shared/types CreateMenuItemRequest interface,
// which is also implemented by the backend's CreateMenuItemDto class. Single source of truth.
