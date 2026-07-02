import { useAppTheme } from "@/store/global.store";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const id = undefined;
  return (
    <Tab.Navigator
      id={id}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textGrey,
        tabBarStyle: {
          height: 80,
          paddingTop: 8,
          backgroundColor: theme.colors.surfaceElevated,
        },
      }}
    >
      <Tab.Screen
        name="home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={24} color={color} />
          ),
        }}
      />
      {/* Add other tabs */}
    </Tab.Navigator>
  );
};

function getStyles(theme: any) { return StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
  },
}) }

var styles: any;

export default TabNavigator;

// Temporary placeholder component
const HomeScreen = () => null;
