import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator.tsx';
import AddDiaryScreen from '../screens/diary/AddDiaryScreen.tsx';
import TicketListScreen from '../screens/ticket/TicketListScreen.tsx';
import AddTicketScreen from '../screens/ticket/AddTicketScreen.tsx';
import ProfileEditScreen from '../screens/home/ProfileEditScreen.tsx';

export type RootStackParamList = {
  MainTab: undefined;
  AddDiary: undefined;
  TicketList: undefined;
  AddTicket: undefined;
  ProfileEdit: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={'MainTab'} component={BottomTabNavigator} />
      <Stack.Screen name={'AddDiary'} component={AddDiaryScreen} />
      <Stack.Screen name={'TicketList'} component={TicketListScreen} />
      <Stack.Screen name={'AddTicket'} component={AddTicketScreen} />
      <Stack.Screen name={'ProfileEdit'} component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}

export default RootStackNavigator;
