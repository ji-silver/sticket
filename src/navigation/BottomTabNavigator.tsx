import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/home/HomeScreen.tsx';
import CalendarScreen from '../screens/home/CalendarScreen.tsx';
import ProfileScreen from '../screens/home/ProfileScreen.tsx';
import { CalendarDays, Home, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { fonts } from '../styles/fonts.ts';
import { colors } from '../styles/colors.ts';
import AppText from '../components/common/AppText.tsx';

type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Profile: undefined;
};

type TabIconProps = {
  color: string;
  focused: boolean;
};

type TabLabelProps = TabIconProps & {
  children: string;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function renderTabIcon(
  Icon: LucideIcon,
  { color, focused }: TabIconProps,
) {
  return (
    <View
      style={[
        styles.iconContainer,
        focused && styles.iconContainerActive,
      ]}
    >
      <Icon size={24} color={color} strokeWidth={2.2} />
    </View>
  );
}

const tabBarIcons = {
  Home: (props: TabIconProps) => renderTabIcon(Home, props),
  Calendar: (props: TabIconProps) => renderTabIcon(CalendarDays, props),
  Profile: (props: TabIconProps) => renderTabIcon(User, props),
};

function renderTabLabel({ color, focused, children }: TabLabelProps) {
  return (
    <AppText
      style={[
        styles.tabLabel,
        { color },
        focused ? styles.tabLabelActive : styles.tabLabelInactive,
      ]}
    >
      {children}
    </AppText>
  );
}

function BottomTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          elevation: 0,
        },
        tabBarLabel: renderTabLabel,
        tabBarIcon: tabBarIcons[route.name],
        tabBarIconStyle: styles.tabBarIcon,
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

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 30,
    borderRadius: 15,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: colors.primarySoft,
  },
  tabBarIcon: {
    width: 40,
    height: 30,
  },
  tabLabel: {
    width: '100%',
    marginTop: 2,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabLabelActive: {
    fontFamily: fonts.bold,
  },
  tabLabelInactive: {
    fontFamily: fonts.medium,
  },
});
