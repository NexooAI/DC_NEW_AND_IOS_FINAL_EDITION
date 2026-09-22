import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { getImageSource } from "@/utils/imageUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BannerItem {
  id: string | number;
  image?: any;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  link?: string;
}

interface BannerSliderV2Props {
  banners?: any[];
  onBannerPress?: (banner: any) => void;
}

export const BannerSliderV2: React.FC<BannerSliderV2Props> = ({
  banners = [],
  onBannerPress,
}) => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const cardWidth = SCREEN_WIDTH - moderateScale(32);
  const cardHeight = moderateScale(165);
  const gap = moderateScale(12);

  // Default luxury banner slide matching the mock image
  const defaultBanners: BannerItem[] = [
    {
      id: "featured_1",
      title: "Tradition Shines Forever",
      subtitle: "Pure Jewellery | Trusted Schemes\nA Brighter Tomorrow",
      ctaText: "Explore Now",
      link: "/(app)/(tabs)/home/schemes",
      image: require("../../../assets/images/slider.png"),
    },
    {
      id: "featured_2",
      title: "Special Gold Savings",
      subtitle: "Join Today & Get Extra Gold Benefits\nZero Making Charges",
      ctaText: "View Schemes",
      link: "/(app)/(tabs)/home/schemes",
      image: require("../../../assets/images/slider1.png"),
    },
  ];

  const items: BannerItem[] = useMemo(() => {
    if (banners && banners.length > 0) {
      return banners.map((b, i) => ({
        id: b.id || `b_${i}`,
        title: b.title || "Tradition Shines Forever",
        subtitle: b.description || "Pure Jewellery | Trusted Schemes",
        ctaText: "Explore Now",
        link: b.actionUrl || "/(app)/(tabs)/home/schemes",
        image: b.image || b.image_url || defaultBanners[i % defaultBanners.length].image,
      }));
    }
    return defaultBanners;
  }, [banners]);

  const totalItems = items.length;

  // Auto-scroll
  useEffect(() => {
    if (totalItems <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % totalItems;
        scrollViewRef.current?.scrollTo({
          x: next * (cardWidth + gap),
          animated: true,
        });
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [totalItems, cardWidth, gap]);

  const handlePress = (item: BannerItem) => {
    if (onBannerPress) {
      onBannerPress(item);
    } else if (item.link) {
      router.push(item.link as any);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + gap}
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: moderateScale(16) },
        ]}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / (cardWidth + gap)
          );
          setCurrentIndex(Math.min(Math.max(0, index), totalItems - 1));
        }}
      >
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.id.toString()}
            style={[
              styles.card,
              {
                width: cardWidth,
                height: cardHeight,
                marginRight: idx === totalItems - 1 ? 0 : gap,
              },
            ]}
            onPress={() => handlePress(item)}
            activeOpacity={0.92}
          >
            {/* Clean Banner Image */}
            <Image
              source={
                typeof item.image === "string"
                  ? getImageSource(item.image) ?? require("../../../assets/images/slider.png")
                  : item.image || require("../../../assets/images/slider.png")
              }
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dots Indicator */}
      {totalItems > 1 && (
        <View style={styles.dotsContainer}>
          {items.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: moderateScale(8),
  },
  scrollContent: {
    alignItems: "center",
  },
  card: {
    borderRadius: moderateScale(18),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: moderateScale(8),
    gap: moderateScale(5),
  },
  dot: {
    height: moderateScale(5),
    borderRadius: moderateScale(2.5),
  },
  activeDot: {
    width: moderateScale(16),
    backgroundColor: "#C59B27",
  },
  inactiveDot: {
    width: moderateScale(5),
    backgroundColor: "#CBD5E1",
  },
});

export default BannerSliderV2;
