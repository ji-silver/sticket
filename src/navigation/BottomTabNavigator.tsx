import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen.tsx';
import CalendarScreen from '../screens/home/CalendarScreen.tsx';
import ProfileScreen from '../screens/home/ProfileScreen.tsx';
import { CalendarDays, Home, User } from 'lucide-react-native';
import { fonts } from '../styles/fonts.ts';

const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // 헤더를 숨기도록 설정
        headerTitleAlign: 'center',
        tabBarLabelStyle: {
          marginTop: 4,
          fontFamily: fonts.bold,
          fontWeight: '700',
        },
        tabBarIcon: ({ color }) => {
          if (route.name === 'Home') {
            return <Home size={24} color={color} />;
          }

          if (route.name === 'Calendar') {
            return <CalendarDays size={24} color={color} />;
          }

          return <User color={color} size={24} />;
        },
      })}
    >
      <Tab.Screen
        name={'Home'}
        component={HomeScreen}
        options={{ title: '홈' }}
      />
      <Tab.Screen
        name={'Calendar'}
        component={CalendarScreen}
        options={{ title: '캘린더' }}
      />
      <Tab.Screen
        name={'Profile'}
        component={ProfileScreen}
        options={{ title: '프로필' }}
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;
