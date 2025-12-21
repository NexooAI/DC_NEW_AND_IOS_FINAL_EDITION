import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { COLORS } from "src/constants/colors";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const id = undefined;
  return (
    <Tab.Navigator
      id={id}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 80,
          paddingTop: 8,
          backgroundColor: COLORS.white,
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

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
  },
});

export default TabNavigator;

// Temporary placeholder component
const HomeScreen = () => null;
