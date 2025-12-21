import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  date: string;
  isRead: boolean;
}

interface FlashNewsProps {
  news?: NewsItem[];
  onNewsPress?: (news: NewsItem) => void;
}

const FlashNews: React.FC<FlashNewsProps> = ({ news = [], onNewsPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const { screenWidth } = useResponsiveLayout();

  // Sample news data if none provided
  const sampleNews: NewsItem[] = [
    {
      id: "1",
      title: "Gold prices hit new high!",
      description:
        "Gold prices have reached a new all-time high in the market.",
      date: "2024-01-15",
      isRead: false,
    },
    {
      id: "2",
      title: "New savings scheme launched",
      description:
        "Introducing our latest gold savings scheme with better returns.",
      date: "2024-01-14",
      isRead: false,
    },
    {
      id: "3",
      title: "Market update: Silver trends",
      description: "Latest updates on silver market trends and predictions.",
      date: "2024-01-13",
      isRead: false,
    },
  ];

  const displayNews = news.length > 0 ? news : sampleNews;

  useEffect(() => {
    if (displayNews.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === displayNews.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [displayNews.length, isPaused]);

  useEffect(() => {
    if (displayNews.length <= 1) return;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-scroll to current item
    if (scrollViewRef.current && screenWidth) {
      scrollViewRef.current.scrollTo({
        x: currentIndex * (screenWidth - 32),
        animated: true,
      });
    }
  }, [currentIndex, fadeAnim, displayNews.length]);

  const handleNewsPress = (item: NewsItem) => {
    if (onNewsPress) {
      onNewsPress(item);
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  if (displayNews.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.redDarker]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.icon}>📰</Text>
            <Text style={styles.title}>Flash News</Text>
          </View>
          <TouchableOpacity
            onPress={handlePauseToggle}
            style={styles.pauseButton}
          >
            <Text style={styles.pauseIcon}>{isPaused ? "▶️" : "⏸️"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.newsContainer}
          onMomentumScrollEnd={(event) => {
            if (screenWidth) {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / (screenWidth - 32)
              );
              setCurrentIndex(newIndex);
            }
          }}
        >
          {displayNews.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.newsItem}
              onPress={() => handleNewsPress(item)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.newsContent,
                  { opacity: index === currentIndex ? fadeAnim : 1 },
                ]}
              >
                <View style={styles.newsHeader}>
                  <Text style={styles.newsTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.newsMeta}>
                    <Text style={styles.newsDate}>{item.date}</Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                </View>
                <Text style={styles.newsDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {displayNews.length > 1 && (
          <View style={styles.pagination}>
            {displayNews.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.white,
  },
  pauseButton: {
    padding: 4,
  },
  pauseIcon: {
    fontSize: 16,
  },
  newsContainer: {
    height: 80,
  },
  newsItem: {
    width: 300, // Fixed width instead of percentage
    marginRight: 16,
  },
  newsContent: {
    flex: 1,
    justifyContent: "center",
  },
  newsHeader: {
    marginBottom: 4,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.white,
    marginBottom: 4,
    lineHeight: 18,
  },
  newsMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  newsDate: {
    fontSize: 12,
    color: theme.colors.gold,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.gold,
  },
  newsDescription: {
    fontSize: 12,
    color: theme.colors.white,
    opacity: 0.9,
    lineHeight: 16,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.white,
    opacity: 0.5,
    marginHorizontal: 3,
  },
  paginationDotActive: {
    opacity: 1,
    backgroundColor: theme.colors.gold,
  },
});

export default FlashNews;
