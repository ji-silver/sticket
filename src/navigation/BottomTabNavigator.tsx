import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/home/HomeScreen.tsx";
import CalendarScreen from "../screens/home/CalendarScreen.tsx";
import ProfileScreen from "../screens/home/ProfileScreen.tsx";
import {CalendarDays, Home, User} from "lucide-react-native";

const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
    return (
        <Tab.Navigator screenOptions={({route}) => ({
            headerTitleAlign: 'center',
            tabBarLabelStyle: {
                marginTop: 4,
            },
            tabBarIcon: ({color}) => {
                if(route.name === 'Home') {
                    return <Home size={24} color={color} />
                }

                if(route.name === 'Calendar') {
                    return <CalendarDays size={24} color={color} />
                }

                return <User color={color} size={24} />;
            }
        })}>
            <Tab.Screen name={'Home'} component={HomeScreen} options={{title: '홈'}} />
            <Tab.Screen name={'Calendar'} component={CalendarScreen} options={{title: '캘린더'}} />
            <Tab.Screen name={'Profile'} component={ProfileScreen} options={{title: '프로필'}} />

        </Tab.Navigator>
    )
}

export default BottomTabNavigator;