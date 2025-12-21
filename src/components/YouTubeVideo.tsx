import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import YoutubePlayer from "react-native-youtube-iframe";
import { theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { moderateScale } from "react-native-size-matters";
import { useTranslation } from "@/hooks/useTranslation";
import { LinearGradient } from "expo-linear-gradient";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { wp, hp, rf } from "@/utils/responsiveUtils";

import { logger } from "@/utils/logger";
interface Video {
  id: number;
  title: string;
  video_url?: string;
  url?: string | null;
  created_at: string;
}

interface YouTubeVideoProps {
  videos?: Video[];
}

const YouTubeVideo: React.FC<YouTubeVideoProps> = ({ videos }) => {
  const { t } = useTranslation();
  const {
    screenWidth,
    screenHeight,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
    getCardWidth,
    getGridColumns,
    getListItemHeight,
  } = useResponsiveLayout();
  const [playing, setPlaying] = useState(false);
  const [videoId, setVideoId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onStateChange = useCallback(
    (state: string) => {
      if (state === "ended") {
        setPlaying(false);
        // Auto-play next video if available
        if (videoList.length > 1) {
          let nextIndex = (currentIndex + 1) % videoList.length;
          let nextVideo = videoList[nextIndex];
          let nextVideoUrl = nextVideo.video_url || nextVideo.url || "";
          let nextVideoId = extractYouTubeVideoId(nextVideoUrl);

          // Find next video with valid URL
          let attempts = 0;
          while (!nextVideoId && attempts < videoList.length) {
            nextIndex = (nextIndex + 1) % videoList.length;
            nextVideo = videoList[nextIndex];
            nextVideoUrl = nextVideo.video_url || nextVideo.url || "";
            nextVideoId = extractYouTubeVideoId(nextVideoUrl);
            attempts++;
          }

          if (nextVideoId) {
            setCurrentIndex(nextIndex);
            setVideoId(nextVideoId);
            setCurrentVideo(nextVideo);
            setPlaying(true);
          }
        }
      }
    },
    [videoList, currentIndex]
  );

  // Function to extract video ID from various YouTube URL formats.
  const extractYouTubeVideoId = (url: string): string => {
    if (!url) return "";
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=))([^?&]+)/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  const initializeVideo = () => {
    try {
      setLoading(true);
      setError("");

      let videoData: Video[] = [];

      // Use provided videos if available and not empty
      if (videos && videos.length > 0) {
        videoData = videos;
        logger.log("Using provided videos:", videoData);
        logger.log(
          "Video URLs found:",
          videoData.map((v) => ({
            id: v.id,
            title: v.title,
            video_url: v.video_url,
            url: v.url,
          }))
        );
      } else {
        // Use the local YouTube URL from theme as fallback
        const localVideoUrl = theme.youtubeUrl;
        const localVideoId = extractYouTubeVideoId(localVideoUrl);

        if (!localVideoId) {
          setError("videoLoadingError");
          return;
        }

        // Create a local video object
        const localVideo: Video = {
          id: 1,
          title: t("DC_Jewellers_Featured_Video"),
          video_url: localVideoUrl,
          created_at: new Date().toISOString(),
        };

        videoData = [localVideo];
        logger.log("Using fallback video from theme:", localVideo);
      }

      // Check if all provided videos have null URLs and use theme fallback
      const hasValidUrls = videoData.some((video) => {
        const videoUrl = video.video_url || video.url;
        return videoUrl && extractYouTubeVideoId(videoUrl);
      });

      if (!hasValidUrls && videoData.length > 0) {
        logger.log(
          "All provided videos have null/invalid URLs, using theme fallback"
        );
        const localVideoUrl = theme.youtubeUrl;
        const localVideoId = extractYouTubeVideoId(localVideoUrl);

        if (localVideoId) {
          // Create a fallback video object
          const fallbackVideo: Video = {
            id: 999,
            title: t("DC_Jewellers_Featured_Video"),
            video_url: localVideoUrl,
            created_at: new Date().toISOString(),
          };

          videoData = [fallbackVideo];
          logger.log("Using theme fallback video:", fallbackVideo);
        }
      }

      // Find the first valid video with a valid URL
      let firstVideo: Video | null = null;
      let extractedVideoId = "";

      logger.log("🔍 Searching for valid videos...");
      for (const video of videoData) {
        const videoUrl = video.video_url || video.url;
        logger.log(`Video ${video.id}: URL = "${videoUrl}"`);

        if (videoUrl) {
          const videoId = extractYouTubeVideoId(videoUrl);
          logger.log(`Video ${video.id}: Extracted ID = "${videoId}"`);

          if (videoId) {
            firstVideo = video;
            extractedVideoId = videoId;
            logger.log(
              `✅ Found valid video: ${video.title} with ID: ${videoId}`
            );
            break;
          }
        } else {
          logger.log(`❌ Video ${video.id} has no URL`);
        }
      }

      if (!firstVideo || !extractedVideoId) {
        logger.log("❌ No valid videos found, showing error");
        setError("videoLoadingError");
        return;
      }

      setVideoList(videoData);
      setVideoId(extractedVideoId);
      setCurrentVideo(firstVideo);
      setCurrentIndex(0);
    } catch (error) {
      logger.error("Error initializing video:", error);
      setError("videoLoadingError");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeVideo();
  }, [videos]);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleNextVideo = () => {
    if (videoList.length > 1) {
      let nextIndex = (currentIndex + 1) % videoList.length;
      let nextVideo = videoList[nextIndex];
      let nextVideoUrl = nextVideo.video_url || nextVideo.url || "";
      let nextVideoId = extractYouTubeVideoId(nextVideoUrl);

      // Find next video with valid URL
      let attempts = 0;
      while (!nextVideoId && attempts < videoList.length) {
        nextIndex = (nextIndex + 1) % videoList.length;
        nextVideo = videoList[nextIndex];
        nextVideoUrl = nextVideo.video_url || nextVideo.url || "";
        nextVideoId = extractYouTubeVideoId(nextVideoUrl);
        attempts++;
      }

      if (nextVideoId) {
        setCurrentIndex(nextIndex);
        setVideoId(nextVideoId);
        setCurrentVideo(nextVideo);
        setPlaying(true);
      }
    }
  };

  const handlePreviousVideo = () => {
    if (videoList.length > 1) {
      let prevIndex =
        currentIndex === 0 ? videoList.length - 1 : currentIndex - 1;
      let prevVideo = videoList[prevIndex];
      let prevVideoUrl = prevVideo.video_url || prevVideo.url || "";
      let prevVideoId = extractYouTubeVideoId(prevVideoUrl);

      // Find previous video with valid URL
      let attempts = 0;
      while (!prevVideoId && attempts < videoList.length) {
        prevIndex = prevIndex === 0 ? videoList.length - 1 : prevIndex - 1;
        prevVideo = videoList[prevIndex];
        prevVideoUrl = prevVideo.video_url || prevVideo.url || "";
        prevVideoId = extractYouTubeVideoId(prevVideoUrl);
        attempts++;
      }

      if (prevVideoId) {
        setCurrentIndex(prevIndex);
        setVideoId(prevVideoId);
        setCurrentVideo(prevVideo);
        setPlaying(true);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
              <Ionicons
                name="play-circle"
                size={rf(24)}
                color={theme.colors.primary}
              />
              <Text style={styles.headerText}>{t("featuredVideo")}</Text>
            </View>
            <View style={styles.headerLine} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading videos...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Check if we should show error state - moved to render logic instead of early return
  const shouldShowError = error || !videoId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Ionicons
              name="play-circle"
              size={rf(24)}
              color={theme.colors.primary}
            />
            <Text style={styles.headerText}>{t("featuredVideo")}</Text>
          </View>
          <View style={styles.headerLine} />
        </View>

        {shouldShowError ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle"
              size={rf(48)}
              color={theme.colors.primary}
            />
            <Text style={styles.errorText}>
              {error === "videoLoadingError"
                ? "No valid video URLs found. Using fallback video."
                : t(error || "videoLoadingError")}
            </Text>
            <Text style={styles.errorSubText}>
              The component will use the default video from theme.js
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={initializeVideo}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.videoContainer}>
            <View style={styles.videoWrapper}>
              <YoutubePlayer
                height={hp(27.5)}
                width={wp(100)}
                play={playing}
                videoId={videoId}
                onChangeState={onStateChange}
                initialPlayerParams={{
                  controls: true,
                  modestbranding: true,
                  rel: 0,
                  showinfo: 0,
                }}
              />
            </View>

            {/* Video Controls */}
            {videoList.length > 1 && (
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handlePreviousVideo}
                >
                  <Ionicons
                    name="play-skip-back"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handlePlayPause}
                >
                  <Ionicons
                    name={playing ? "pause" : "play"}
                    size={24}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleNextVideo}
                >
                  <Ionicons
                    name="play-skip-forward"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Video Info */}
            {currentVideo && (
              <View style={styles.videoInfoContainer}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {currentVideo.title}
                </Text>
                <Text style={styles.videoDate}>
                  {new Date(currentVideo.created_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    width: "100%", // Full width edge-to-edge
    paddingVertical: hp(1.25), // Only vertical padding
  },
  headerContainer: {
    paddingHorizontal: wp(4), // Only horizontal padding for header
    marginBottom: hp(1.875),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1),
  },
  headerText: {
    fontSize: rf(18), // Use RF for responsive font scaling
    fontWeight: "700",
    color: theme.colors.primary,
    marginLeft: wp(2),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerLine: {
    height: 2,
    backgroundColor: theme.colors.gold,
    width: "100%",
    borderRadius: 1,
  },
  videoContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 0, // Remove border radius for edge-to-edge
    padding: wp(0.5), // Minimal padding
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  videoWrapper: {
    borderRadius: 0, // Remove border radius for edge-to-edge
    overflow: "hidden",
    backgroundColor: theme.colors.black,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.5),
  },
  loadingText: {
    fontSize: rf(16), // Use RF for responsive font scaling
    fontWeight: "700",
    color: theme.colors.primary,
    marginLeft: wp(2.5),
  },
  errorContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.5),
  },
  errorText: {
    fontSize: rf(16), // Use RF for responsive font scaling
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: hp(1),
    textAlign: "center",
  },
  errorSubText: {
    fontSize: rf(14),
    color: theme.colors.primary,
    marginBottom: hp(2.5),
    textAlign: "center",
    opacity: 0.8,
  },
  retryButton: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(1.25),
    backgroundColor: theme.colors.primary,
    borderRadius: wp(1.25),
  },
  retryButtonText: {
    fontSize: rf(16), // Use RF for responsive font scaling
    fontWeight: "700",
    color: theme.colors.white,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(1.25),
  },
  controlButton: {
    padding: wp(2.5),
  },
  videoInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(1.25),
  },
  videoTitle: {
    flex: 1,
    fontSize: rf(16), // Use RF for responsive font scaling
    fontWeight: "700",
    color: theme.colors.primary,
    marginRight: wp(2),
  },
  videoDate: {
    fontSize: rf(14), // Use RF for responsive font scaling
    color: theme.colors.primary,
  },
});

export default YouTubeVideo;
