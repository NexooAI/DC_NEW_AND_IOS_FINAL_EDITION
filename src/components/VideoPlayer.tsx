import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  Animated,
  ImageBackground,
} from "react-native";
import { ActivityIndicator } from "react-native";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale } from "react-native-size-matters";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

import { logger } from '@/utils/logger';
interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  channel?: string;
}

const TVStatic = ({ visible }: { visible: boolean }) => {
  const staticAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const staticAnimation = Animated.loop(
        Animated.timing(staticAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      );
      staticAnimation.start();
      return () => staticAnimation.stop();
    }
  }, [visible]);

  const opacity = staticAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  if (!visible) return null;

  return (
    <Animated.View style={[styles.tvStatic, { opacity }]}>
      <View style={styles.staticPattern} />
    </Animated.View>
  );
};

const ScanLines = () => {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scan = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    scan.start();
    return () => scan.stop();
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 300],
  });

  return (
    <Animated.View
      style={[
        styles.scanLine,
        {
          transform: [{ translateY }],
        },
      ]}
    />
  );
};

const TVPowerButton = ({
  isOn,
  onToggle,
}: {
  isOn: boolean;
  onToggle: () => void;
}) => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOn) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();
      return () => glow.stop();
    }
  }, [isOn]);

  return (
    <TouchableOpacity style={styles.powerButton} onPress={onToggle}>
      <Animated.View
        style={[
          styles.powerIndicator,
          {
            backgroundColor: isOn ? "#00FF00" : "#333",
            opacity: isOn ? glowAnim : 1,
          },
        ]}
      />
      <Ionicons name="power" size={16} color={isOn ? "#00FF00" : "#666"} />
    </TouchableOpacity>
  );
};

const TVControls = ({
  channel,
  volume,
  onChannelUp,
  onChannelDown,
  onVolumeUp,
  onVolumeDown,
}: {
  channel: number;
  volume: number;
  onChannelUp: () => void;
  onChannelDown: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
}) => {
  return (
    <View style={styles.tvControlsContainer}>
      {/* Channel Controls */}
      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>CH</Text>
        <TouchableOpacity style={styles.controlButton} onPress={onChannelUp}>
          <Ionicons name="chevron-up" size={12} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.channelDisplay}>
          {channel.toString().padStart(2, "0")}
        </Text>
        <TouchableOpacity style={styles.controlButton} onPress={onChannelDown}>
          <Ionicons name="chevron-down" size={12} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {/* Volume Controls */}
      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>VOL</Text>
        <TouchableOpacity style={styles.controlButton} onPress={onVolumeUp}>
          <Ionicons name="add" size={12} color="#FFD700" />
        </TouchableOpacity>
        <View style={styles.volumeBar}>
          <View style={[styles.volumeFill, { width: `${volume}%` }]} />
        </View>
        <TouchableOpacity style={styles.controlButton} onPress={onVolumeDown}>
          <Ionicons name="remove" size={12} color="#FFD700" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TVPlayButton = ({
  onPress,
  isLoading,
}: {
  onPress: () => void;
  isLoading: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      const rotation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotation.start();
      return () => rotation.stop();
    }
  }, [isLoading]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <TouchableOpacity
      style={styles.tvPlayButton}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isLoading}
    >
      <Animated.View
        style={[
          styles.playButtonCircle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {isLoading ? (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <MaterialIcons
              name="radio-button-checked"
              size={40}
              color="#FFD700"
            />
          </Animated.View>
        ) : (
          <Ionicons name="play" size={40} color="#FFD700" />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const VideoPlayer = ({
  videoUrl,
  title = "Video Channel",
  thumbnail,
  duration = "00:00",
  channel: initialChannel = "Gold TV",
}: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPowered, setIsPowered] = useState(true);
  const [currentChannel, setCurrentChannel] = useState(1);
  const { screenWidth } = useResponsiveLayout();
  const [volume, setVolume] = useState(75);
  const [showStatic, setShowStatic] = useState(false);

  const tvAnim = useRef(new Animated.Value(0)).current;
  const screenFlicker = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(tvAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isPowered) {
      const flicker = Animated.loop(
        Animated.sequence([
          Animated.timing(screenFlicker, {
            toValue: 0.98,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(screenFlicker, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      );
      flicker.start();
      return () => flicker.stop();
    }
  }, [isPowered]);

  const handleOpenVideo = async () => {
    if (!isPowered) return;

    try {
      setIsLoading(true);
      setError(null);
      setShowStatic(true);

      await new Promise((resolve) => setTimeout(resolve, 800));

      const supported = await Linking.canOpenURL(videoUrl);
      if (supported) {
        await Linking.openURL(videoUrl);
      } else {
        setError("No Signal");
        logger.error("Don't know how to open URI: " + videoUrl);
      }
    } catch (error) {
      setError("Connection Lost");
      logger.error("Error opening video:", error);
    } finally {
      setIsLoading(false);
      setShowStatic(false);
    }
  };

  const togglePower = () => {
    setIsPowered(!isPowered);
    if (isPowered) {
      setShowStatic(true);
      setTimeout(() => setShowStatic(false), 300);
    }
  };

  const changeChannel = (direction: "up" | "down") => {
    if (!isPowered) return;
    setShowStatic(true);
    setTimeout(() => setShowStatic(false), 200);

    if (direction === "up") {
      setCurrentChannel((prev) => (prev < 99 ? prev + 1 : 1));
    } else {
      setCurrentChannel((prev) => (prev > 1 ? prev - 1 : 99));
    }
  };

  const adjustVolume = (direction: "up" | "down") => {
    if (!isPowered) return;
    if (direction === "up") {
      setVolume((prev) => Math.min(prev + 10, 100));
    } else {
      setVolume((prev) => Math.max(prev - 10, 0));
    }
  };

  return (
    <Animated.View
      style={[
        styles.tvContainer,
        {
          maxWidth: (screenWidth || 300) - 20,
          transform: [{ scale: tvAnim }, { perspective: 1000 }],
        },
      ]}
    >
      {/* TV Frame */}
      <LinearGradient
        colors={["#2C2C2C", "#1A1A1A", "#0D0D0D"]}
        style={styles.tvFrame}
      >
        {/* TV Brand & Model */}
        <View style={styles.tvBrand}>
          <Text style={styles.brandText}>DIGI-GOLD</Text>
          <Text style={styles.modelText}>TV-2024</Text>
        </View>

        {/* TV Screen */}
        <Animated.View
          style={[
            styles.tvScreen,
            {
              opacity: isPowered ? screenFlicker : 0.1,
            },
          ]}
        >
          {isPowered ? (
            <>
              {/* Screen Content */}
              <ImageBackground
                source={thumbnail ? { uri: thumbnail } : undefined}
                style={styles.screenContent}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={[
                    "rgba(0, 0, 0, 0.3)",
                    "rgba(133, 1, 17, 0.4)",
                    "rgba(0, 0, 0, 0.5)",
                  ]}
                  style={styles.screenOverlay}
                >
                  {/* Channel Info Bar */}
                  <View style={styles.channelInfoBar}>
                    <View style={styles.channelInfo}>
                      <Text style={styles.channelNumber}>{currentChannel}</Text>
                      <Text style={styles.channelName}>{initialChannel}</Text>
                    </View>
                    <View style={styles.timeInfo}>
                      <Text style={styles.timeText}>{duration}</Text>
                      <View style={styles.signalStrength}>
                        {[1, 2, 3, 4, 5].map((bar) => (
                          <View
                            key={bar}
                            style={[
                              styles.signalBar,
                              { opacity: bar <= 4 ? 1 : 0.3 },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Main Content Area */}
                  <View style={styles.mainContent}>
                    <Text style={styles.programTitle}>{title}</Text>

                    {!isLoading && !error && (
                      <View style={styles.playPrompt}>
                        <TVPlayButton
                          onPress={handleOpenVideo}
                          isLoading={isLoading}
                        />
                        <Text style={styles.playText}>Press to Watch</Text>
                      </View>
                    )}

                    {isLoading && (
                      <View style={styles.loadingContent}>
                        <Text style={styles.loadingText}>LOADING...</Text>
                        <View style={styles.loadingDots}>
                          <Text style={styles.dots}>●●●</Text>
                        </View>
                      </View>
                    )}

                    {error && (
                      <View style={styles.errorContent}>
                        <MaterialIcons
                          name="tv-off"
                          size={40}
                          color="#FF6B6B"
                        />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={handleOpenVideo}
                        >
                          <Text style={styles.retryText}>RETRY</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Volume Indicator */}
                  <View style={styles.volumeIndicator}>
                    <Ionicons
                      name={volume > 0 ? "volume-high" : "volume-mute"}
                      size={16}
                      color="#FFD700"
                    />
                    <View style={styles.volumeDisplay}>
                      <View
                        style={[styles.volumeLevel, { width: `${volume}%` }]}
                      />
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>

              {/* TV Effects */}
              <ScanLines />
              <TVStatic visible={showStatic} />
            </>
          ) : (
            <View style={styles.offScreen}>
              <Text style={styles.offText}>●</Text>
            </View>
          )}
        </Animated.View>

        {/* TV Controls Panel */}
        <View style={styles.controlPanel}>
          <TVPowerButton isOn={isPowered} onToggle={togglePower} />

          <TVControls
            channel={currentChannel}
            volume={volume}
            onChannelUp={() => changeChannel("up")}
            onChannelDown={() => changeChannel("down")}
            onVolumeUp={() => adjustVolume("up")}
            onVolumeDown={() => adjustVolume("down")}
          />

          {/* Status LEDs */}
          <View style={styles.statusLeds}>
            <View
              style={[
                styles.led,
                { backgroundColor: isPowered ? "#00FF00" : "#333" },
              ]}
            />
            <View
              style={[
                styles.led,
                { backgroundColor: isLoading ? "#FFD700" : "#333" },
              ]}
            />
            <View
              style={[
                styles.led,
                { backgroundColor: error ? "#FF0000" : "#333" },
              ]}
            />
          </View>
        </View>

        {/* TV Speaker Grilles */}
        <View style={styles.speakerLeft}>
          {[...Array(12)].map((_, i) => (
            <View key={i} style={styles.speakerHole} />
          ))}
        </View>
        <View style={styles.speakerRight}>
          {[...Array(12)].map((_, i) => (
            <View key={i} style={styles.speakerHole} />
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tvContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    alignSelf: "center",
  },
  tvFrame: {
    flex: 1,
    borderRadius: moderateScale(15),
    padding: moderateScale(20),
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tvBrand: {
    position: "absolute",
    top: moderateScale(8),
    right: moderateScale(25),
    alignItems: "center",
  },
  brandText: {
    color: "#888",
    fontSize: moderateScale(8),
    fontWeight: "bold",
    letterSpacing: 1,
  },
  modelText: {
    color: "#666",
    fontSize: moderateScale(6),
  },
  tvScreen: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: moderateScale(8),
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#333",
  },
  screenContent: {
    flex: 1,
  },
  screenOverlay: {
    flex: 1,
    padding: moderateScale(12),
  },
  channelInfoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(4),
  },
  channelInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  channelNumber: {
    color: "#FFD700",
    fontSize: moderateScale(14),
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  channelName: {
    color: "#FFF",
    fontSize: moderateScale(12),
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  timeText: {
    color: "#FFD700",
    fontSize: moderateScale(12),
    fontFamily: "monospace",
  },
  signalStrength: {
    flexDirection: "row",
    gap: 1,
  },
  signalBar: {
    width: 2,
    height: moderateScale(8),
    backgroundColor: "#00FF00",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  programTitle: {
    color: "#FFF",
    fontSize: moderateScale(18),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: moderateScale(20),
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playPrompt: {
    alignItems: "center",
    gap: moderateScale(12),
  },
  tvPlayButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: moderateScale(40),
    padding: moderateScale(15),
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  playButtonCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    justifyContent: "center",
    alignItems: "center",
  },
  playText: {
    color: "#FFD700",
    fontSize: moderateScale(14),
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  loadingContent: {
    alignItems: "center",
    gap: moderateScale(10),
  },
  loadingText: {
    color: "#FFD700",
    fontSize: moderateScale(16),
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  loadingDots: {
    alignItems: "center",
  },
  dots: {
    color: "#FFD700",
    fontSize: moderateScale(20),
  },
  errorContent: {
    alignItems: "center",
    gap: moderateScale(10),
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: moderateScale(14),
    textAlign: "center",
    fontFamily: "monospace",
  },
  retryButton: {
    backgroundColor: "rgba(255,107,107,0.2)",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  retryText: {
    color: "#FF6B6B",
    fontSize: moderateScale(12),
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  volumeIndicator: {
    position: "absolute",
    bottom: moderateScale(10),
    left: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(4),
    gap: moderateScale(6),
  },
  volumeDisplay: {
    width: moderateScale(30),
    height: moderateScale(4),
    backgroundColor: "#333",
    borderRadius: moderateScale(2),
    overflow: "hidden",
  },
  volumeLevel: {
    height: "100%",
    backgroundColor: "#FFD700",
  },
  controlPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: moderateScale(12),
    paddingHorizontal: moderateScale(8),
  },
  powerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    padding: moderateScale(6),
    borderRadius: moderateScale(4),
    backgroundColor: "#1A1A1A",
  },
  powerIndicator: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  tvControlsContainer: {
    flexDirection: "row",
    gap: moderateScale(15),
  },
  controlGroup: {
    alignItems: "center",
    gap: moderateScale(2),
  },
  controlLabel: {
    color: "#888",
    fontSize: moderateScale(8),
    fontWeight: "bold",
  },
  controlButton: {
    backgroundColor: "#2A2A2A",
    borderRadius: moderateScale(3),
    padding: moderateScale(3),
  },
  channelDisplay: {
    color: "#FFD700",
    fontSize: moderateScale(10),
    fontWeight: "bold",
    fontFamily: "monospace",
    minWidth: moderateScale(20),
    textAlign: "center",
  },
  volumeBar: {
    width: moderateScale(4),
    height: moderateScale(30),
    backgroundColor: "#333",
    borderRadius: moderateScale(2),
    overflow: "hidden",
  },
  volumeFill: {
    backgroundColor: "#FFD700",
    borderRadius: moderateScale(2),
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  statusLeds: {
    flexDirection: "row",
    gap: moderateScale(4),
  },
  led: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  speakerLeft: {
    position: "absolute",
    left: moderateScale(5),
    top: "30%",
    bottom: "30%",
    width: moderateScale(8),
    justifyContent: "space-around",
    alignItems: "center",
  },
  speakerRight: {
    position: "absolute",
    right: moderateScale(5),
    top: "30%",
    bottom: "30%",
    width: moderateScale(8),
    justifyContent: "space-around",
    alignItems: "center",
  },
  speakerHole: {
    width: moderateScale(3),
    height: moderateScale(3),
    borderRadius: moderateScale(1.5),
    backgroundColor: "#333",
  },
  offScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  offText: {
    color: "#333",
    fontSize: moderateScale(40),
  },
  tvStatic: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFF",
  },
  staticPattern: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    zIndex: 10,
  },
});

export default VideoPlayer;
