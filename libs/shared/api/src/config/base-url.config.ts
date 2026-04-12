/**
 * Canonical API base URL used by the RTK Query base query.
 *
 * TODO(feature-env-config): replace this constant with a value loaded from
 * a native env bridge (e.g. `react-native-config` for mobile,
 * `import.meta.env` for web). Hardcoding is acceptable while Feature 01 is
 * still dev-only — the backend runs at port 3000 with prefix `/api/v1`.
 */
export const YELLOWLADDER_API_BASE_URL = 'http://localhost:3000/api/v1';
