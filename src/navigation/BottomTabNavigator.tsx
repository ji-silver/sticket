import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { CalendarDays, Home, User } from 'lucide-react-native';
import HomeScreen from '../screens/home/HomeScreen.tsx';
import CalendarScreen from '../screens/home/CalendarScreen.tsx';
import ProfileScreen from '../screens/home/ProfileScreen.tsx';
import FloatingTabBar from './FloatingTabBar';
import { colors } from '../styles/colors.ts';

type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
type TabIconProps = { focused: boolean; color: string; size: number };

function renderTabIcon(Icon: LucideIcon, { focused, color, size }: TabIconProps) {
  return <Icon size={size} color={color} strokeWidth={focused ? 2.3 : 1.8} />;
}

const tabIcons = {
  Home: (props: TabIconProps) => renderTabIcon(Home, props),
  Calendar: (props: TabIconProps) => renderTabIcon(CalendarDays, props),
  Profile: (props: TabIconProps) => renderTabIcon(User, props),
};

function renderTabBar(props: BottomTabBarProps) {
  return <FloatingTabBar {...props} />;
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: {
          backgroundColor:
            route.name === 'Calendar' ? colors.background : colors.surface,
        },
        tabBarIcon: tabIcons[route.name],
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '홈' }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: '캘린더' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: '프로필' }}
      />
    </Tab.Navigator>
  );
}
