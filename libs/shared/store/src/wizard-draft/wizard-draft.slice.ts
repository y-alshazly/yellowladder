import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  BusinessType,
  CompaniesHouseAddress,
  CompaniesHouseLookupResponse,
  CompaniesHousePersonOfSignificantControl,
  CreateCompanyBusinessProfile,
  PrimaryContactInput,
  SelfEmployedDetails,
} from '@yellowladder/shared-types';

/**
 * Held-in-memory draft of the Phase C onboarding wizard. The backend is
 * stateless between Phase B completion and Phase C submit — all wizard data
 * lives here until the final atomic `POST /companies` call.
 *
 * Reset on successful company creation or logout. NEVER persist to disk.
 */

/**
 * A contact candidate surfaced on the primary-contact step. May come from
 * Companies House (`source === 'COMPANIES_HOUSE'`) or be a manually added
 * row (`source === 'MANUAL'`). Manually added rows carry `isNew === true`
 * so the list can render a "NEW" chip next to the name.
 */
export interface WizardContact {
  id: string;
  firstName: string;
  lastName: string;
  jobPosition?: string;
  dateOfBirth?: string;
  address?: string;
  source: 'COMPANIES_HOUSE' | 'MANUAL';
  isNew?: boolean;
}

/**
 * Local overrides applied to the selected Companies House company via the
 * "Edit Company Info" modal. The overrides are sent as part of the final
 * `POST /companies` payload — the backend always stores the edited values
 * as Yellow Ladder's canonical record while the raw Companies House data
 * remains untouched upstream.
 */
export interface WizardCompanyOverrides {
  name?: string;
  address?: string;
}

/**
 * Step 1 account data — stored locally until the final submission.
 */
export interface WizardAccountData {
  email: string;
  phoneCountryCode: string;
  phoneE164: string;
  countryCode: string;
  businessType: BusinessType;
  password: string;
  termsAcceptedAt: string;
}

export interface WizardDraftState {
  accountData: WizardAccountData | null;
  businessType: BusinessType | null;
  /**
   * 0-indexed current step inside Phase C — used by the wizard progress
   * indicator.
   */
  currentStepIndex: number;
  businessProfile: Partial<CreateCompanyBusinessProfile>;
  /**
   * Limited-company branch: the Companies House lookup result is cached in
   * memory so the user can move between steps without re-searching.
   */
  companiesHouseLookup: CompaniesHouseLookupResponse | null;
  /**
   * Local overrides applied via the Edit Company Info modal. Applied on
   * top of `companiesHouseLookup` when rendering or submitting.
   */
  companyOverrides: WizardCompanyOverrides;
  /**
   * Limited-company branch: the PSC the user picked on the primary-contact
   * step (null if they chose manual entry).
   */
  selectedPsc: CompaniesHousePersonOfSignificantControl | null;
  /**
   * Primary-contact step: the full contact list rendered in the radio
   * group. Seeded from Companies House PSCs on step 3 confirmation, with
   * any manually added contacts appended via `addContact`.
   */
  contacts: WizardContact[];
  /**
   * Identifier of the contact currently selected as the primary contact,
   * or `null` when no selection has been made yet.
   */
  selectedContactId: string | null;
  /**
   * Whether the user ticked the "I confirm I am authorised…" checkbox on
   * the primary-contact step.
   */
  authorisationConfirmed: boolean;
  primaryContact: Partial<PrimaryContactInput>;
  /**
   * Self-employed branch: the collected self-employed details form values.
   */
  selfEmployed: Partial<SelfEmployedDetails>;
  /**
   * ISO timestamp captured when the user ticks the "I confirm I am
   * authorised…" box on the final step.
   */
  authorisationConfirmedAt: string | null;
  /**
   * Client-generated idempotency key used on `POST /companies`. Generated
   * on wizard entry so retries of the same submission deduplicate.
   */
  idempotencyKey: string | null;
}

const initialState: WizardDraftState = {
  accountData: null,
  businessType: null,
  currentStepIndex: 0,
  businessProfile: {},
  companiesHouseLookup: null,
  companyOverrides: {},
  selectedPsc: null,
  contacts: [],
  selectedContactId: null,
  authorisationConfirmed: false,
  primaryContact: {},
  selfEmployed: {},
  authorisationConfirmedAt: null,
  idempotencyKey: null,
};

export interface SetSelectedCompanyPayload {
  lookup: CompaniesHouseLookupResponse;
  contacts: WizardContact[];
}

export const wizardDraftSlice = createSlice({
  name: 'wizardDraft',
  initialState,
  reducers: {
    setAccountData(_state, action: PayloadAction<WizardAccountData>) {
      return {
        ...initialState,
        accountData: action.payload,
        businessType: action.payload.businessType,
      };
    },
    startWizard(
      state,
      action: PayloadAction<{ businessType: BusinessType; idempotencyKey: string }>,
    ) {
      state.businessType = action.payload.businessType;
      state.idempotencyKey = action.payload.idempotencyKey;
      state.currentStepIndex = 0;
    },
    setCurrentStepIndex(state, action: PayloadAction<number>) {
      state.currentStepIndex = Math.max(0, action.payload);
    },
    patchBusinessProfile(state, action: PayloadAction<Partial<CreateCompanyBusinessProfile>>) {
      state.businessProfile = { ...state.businessProfile, ...action.payload };
    },
    setCompaniesHouseLookup(state, action: PayloadAction<CompaniesHouseLookupResponse | null>) {
      state.companiesHouseLookup = action.payload;
      state.selectedPsc = null;
      state.companyOverrides = {};
      state.contacts = [];
      state.selectedContactId = null;
    },
    /**
     * One-shot setter used when the user picks a company on step 3. Stores
     * the lookup payload AND seeds the primary-contact candidate list from
     * the Companies House PSC rows.
     */
    setSelectedCompany(state, action: PayloadAction<SetSelectedCompanyPayload>) {
      state.companiesHouseLookup = action.payload.lookup;
      state.companyOverrides = {};
      state.contacts = action.payload.contacts;
      state.selectedContactId = action.payload.contacts[0]?.id ?? null;
    },
    patchCompanyOverrides(state, action: PayloadAction<WizardCompanyOverrides>) {
      state.companyOverrides = { ...state.companyOverrides, ...action.payload };
    },
    addContact(state, action: PayloadAction<WizardContact>) {
      state.contacts = [...state.contacts, action.payload];
      state.selectedContactId = action.payload.id;
    },
    removeContact(state, action: PayloadAction<string>) {
      state.contacts = state.contacts.filter((contact) => contact.id !== action.payload);
      if (state.selectedContactId === action.payload) {
        state.selectedContactId = state.contacts[0]?.id ?? null;
      }
    },
    selectContact(state, action: PayloadAction<string>) {
      state.selectedContactId = action.payload;
    },
    setAuthorisationConfirmed(state, action: PayloadAction<boolean>) {
      state.authorisationConfirmed = action.payload;
    },
    setSelectedPsc(state, action: PayloadAction<CompaniesHousePersonOfSignificantControl | null>) {
      state.selectedPsc = action.payload;
    },
    patchPrimaryContact(state, action: PayloadAction<Partial<PrimaryContactInput>>) {
      state.primaryContact = { ...state.primaryContact, ...action.payload };
    },
    patchSelfEmployed(state, action: PayloadAction<Partial<SelfEmployedDetails>>) {
      state.selfEmployed = { ...state.selfEmployed, ...action.payload };
    },
    confirmAuthorisation(state, action: PayloadAction<string>) {
      state.authorisationConfirmedAt = action.payload;
      state.authorisationConfirmed = true;
    },
    resetWizard() {
      return initialState;
    },
  },
});

export const {
  setAccountData,
  startWizard,
  setCurrentStepIndex,
  patchBusinessProfile,
  setCompaniesHouseLookup,
  setSelectedCompany,
  patchCompanyOverrides,
  addContact,
  removeContact,
  selectContact,
  setAuthorisationConfirmed,
  setSelectedPsc,
  patchPrimaryContact,
  patchSelfEmployed,
  confirmAuthorisation,
  resetWizard,
} = wizardDraftSlice.actions;

export const wizardDraftReducer = wizardDraftSlice.reducer;

// Selectors
export const selectWizardDraft = (state: { wizardDraft: WizardDraftState }): WizardDraftState =>
  state.wizardDraft;
export const selectWizardStepIndex = (state: { wizardDraft: WizardDraftState }): number =>
  state.wizardDraft.currentStepIndex;
export const selectWizardBusinessType = (state: {
  wizardDraft: WizardDraftState;
}): BusinessType | null => state.wizardDraft.businessType;
export const selectWizardContacts = (state: {
  wizardDraft: WizardDraftState;
}): readonly WizardContact[] => state.wizardDraft.contacts;
export const selectWizardSelectedContactId = (state: {
  wizardDraft: WizardDraftState;
}): string | null => state.wizardDraft.selectedContactId;
export const selectWizardAuthorisationConfirmed = (state: {
  wizardDraft: WizardDraftState;
}): boolean => state.wizardDraft.authorisationConfirmed;
export const selectWizardCompanyOverrides = (state: {
  wizardDraft: WizardDraftState;
}): WizardCompanyOverrides => state.wizardDraft.companyOverrides;

/**
 * Resolves the effective registered address string for the selected company
 * by overlaying `companyOverrides.address` on top of the Companies House
 * `registeredAddress`. Returns an empty string if nothing is selected yet.
 */
export function resolveEffectiveRegisteredAddress(state: WizardDraftState): string {
  if (state.companyOverrides.address) return state.companyOverrides.address;
  const address = state.companiesHouseLookup?.registeredAddress;
  if (!address) return '';
  return formatAddress(address);
}

export function formatAddress(address: CompaniesHouseAddress): string {
  return [address.line1, address.line2, address.city, address.postalCode, address.countryCode]
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join(', ');
}
