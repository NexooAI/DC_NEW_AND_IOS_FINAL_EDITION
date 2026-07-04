import React, {
  useRef,
  useState,
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
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { theme } from "@/constants/theme";
import { APP_CONFIG } from "@/constants";
import { useTranslation } from "@/hooks/useTranslation";
import { useFocusEffect } from "@react-navigation/native";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { LinearGradient } from "expo-linear-gradient";
import api from "@/services/api";
import { fetchBranchesWithCache } from "@/utils/apiCache";

interface Store {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  location_url?: string;
  phone?: string;
  city?: string;
  state?: string;
}

let MapView: React.ComponentType<any>, Marker: React.ComponentType<any>;
if (Platform.OS === "web") {
  MapView = (props: any) => (
    <View
      style={{
        width: "100%",
        height: 300,
        backgroundColor: theme.colors.backgroundSecondary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text>Map not supported on web</Text>
    </View>
  );
  Marker = () => null;
} else {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
}

const StoreLocator = () => {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { t } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [storesList, setStoresList] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [isFocus, setIsFocus] = useState(false);
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();

  const parseCoordinates = (url: string) => {
    if (!url) return null;

    // 1. Try parsing marker coordinates from standard Google Maps URLs (e.g. !3d10.519758!4d76.22341)
    const exactMatch = url.match(/3d(-?\d+\.\d+)[^!]*!4d(-?\d+\.\d+)/);
    if (exactMatch) {
      return {
        latitude: parseFloat(exactMatch[1]),
        longitude: parseFloat(exactMatch[2]),
      };
    }

    // 2. Try parsing query param format like q=latitude,longitude or query=latitude,longitude or @latitude,longitude
    const queryMatch = url.match(/(?:q|query|@|place\/)(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/i);
    if (queryMatch) {
      return {
        latitude: parseFloat(queryMatch[1]),
        longitude: parseFloat(queryMatch[2]),
      };
    }

    // 3. Fallback to any latitude,longitude pair in the string
    const genericMatch = url.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (genericMatch) {
      return {
        latitude: parseFloat(genericMatch[1]),
        longitude: parseFloat(genericMatch[2]),
      };
    }

    return null;
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const branchData = await fetchBranchesWithCache() || [];

      const mappedStores: Store[] = branchData.map((branch: any) => {
        const locationUrl = branch.location || branch.location_url || "";
        const parsedCoords = parseCoordinates(locationUrl);
        const lat = parseFloat(branch.latitude) || parsedCoords?.latitude || 10.519306421007363;
        const lng = parseFloat(branch.longitude) || parsedCoords?.longitude || 76.22348998262478;

        return {
          id: branch.id,
          name: branch.branch_name || APP_CONFIG.appName,
          latitude: lat,
          longitude: lng,
          address: branch.address || "",
          location_url: locationUrl,
          phone: branch.phone || "",
          city: branch.city || "",
          state: branch.state || "",
        };
      });

      setStoresList(mappedStores);

      if (mappedStores.length > 0) {
        const firstStore = {
          label: mappedStores[0].name + (mappedStores[0].city ? ` - ${mappedStores[0].city}` : ""),
          value: mappedStores[0].id.toString(),
          ...mappedStores[0],
        };
        setSelectedStore(firstStore);
      }
    } catch (error) {
      console.error("Error fetching branches for StoreLocator:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBranches();
    }, [])
  );

  const focusOnStore = (store: Store) => {
    if (mapRef.current && store) {
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
    if (store.location_url) {
      Linking.openURL(store.location_url).catch(() => {
        openFallbackDirections(store);
      });
    } else {
      openFallbackDirections(store);
    }
  };

  const openFallbackDirections = (store: Store) => {
    const url = Platform.select({
      ios: `maps:${store.latitude},${store.longitude}?q=${store.name}`,
      android: `geo:${store.latitude},${store.longitude}?q=${store.latitude},${store.longitude}(${store.name})`,
      web: `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`,
    });
    Linking.openURL(url || "");
  };

  const dropdownData = storesList.map((store) => ({
    label: store.name + (store.city ? ` - ${store.city}` : ""),
    value: store.id.toString(),
    ...store,
  }));

  useEffect(() => {
    if (storesList.length > 0 && selectedStore) {
      const selected = storesList.find(s => s.id.toString() === selectedStore.value);
      if (selected) {
        focusOnStore(selected);
      }
    }
  }, [selectedStore, storesList]);

  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <Stack.Screen options={{ title: t("ourBranches") || "Our Branches" }} />
      <View style={styles.container}>
        {/* Header */}
        {/* <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("ourStoresTitle") || "Our Stores"}</Text>
          <View style={{ width: 24 }} />
        </View> */}

        {/* Map View */}
        <View style={styles.mapContainer}>
          {storesList.length > 0 ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: selectedStore?.latitude || storesList[0].latitude,
                longitude: selectedStore?.longitude || storesList[0].longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              {storesList.map((store) => {
                const isSelected = selectedStore?.value === store.id.toString();
                return (
                  <Marker
                    key={store.id}
                    coordinate={{
                      latitude: store.latitude,
                      longitude: store.longitude,
                    }}
                    title={store.name}
                    description={store.address}
                    pinColor={isSelected ? "red" : "orange"}
                  />
                );
              })}
            </MapView>
          ) : (
            <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }]}>
              <ActivityIndicator size="large" color={theme.colors.secondary} />
            </View>
          )}
        </View>

        {/* Floating Store Carousel Overlay */}
        {storesList.length > 0 && (
          <View style={styles.carouselOverlay}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
              snapToInterval={280 + 16}
              decelerationRate="fast"
            >
              {storesList.map((store) => {
                const isSelected = selectedStore?.value === store.id.toString();
                return (
                  <TouchableOpacity
                    key={store.id}
                    activeOpacity={0.9}
                    style={[
                      styles.storeCard,
                      isSelected && styles.storeCardSelected,
                    ]}
                    onPress={() => {
                      const item = {
                        label: store.name + (store.city ? ` - ${store.city}` : ""),
                        value: store.id.toString(),
                        ...store,
                      };
                      setSelectedStore(item);
                    }}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Ionicons
                        name="business"
                        size={20}
                        color={isSelected ? theme.colors.primary : "#777"}
                      />
                      <Text style={[styles.cardTitleText, isSelected && { color: theme.colors.textDark }]} numberOfLines={1}>
                        {store.name}
                      </Text>
                    </View>

                    <Text style={styles.cardAddressText} numberOfLines={2}>
                      {store.address}
                    </Text>

                    {store.phone ? (
                      <View style={styles.cardPhoneRow}>
                        <Ionicons name="call" size={14} color="#777" />
                        <Text style={styles.cardPhoneText}>{store.phone}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={styles.cardDirectionsBtn}
                      onPress={() => getDirections(store)}
                    >
                      <Ionicons name="navigate-circle" size={20} color="#fff" />
                      <Text style={styles.cardDirectionsBtnText}>{t("getDirections") || "Directions"}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </AppLayoutWrapper>
  );
};

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.quaternary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.quaternary,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  mapContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  carouselOverlay: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    paddingVertical: 10,
    zIndex: 10,
  },
  carouselContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 16,
  },
  storeCard: {
    width: 280,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.05)",
  },
  storeCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textDark,
    flex: 1,
  },
  cardAddressText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    height: 36,
    marginBottom: 8,
  },
  cardPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  cardPhoneText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  cardDirectionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  cardDirectionsBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
}) }

var styles = getStyles(theme);;

export default StoreLocator;
