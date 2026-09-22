import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale } from "react-native-size-matters";
import { getImageSource } from "@/utils/imageUtils";

interface StoryItem {
  id: string | number;
  name: string;
  thumbnail?: any;
  images?: any[];
}

interface StoriesListV2Props {
  collections?: any[];
  onStoryPress?: (item: any, index: number) => void;
}

export const StoriesListV2: React.FC<StoriesListV2Props> = ({
  collections = [],
  onStoryPress,
}) => {
  // Built-in fallback stories matching the mock design
  const defaultStories: StoryItem[] = [
    {
      id: "latest",
      name: "Latest",
      thumbnail: require("../../../assets/images/luxury_gold_ring.png"),
    },
    {
      id: "offers",
      name: "Offers",
      thumbnail: require("../../../assets/images/gold_coin_badge.png"),
    },
    {
      id: "new_arrivals",
      name: "New Arrivals",
      thumbnail: require("../../../assets/images/slider.png"),
    },
    {
      id: "festivals",
      name: "Festivals",
      thumbnail: require("../../../assets/images/slider1.png"),
    },
    {
      id: "schemes",
      name: "Schemes",
      thumbnail: require("../../../assets/images/diamond_coin_badge.png"),
    },
  ];

  const storiesData: StoryItem[] = useMemo(() => {
    if (collections && collections.length > 0) {
      return collections.map((c, i) => ({
        ...c,
        id: c.id || `col_${i}`,
        name: c.name || `Story ${i + 1}`,
        thumbnail: c.thumbnail || c.image || defaultStories[i % defaultStories.length].thumbnail,
      }));
    }
    return defaultStories;
  }, [collections]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >

        {/* Dynamic / Mock Stories with Gold Border */}
        {storiesData.map((item, index) => (
          <TouchableOpacity
            key={item.id.toString()}
            style={styles.storyItem}
            onPress={() => onStoryPress?.(item, index)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#BF953F", "#FCF6BA", "#B38728", "#FBF5B7", "#AA771C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goldRing}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={
                    typeof item.thumbnail === "string"
                      ? getImageSource(item.thumbnail) ?? require("../../../assets/images/luxury_gold_ring.png")
                      : item.thumbnail || require("../../../assets/images/luxury_gold_ring.png")
                  }
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </View>
            </LinearGradient>
            <Text style={styles.storyLabel} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: moderateScale(10),
  },
  scrollContainer: {
    paddingHorizontal: moderateScale(14),
    gap: moderateScale(14),
    alignItems: "center",
  },
  storyItem: {
    alignItems: "center",
    width: moderateScale(68),
  },
  goldRing: {
    width: moderateScale(62),
    height: moderateScale(62),
    borderRadius: moderateScale(31),
    padding: moderateScale(2.5),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#B38728",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(28),
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  storyLabel: {
    marginTop: moderateScale(6),
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
  },
});

export default StoriesListV2;
