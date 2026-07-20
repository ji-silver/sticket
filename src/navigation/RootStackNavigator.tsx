import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator.tsx';
import AddDiaryScreen from '../screens/diary/AddDiaryScreen.tsx';
import TicketListScreen from '../screens/ticket/TicketListScreen.tsx';
import AddTicketScreen from '../screens/ticket/AddTicketScreen.tsx';
import ProfileEditScreen from '../screens/home/ProfileEditScreen.tsx';
import AuthScreen from '../screens/auth/AuthScreen.tsx';
import LoadingScreen from '../screens/auth/LoadingScreen.tsx';
import TicketDetailScreen from '../screens/ticket/TicketDetailScreen.tsx';
import { Ticket } from '../screens/ticket/types.ts';

export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  MainTab: undefined;
  AddDiary: undefined;
  TicketList:
    | {
        deletedTicketId?: number;
      }
    | undefined;
  AddTicket: undefined;
  ProfileEdit: undefined;
  TicketDetail: {
    ticket: Ticket;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Loading"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={'Loading'} component={LoadingScreen} />
      <Stack.Screen name={'Auth'} component={AuthScreen} />
      <Stack.Screen name={'MainTab'} component={BottomTabNavigator} />
      <Stack.Screen name={'AddDiary'} component={AddDiaryScreen} />
      <Stack.Screen name={'TicketList'} component={TicketListScreen} />
      <Stack.Screen name={'AddTicket'} component={AddTicketScreen} />
      <Stack.Screen name={'TicketDetail'} component={TicketDetailScreen} />
      <Stack.Screen name={'ProfileEdit'} component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}

export default RootStackNavigator;
