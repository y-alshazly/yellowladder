import { NavigationContainer } from '@react-navigation/native';
import { DEFAULT_LOCALE, initialiseI18n } from '@yellowladder/shared-i18n';
import { PaperThemeProvider } from '@yellowladder/shared-mobile-ui';
import { useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { linkingConfig } from '../navigation/linking.config';
import { RootNavigator } from '../navigation/root.navigator';
import { AuthHydrationGate } from './auth-hydration';
import { store } from './store';

/**
 * Root component. Mounts every provider the app needs:
 *
 *   Redux → Paper theme → SafeArea → i18n → NavigationContainer
 *
 * All feature libs read state through the providers mounted here — none of
 * them create their own store / theme / i18n instance.
 */
export function App() {
  const i18n = useMemo(() => initialiseI18n(DEFAULT_LOCALE), []);
  return (
    <ReduxProvider store={store}>
      <PaperThemeProvider>
        <SafeAreaProvider>
          <I18nextProvider i18n={i18n}>
            <AuthHydrationGate>
              <NavigationContainer linking={linkingConfig}>
                <RootNavigator />
              </NavigationContainer>
            </AuthHydrationGate>
          </I18nextProvider>
        </SafeAreaProvider>
      </PaperThemeProvider>
    </ReduxProvider>
  );
}
