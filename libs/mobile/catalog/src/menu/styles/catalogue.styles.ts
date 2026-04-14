import { StyleSheet } from 'react-native';

/**
 * Shared StyleSheet for the catalogue screen + its layouts and row components.
 * Column flex tokens are shared between the tablet header and the tablet row
 * so the column widths line up.
 */
export const catalogueStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    borderRadius: 8,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },

  // ---------- Tablet ----------
  tabletRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletMain: {
    flex: 1,
  },
  tabletMainWithPanel: {
    flex: 3,
  },
  tabletPanel: {
    flex: 2,
    maxWidth: 400,
  },
  tabletCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  colName: {
    flex: 3,
  },
  colCategory: {
    flex: 2,
  },
  colPrice: {
    flex: 1,
    minWidth: 90,
  },
  colAddons: {
    flex: 2,
  },
  colAction: {
    width: 44,
    alignItems: 'center',
  },
  inlineInput: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  addonChip: {
    alignSelf: 'flex-start',
  },
  addProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ---------- Phone ----------
  phoneCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneCategoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  phoneCategoryIconTile: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneProductsCard: {
    backgroundColor: '#FFFFFF',
  },
  phoneProductSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  phoneProductTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneProductCategoryTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  phoneProductNameInput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    fontSize: 15,
  },
  phoneProductPriceInput: {
    width: 96,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    textAlign: 'right',
    fontSize: 15,
  },
  phoneProductTrashButton: {
    margin: 0,
  },
  phoneAddonsSection: {
    marginTop: 8,
  },
  phoneAddonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'flex-start',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
  },
  phoneAddonAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneAddonChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  phoneAddonInput: {
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: 37,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    lineHeight: 18,
    backgroundColor: '#FFFFFF',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    gap: 12,
    alignItems: 'center',
  },
  fab: {
    borderRadius: 16,
  },
});
