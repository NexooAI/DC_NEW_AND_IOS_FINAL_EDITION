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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { useFocusEffect } from "@react-navigation/native";
import useGlobalStore from "@/store/global.store";

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
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
            <ImageBackground
              source={require("../../../../../assets/images/shop.jpg")}
              style={styles.imageBackground}
            >
              <View style={styles.headerContainer}>
                <Text style={styles.headerText}>{t("ourStoresTitle")}</Text>
              </View>
            </ImageBackground>

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
                  color={isFocus ? "#007bff" : "#666"}
                  style={styles.icon}
                />
              )}
            />

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

            <View style={styles.storeList}>
              {stores.map((store) => (
                <View key={store.id} style={styles.storeListItem}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeAddress}>
                    {store.address}
                  </Text>
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
  imageBackground: {
    height: 200,
    justifyContent: "flex-end",
    padding: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  headerContainer: {
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 12,
    borderRadius: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
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
  placeholderStyle: {
    color: "#666",
    fontSize: 16,
  },
  selectedTextStyle: {
    color: "#333",
    fontSize: 16,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  icon: {
    marginRight: 8,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  map: {
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  storeList: {
    marginBottom: 20,
  },
  storeListItem: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

export default StoreLocator;
