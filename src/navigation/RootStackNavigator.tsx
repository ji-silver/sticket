import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator.tsx';
import AddDiaryScreen from '../screens/diary/AddDiaryScreen.tsx';

const Stack = createNativeStackNavigator();

function RootStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={'MainTab'} component={BottomTabNavigator} />
      <Stack.Screen name={'AddDiary'} component={AddDiaryScreen} />
    </Stack.Navigator>
  );
}

export default RootStackNavigator;
