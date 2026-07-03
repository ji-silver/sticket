import {SafeAreaProvider} from "react-native-safe-area-context";
import {StatusBar} from "react-native";
import {NavigationContainer} from "@react-navigation/native";

import BottomTabNavigator from './src/navigation/BottomTabNavigator';


function App() {
    return (
        <SafeAreaProvider>
            <StatusBar />
            <NavigationContainer>
                <BottomTabNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
    )
}


export default App;