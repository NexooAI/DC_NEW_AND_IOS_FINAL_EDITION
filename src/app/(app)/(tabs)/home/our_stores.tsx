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
  Platform,
  TouchableOpacity,
  Linking,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { APP_CONFIG } from "@/constants";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore, { useAppTheme } from "@/store/global.store";
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

// Safe resolution for react-native-maps across platforms & bundlers
let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS === "web") {
  MapView = ({ children, style }: any) => (
    <View
      style={[
        style,
        {
          width: "100%",
          height: "100%",
          backgroundColor: "#e5e5e5",
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text style={{ color: "#666" }}>Map view is not supported on web</Text>
    </View>
  );
  Marker = () => null;
} else {
  try {
    const maps = require("react-native-maps");
    MapView = maps.default || maps;
    Marker = maps.Marker || maps.default?.Marker || MapView?.Marker || (() => null);
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (err) {
    console.error("Failed to load react-native-maps:", err);
    MapView = ({ children, style }: any) => (
      <View style={[style, { flex: 1, backgroundColor: "#e5e5e5", alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: "#666" }}>Unable to load map</Text>
      </View>
    );
    Marker = () => null;
  }
}

// Default initial store so map renders immediately without waiting for API
const DEFAULT_STORE: Store = {
  id: 13,
  name: "Alangulam",
  latitude: 9.3670161,
  longitude: 77.6756121,
  address: "3/487 Tnc Mukku Road, Alangulam - 626127",
  location_url: "https://maps.app.goo.gl/cV31NWeFCLkKGFr79",
  phone: "87548429999",
  city: "Alangulam",
  state: "Tamilnadu",
};

const StoreLocator = () => {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const { t } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const insets = useSafeAreaInsets();

  const [storesList, setStoresList] = useState<Store[]>([DEFAULT_STORE]);
  const [selectedStore, setSelectedStore] = useState<any>({
    label: "Alangulam",
    value: "13",
    ...DEFAULT_STORE,
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Request user location to compute live distance to stores
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const lastLoc = await Location.getLastKnownPositionAsync({});
          if (lastLoc?.coords) {
            setUserLocation({
              latitude: lastLoc.coords.latitude,
              longitude: lastLoc.coords.longitude,
            });
          } else {
            const currentLoc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            if (currentLoc?.coords) {
              setUserLocation({
                latitude: currentLoc.coords.latitude,
                longitude: currentLoc.coords.longitude,
              });
            }
          }
        }
      } catch (err) {
        // Location permission denied or unavailable, proceed gracefully
      }
    })();
  }, []);

  // Distance calculation using Haversine formula
  const calculateDistance = (storeLat: number, storeLng: number): string | null => {
    if (!userLocation || !storeLat || !storeLng) return null;
    const R = 6371; // Earth radius in km
    const dLat = (storeLat - userLocation.latitude) * (Math.PI / 180);
    const dLon = (storeLng - userLocation.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.latitude * (Math.PI / 180)) *
        Math.cos(storeLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
  };

  const parseCoordinates = (url: string) => {
    if (!url) return null;

    // 1. Standard Google Maps URLs (e.g. !3d10.519758!4d76.22341)
    const exactMatch = url.match(/3d(-?\d+\.\d+)[^!]*!4d(-?\d+\.\d+)/);
    if (exactMatch) {
      return {
        latitude: parseFloat(exactMatch[1]),
        longitude: parseFloat(exactMatch[2]),
      };
    }

    // 2. Query param format like q=latitude,longitude or query=latitude,longitude or @latitude,longitude
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

  // Automatically resolves short or long Google Maps links for any branch added by admin
  const resolveCoordinates = async (
    locationUrl: string,
    branch: any
  ): Promise<{ latitude: number; longitude: number }> => {
    let lat = parseFloat(branch.latitude);
    let lng = parseFloat(branch.longitude);

    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { latitude: lat, longitude: lng };
    }

    if (locationUrl) {
      // 1. Check if coordinates are directly in the URL
      let coords = parseCoordinates(locationUrl);
      if (coords) return coords;

      // 2. If it's a shortened Google Maps URL (maps.app.goo.gl or goo.gl), resolve the redirect!
      if (locationUrl.includes("goo.gl") || locationUrl.includes("maps.app")) {
        try {
          const response = await fetch(locationUrl, {
            method: "HEAD",
            redirect: "follow",
          });
          if (response?.url) {
            coords = parseCoordinates(response.url);
            if (coords) return coords;
          }
        } catch (err) {
          console.warn("Could not resolve short URL for branch:", locationUrl, err);
        }
      }
    }

    // Fallback based on known branches or APP_CONFIG
    const isAlangulam =
      branch.city?.toLowerCase().includes("alangulam") ||
      branch.branch_name?.toLowerCase().includes("alangulam") ||
      locationUrl.includes("cV31NWeFCLkKGFr79");

    return {
      latitude: isAlangulam ? 9.3670161 : (APP_CONFIG.latitude || 8.427828080550306),
      longitude: isAlangulam ? 77.6756121 : (APP_CONFIG.longitude || 78.02855977120382),
    };
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const branchData = await fetchBranchesWithCache() || [];

      if (Array.isArray(branchData) && branchData.length > 0) {
        const resolvedStores = await Promise.all(
          branchData.map(async (branch: any) => {
            const locationUrl = branch.location || branch.location_url || "";
            const coords = await resolveCoordinates(locationUrl, branch);

            return {
              id: branch.id || Math.random(),
              name: branch.branch_name || APP_CONFIG.appName,
              latitude: coords.latitude,
              longitude: coords.longitude,
              address: branch.address || "",
              location_url: locationUrl,
              phone: branch.phone || "",
              city: branch.city || "",
              state: branch.state || "",
            };
          })
        );

        if (resolvedStores.length > 0) {
          setStoresList(resolvedStores);
          setSelectedStore({
            label: resolvedStores[0].name + (resolvedStores[0].city ? ` - ${resolvedStores[0].city}` : ""),
            value: resolvedStores[0].id.toString(),
            ...resolvedStores[0],
          });
        }
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
    const lat = Number(store?.latitude);
    const lng = Number(store?.longitude);
    if (mapRef.current && isMapReady && !isNaN(lat) && !isNaN(lng) && lat !== 0) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          },
          800
        );
      } catch (err) {
        console.warn("animateToRegion error:", err);
      }
    }
  };

  const getDirections = (store: Store) => {
    const locUrl = store.location_url;
    if (locUrl) {
      Linking.canOpenURL(locUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(locUrl).catch(() => openFallbackDirections(store));
          } else {
            openFallbackDirections(store);
          }
        })
        .catch(() => {
          openFallbackDirections(store);
        });
    } else {
      openFallbackDirections(store);
    }
  };

  const openFallbackDirections = (store: Store) => {
    const lat = store.latitude;
    const lng = store.longitude;
    const label = encodeURIComponent(store.name || "Store");
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    if (Platform.OS === "android") {
      const geoUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
      Linking.canOpenURL(geoUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(geoUrl).catch(() => Linking.openURL(webUrl));
          } else {
            Linking.openURL(webUrl);
          }
        })
        .catch(() => {
          Linking.openURL(webUrl);
        });
    } else if (Platform.OS === "ios") {
      const appleMapsUrl = `maps:0,0?q=${label}@${lat},${lng}`;
      Linking.canOpenURL(appleMapsUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(appleMapsUrl).catch(() => Linking.openURL(webUrl));
          } else {
            Linking.openURL(webUrl);
          }
        })
        .catch(() => {
          Linking.openURL(webUrl);
        });
    } else {
      Linking.openURL(webUrl);
    }
  };

  useEffect(() => {
    if (isMapReady && storesList.length > 0 && selectedStore) {
      const selected = storesList.find(s => s.id.toString() === selectedStore.value?.toString() || s.id === selectedStore.id);
      if (selected) {
        focusOnStore(selected);
      }
    }
  }, [isMapReady, selectedStore, storesList]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      {/* 1. 100% Full-Screen Interactive Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={Platform.OS === "android" ? (PROVIDER_GOOGLE || "google") : undefined}
          style={styles.map}
          initialRegion={{
            latitude: Number(selectedStore?.latitude) || DEFAULT_STORE.latitude,
            longitude: Number(selectedStore?.longitude) || DEFAULT_STORE.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsCompass={true}
          showsMyLocationButton={false}
          showsUserLocation={!!userLocation}
          onMapReady={() => {
            console.log("[StoreLocator] Native Map Ready");
            setIsMapReady(true);
          }}
        >
          {storesList.map((store) => {
            const lat = Number(store.latitude);
            const lng = Number(store.longitude);
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
            const isSelected = selectedStore?.value === store.id.toString() || selectedStore?.id === store.id;
            return (
              <Marker
                key={store.id}
                coordinate={{
                  latitude: lat,
                  longitude: lng,
                }}
                title={store.name}
                description={store.address}
                pinColor={isSelected ? "red" : "orange"}
                onPress={() => {
                  const item = {
                    label: store.name + (store.city ? ` - ${store.city}` : ""),
                    value: store.id.toString(),
                    ...store,
                  };
                  setSelectedStore(item);
                  focusOnStore(store);
                }}
              />
            );
          })}
        </MapView>
      </View>

      {/* 2. Floating Top Header with Glassmorphic Style */}
      <View style={[styles.floatingHeader, { top: insets.top + (Platform.OS === 'ios' ? 8 : 14) }]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(app)/(tabs)/home");
            }
          }}
          style={styles.floatingBackButton}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.textDark} />
        </TouchableOpacity>

        <View style={styles.floatingTitleCard}>
          <Ionicons name="location-sharp" size={18} color={theme.colors.primary} />
          <Text style={styles.floatingTitleText}>{t("ourStores") || "Our Stores"}</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* 3. Floating Bottom Store Carousel */}
      {storesList.length > 0 && (
        <View style={[styles.carouselOverlay, { bottom: insets.bottom + (Platform.OS === 'ios' ? 24 : 16) }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={290 + 16}
            decelerationRate="fast"
          >
            {storesList.map((store) => {
              const isSelected = selectedStore?.value === store.id.toString() || selectedStore?.id === store.id;
              const distanceText = calculateDistance(store.latitude, store.longitude);

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
                    focusOnStore(store);
                  }}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIconBox, isSelected && { backgroundColor: theme.colors.primary + '18' }]}>
                      <Ionicons
                        name="business"
                        size={18}
                        color={isSelected ? theme.colors.primary : "#666"}
                      />
                    </View>
                    <Text style={[styles.cardTitleText, isSelected && { color: theme.colors.primary }]} numberOfLines={1}>
                      {store.name}
                    </Text>

                    {distanceText ? (
                      <View style={styles.distanceBadge}>
                        <Ionicons name="navigate" size={11} color={theme.colors.primary} />
                        <Text style={styles.distanceBadgeText}>{distanceText}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.cardAddressText} numberOfLines={2}>
                    {store.address}
                  </Text>

                  {store.phone ? (
                    <TouchableOpacity
                      style={styles.cardPhoneRow}
                      onPress={() => Linking.openURL(`tel:${store.phone}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call" size={14} color={theme.colors.primary} />
                      <Text style={styles.cardPhoneText}>{store.phone}</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.cardDirectionsBtn}
                    onPress={() => getDirections(store)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate-circle" size={18} color="#fff" />
                    <Text style={styles.cardDirectionsBtnText}>{t("getDirections") || "Directions"}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      position: "relative",
      backgroundColor: theme.colors.background,
    },
    mapContainer: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    map: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    floatingHeader: {
      position: "absolute",
      left: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 20,
      elevation: 8,
    },
    floatingBackButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
    },
    floatingTitleCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#ffffff",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 22,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
    },
    floatingTitleText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.textDark,
    },
    headerSpacer: {
      width: 44,
    },
    carouselOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      paddingVertical: 10,
      zIndex: 20,
      elevation: 8,
    },
    carouselContainer: {
      paddingLeft: 16,
      paddingRight: 16,
      gap: 16,
    },
    storeCard: {
      width: 290,
      backgroundColor: "#ffffff",
      borderRadius: 20,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 1.5,
      borderColor: "rgba(0,0,0,0.06)",
    },
    storeCardSelected: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    cardIconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(0,0,0,0.04)",
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitleText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.textDark,
      flex: 1,
    },
    distanceBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: theme.colors.primary + "14",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    distanceBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.primary,
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
      fontSize: 13,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    cardDirectionsBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      paddingVertical: 9,
      borderRadius: 12,
      gap: 6,
    },
    cardDirectionsBtnText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "700",
    },
  });
}

export default StoreLocator;
