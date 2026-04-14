import { NavigationContainer } from '@react-navigation/native';
import { DEFAULT_LOCALE, initialiseI18n } from '@yellowladder/shared-i18n';
import { PaperThemeProvider, SnackbarHost, ToastProvider } from '@yellowladder/shared-mobile-ui';
import { I18nextProvider } from 'react-i18next';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { linkingConfig } from '../navigation/linking.config';
import { RootNavigator } from '../navigation/root.navigator';
import { AuthHydrationGate } from './auth-hydration';
import { store } from './store';

// Initialise i18n at module level — before any component renders — to avoid
// the "Cannot update component while rendering" warning caused by
// initReactI18next's internal setState firing during a React render cycle.
const i18n = initialiseI18n(DEFAULT_LOCALE);

/**
 * Root component. Mounts every provider the app needs:
 *
 *   Redux → Paper theme → SafeArea → i18n → Toast → NavigationContainer
 *
 * All feature libs read state through the providers mounted here — none of
 * them create their own store / theme / i18n instance.
 */
export function App() {
  return (
    <ReduxProvider store={store}>
      <PaperThemeProvider>
        <SafeAreaProvider>
          <I18nextProvider i18n={i18n}>
            <ToastProvider>
              <AuthHydrationGate>
                <NavigationContainer linking={linkingConfig}>
                  <RootNavigator />
                </NavigationContainer>
              </AuthHydrationGate>
              <SnackbarHost />
            </ToastProvider>
          </I18nextProvider>
        </SafeAreaProvider>
      </PaperThemeProvider>
    </ReduxProvider>
  );
}
