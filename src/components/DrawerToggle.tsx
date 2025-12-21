import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';

// Define your root param list type
type RootParamList = {
  Home: undefined;
  // Add other screen params here
};

export default function DrawerToggle() {
  // Specify the navigation prop type
  const navigation = useNavigation<DrawerNavigationProp<RootParamList>>();

  return (
    <TouchableOpacity
      onPress={() => navigation.toggleDrawer()}
      style={{ marginLeft: 15 }}
    >
      <Entypo name="menu" size={24} color="white" />
    </TouchableOpacity>
  );
}