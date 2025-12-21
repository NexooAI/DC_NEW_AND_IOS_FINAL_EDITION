import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
// AppHeader is now handled by the layout wrapper
import { Ionicons } from "@expo/vector-icons";

// Make sure you have AppHeader defined or imported
// import AppHeader from './AppHeader';

interface StoreLocation {
  id: string;
  value: string;
  label: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  image: string;
}

let MapView: React.ComponentType<any>, Marker: React.ComponentType<any>;
if (Platform.OS === "web") {
  MapView = (props: any) => (
    <div
      style={{
        width: "100%",
        height: 300,
        background: "#eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span>Map not supported on web</span>
    </div>
  );
  Marker = () => null;
} else {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
}

const stores = [
  {
    id: 1,
    name: "DC Jewellers ",
    latitude: 8.427828080550306,
    longitude: 78.02855977120382,
    address:
      "205/64A, Main Bazar, Udangudi, Thoothukudi(D), Tamil Nadu - 628203",
  },
  //   {
  //     id: 2,
  //     name: "Akila Theni Branch",
  //     latitude: 10.063998494766125,
  //     longitude: 77.51565016360244,
  //     address: "Madurai Main Rd, Suppan Ragavan Colony, NRT Nagar, Theni, 625531",
  //   },
  // Add more stores as needed
];

const StoreLocator = () => {
  const router = useRouter();
  const scrollY = new Animated.Value(0);
  const { width } = useWindowDimensions();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const mapRef = useRef<any>(null);
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(
    null
  );
  const [isFocus, setIsFocus] = useState(false);
  const insets = useSafeAreaInsets() || {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  const focusOnStore = (store: any) => {
    mapRef.current.animateToRegion(
      {
        latitude: store.latitude,
        longitude: store.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      800
    );
  };

  const dropdownData = stores.map((store) => ({
    label: store.address,
    value: store.id.toString(),
    ...store,
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Animated Header */}
        {/* Header is now handled by the layout wrapper */}

        <Animated.ScrollView
          contentContainerStyle={{
            // Ensure content starts below the parallax header and ends above the tab bar
            paddingBottom: 100 + insets.bottom,
            paddingHorizontal: 16,
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.container}>
            {/* <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backButton,
                { top: insets.top + -40 }, // Adjust the top position based on insets
              ]}
            >
              <Ionicons name="arrow-back" size={28} color="#1a2a39" />
            </TouchableOpacity> */}
            {/* Dropdown at the top */}
            <Dropdown
              style={[styles.dropdown, isFocus && { borderColor: "#007bff" }]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={dropdownData}
              search
              maxHeight={700}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? "Select Store Address" : "..."}
              searchPlaceholder="Search addresses..."
              value={selectedStore?.value}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={(item) => {
                setSelectedStore(item);
                setIsFocus(false);
                focusOnStore(item);
              }}
              renderLeftIcon={() => (
                <AntDesign
                  name="environment"
                  size={20}
                  color={isFocus ? "#007bff" : "#666"}
                  style={styles.icon}
                />
              )}
            />

            {/* Map View */}
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: stores[0].latitude,
                longitude: stores[0].longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              {stores.map((store) => (
                <Marker
                  key={store.id}
                  coordinate={{
                    latitude: store.latitude,
                    longitude: store.longitude,
                  }}
                  title={store.name}
                  description={store.address}
                />
              ))}
            </MapView>

            {/* Store List */}
            <ScrollView style={styles.storeList}>
              {stores.map((store) => (
                <View key={store.id} style={styles.storeListItem}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeAddress}>{store.address}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};
// In your StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  dropdown: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "white",
  },
  icon: {
    marginRight: 8,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#666",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#333",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  // Updated map style with fixed height
  map: {
    height: 500,
    borderRadius: 12,
    marginBottom: 12,
  },
  storeList: {
    maxHeight: "20%",
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 2,
  },
  storeListItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: "#666",
  },
  backButton: {
    position: "absolute",
    left: 16,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent white background
    borderRadius: 25,
    elevation: 3,
    zIndex: 10,
  },
});

export default StoreLocator;
