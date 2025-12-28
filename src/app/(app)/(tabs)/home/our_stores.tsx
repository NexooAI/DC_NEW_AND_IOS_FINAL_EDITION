import React, {
  useRef,
  useState,
  RefObject,
  useCallback,
  useEffect,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Linking,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { useFocusEffect } from "@react-navigation/native";
import useGlobalStore from "@/store/global.store";
import { LinearGradient } from "expo-linear-gradient";

interface Store {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

const stores: Store[] = [
  {
    id: 1,
    name: "DC Jewellers",
    latitude: 10.519306421007363,
    longitude: 76.22348998262478,
    address: "Road Fathima Nagar, Mission Quarters, Anchery, Thrissur, Kerala 680005",
  },
];

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

const StoreLocator = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(
    stores.length > 0
      ? {
          label: stores[0].address,
          value: stores[0].id.toString(),
          ...stores[0],
        }
      : null
  );
  const [isFocus, setIsFocus] = useState(false);
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();

  const focusOnStore = (store: Store) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: store.latitude,
          longitude: store.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        800
      );
    }
  };

  const getDirections = (store: Store) => {
    const url = Platform.select({
      ios: `maps:${store.latitude},${store.longitude}?q=${store.name}`,
      android: `geo:${store.latitude},${store.longitude}?q=${store.latitude},${store.longitude}(${store.name})`,
      web: `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`,
    });
    Linking.openURL(url || "");
  };

  // Memoized translation for store addresses
  const dropdownData = stores.map((store) => ({
    label: t(`store_address_${store.id}`) || store.address,
    value: store.id.toString(),
    ...store,
  }));

  // Update selectedStore if language changes
  React.useEffect(() => {
    if (stores.length > 0) {
      const firstStore = {
        label: t(`store_address_${stores[0].id}`) || stores[0].address,
        value: stores[0].id.toString(),
        ...stores[0],
      };
      setSelectedStore(firstStore);
      focusOnStore(firstStore); // Focus map on first store when language changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);


  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
            <ImageBackground
              source={require("../../../../../assets/images/shop.jpg")}
              style={styles.imageBackground}
            >
              <View style={styles.headerContainer}>
                 <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.headerGradient}
                  >
                  <Text style={styles.headerText}>{t("ourStoresTitle")}</Text>
                </LinearGradient>
              </View>
            </ImageBackground>

            <View style={styles.dropdownContainer}>
                <Text style={styles.sectionLabel}>{t("selectStore") || "Select a Store"}</Text>
                <Dropdown
                style={[styles.dropdown, isFocus && { borderColor: theme.colors.primary }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={dropdownData}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? t("selectStoreAddress") : "..."}
                searchPlaceholder={t("searchAddresses")}
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
                    color={isFocus ? theme.colors.primary : "#666"}
                    style={styles.icon}
                    />
                )}
                />
            </View>

            <View style={styles.mapContainer}>
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
            </View>

            <View style={styles.storeList}>
              {stores.map((store) => (
                <View key={store.id} style={styles.storeListItem}>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <Text style={styles.storeAddress}>
                        {store.address}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.directionButton} 
                    onPress={() => getDirections(store)}
                  >
                     <Ionicons name="navigate-circle" size={40} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AppLayoutWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  imageBackground: {
    height: 220,
    justifyContent: "flex-end",
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 20,
  },
  headerContainer: {
    overflow: "hidden",
  },
  headerGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  dropdownContainer: {
      marginBottom: 20,
  },
  sectionLabel: {
      fontSize: 14, 
      fontWeight: '600',
      color: theme.colors.textMediumGrey,
      marginBottom: 8,
      marginLeft: 4,
      textTransform: "uppercase",
  },
  dropdown: {
    height: 56,
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  placeholderStyle: {
    color: "#888",
    fontSize: 15,
  },
  selectedTextStyle: {
    color: theme.colors.textDarkGrey,
    fontSize: 15,
    fontWeight: "600",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    color: "#333",
    borderRadius: 8,
  },
  icon: {
    marginRight: 10,
  },
  iconStyle: {
    width: 24,
    height: 24,
    tintColor: theme.colors.primary,
  },
  mapContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 4, 
  },
  map: {
    height: 320,
    borderRadius: 20,
  },
  storeList: {
    marginBottom: 30,
    gap: 16,
  },
  storeListItem: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)'
  },
  storeInfo: {
      flex: 1,
      marginRight: 12,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 6,
  },
  storeAddress: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  directionButton: {
      padding: 4,
  }
});

export default StoreLocator;
