import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import BottomSheet from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { logger } from "@/utils/logger";
interface LocationData {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  image: any;
}

// Sample data for locations
const locations: LocationData[] = [
  {
    id: 1,
    title: "Central Park",
    description: "Large urban park in Manhattan",
    latitude: 40.785091,
    longitude: -73.968285,
    image: require("../../assets/images/central-park.jpg"),
  },
  {
    id: 2,
    title: "Empire State Building",
    description: "102-story Art Deco skyscraper",
    latitude: 40.748817,
    longitude: -73.985428,
    image: require("../../assets/images/empire-state.jpg"),
  },
  // Add more locations as needed
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const snapPoints = React.useMemo(() => ["25%", "50%"], []);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<any>(null);

  let MapView, Marker, PROVIDER_GOOGLE;
  if (Platform.OS === "web") {
    MapView = (props: any) => (
      <div
        style={{
          width: "100%",
          height: "80%",
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
    PROVIDER_GOOGLE = undefined;
  } else {
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  }

  // Get user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        logger.error("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  const handleMarkerPress = (location: LocationData) => {
    setSelectedLocation(location);
    bottomSheetRef.current?.expand();
  };

  const handleCenterButtonPress = () => {
    if (userLocation) {
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={userLocation}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            onPress={() => handleMarkerPress(location)}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require("../../assets/images/map-pin.png")}
                style={[
                  styles.markerImage,
                  selectedLocation?.id === location.id && styles.selectedMarker,
                ]}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Center Position Button */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={handleCenterButtonPress}
      >
        <Image
          source={require("../../assets/images/center-location.png")}
          style={styles.centerButtonIcon}
        />
      </TouchableOpacity>

      {/* Bottom Sheet for Details */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        bottomInset={insets.bottom} // Add this prop
        style={styles.bottomSheet}
        backgroundComponent={({ style }) => (
          <View style={[style, styles.bottomSheetBackground]} />
        )}
      >
        <View style={styles.bottomSheetContent}>
          {selectedLocation ? (
            <>
              <Image
                source={selectedLocation.image}
                style={styles.locationImage}
              />
              <Text style={styles.locationTitle}>{selectedLocation.title}</Text>
              <Text style={styles.locationDescription}>
                {selectedLocation.description}
              </Text>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => {
                  /* Add navigation logic */
                }}
              >
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noSelectionText}>
              Select a location to view details
            </Text>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "80%",
  },
  markerContainer: {
    alignItems: "center",
  },
  markerImage: {
    width: 40,
    height: 40,
    tintColor: "#FF5A5F",
  },
  selectedMarker: {
    tintColor: "#007AFF",
    width: 50,
    height: 50,
  },
  centerButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButtonIcon: {
    width: 30,
    height: 30,
    tintColor: "#007AFF",
  },
  bottomSheetBackground: {
    backgroundColor: "white",
    borderRadius: 20,
  },
  bottomSheetContent: {
    padding: 20,
  },
  locationImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginBottom: 15,
  },
  locationTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  locationDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  directionsButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  directionsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  noSelectionText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  bottomSheet: {
    // Add shadow/elevation for Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
});
