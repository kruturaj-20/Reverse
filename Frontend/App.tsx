/**
 * ReverseShop - AI-Powered Shopping App
 * Root entry point with navigation and providers
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useWishlistStore } from './src/store/wishlistStore';
import { Colors } from './src/theme';

function App(): React.JSX.Element {
  const loadWishlist = useWishlistStore(state => state.loadWishlist);

  useEffect(() => {
    loadWishlist();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
