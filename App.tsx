import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootStackNavigator from './src/navigation/RootStackNavigator.tsx';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/features/auth/AuthProvider.tsx';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar />
        <AuthProvider>
          <NavigationContainer>
            <RootStackNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
