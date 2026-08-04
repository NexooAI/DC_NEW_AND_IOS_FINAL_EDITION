import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  RefreshControl,
  Linking,
  Pressable,
  Image,
  Text,
} from "react-native";
import Svg, { Line, Path, Circle } from "react-native-svg";
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { shadowUtils } from "@/utils/shadowUtils";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { luckyDrawAPI } from "@/services/api";
import { formatDate, convertUTCToLocal } from "@/utils/dateTimeUtils";

const { wp, hp, rf } = responsiveUtils;

const luckyDrawColors = {
  surface: "#FFFFFF",
  surfaceWarm: "#FFFDF0",
  surfaceSoft: "rgba(255,255,255,0.72)",
  primary: "#850111", // Burgundy
  primaryDark: "#2C0006",
  goldDeep: "#B8860B", // Dark Gold
  goldPremium: "#D4AF37", // Elegant Gold
  goldLight: "#FAF3E0",
  muted: theme.colors.textMediumGrey,
  subtle: theme.colors.textLightGrey,
};

// --- Types ---
interface LuckyDrawItem {
  id: string;
  title: string;
  prize: string;
  description: string;
  endDate: Date;
  status: "ongoing" | "upcoming" | "completed";
  participants: number;
  image: string;
  ticketNumber: string;
  userWon?: boolean;
  winners?: any[];
  currentUserId?: string | number;
  startDate?: Date;
}

// --- Sub-Components ---

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = targetDate.getTime() - new Date().getTime();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: difference,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatWithZero = (num: number) => (num < 10 ? `0${num}` : num);

  if (timeLeft.total <= 0) {
    return (
      <View style={styles.timerContainer}>
        <ResponsiveText color="#FFD700" size="sm" weight="bold">{t("luckyDrawResultsSoon")}</ResponsiveText>
      </View>
    );
  }

  // Large Countdown Format (2 days more, 1 day more)
  if (timeLeft.days >= 1) {
    return (
      <View style={styles.timerContainer}>
        <Ionicons name="time-outline" size={16} color="#FFD700" style={{ marginRight: 6 }} />
        <ResponsiveText color="#FFD700" size="sm" weight="bold">
          {timeLeft.days === 1
            ? t("luckyDrawDayMore")
            : t("luckyDrawDaysMore").replace("{count}", timeLeft.days.toString())}
        </ResponsiveText>
      </View>
    );
  }

  // Small Countdown Format (HH:MM:SS)
  const timeString = `${formatWithZero(timeLeft.hours)}:${formatWithZero(timeLeft.minutes)}:${formatWithZero(timeLeft.seconds)}`;
  return (
    <View style={styles.timerContainer}>
      <Ionicons name="time-outline" size={16} color="#FFD700" style={{ marginRight: 6 }} />
      <ResponsiveText color="#FFD700" size="sm" weight="bold">
        {t("luckyDrawRemaining").replace("{time}", timeString)}
      </ResponsiveText>
    </View>
  );
};

const GoldOrnamentLeft = () => (
  <Svg width="40" height="80" viewBox="0 0 40 80" style={{ position: "absolute", left: -5, top: 12, opacity: 0.85 }}>
    <Path
      d="M0,0 Q18,20 8,40 T28,80 M8,10 Q28,25 18,45 T38,75"
      fill="none"
      stroke="#D4AF37"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <Circle cx="8" cy="15" r="3" fill="#FFF9C4" />
    <Circle cx="12" cy="35" r="4.5" fill="#D4AF37" />
    <Circle cx="22" cy="60" r="3" fill="#B8860B" />
  </Svg>
);

const GoldOrnamentRight = () => (
  <Svg width="40" height="80" viewBox="0 0 40 80" style={{ position: "absolute", right: -5, top: 12, opacity: 0.85 }}>
    <Path
      d="M40,0 Q22,20 32,40 T12,80 M32,10 Q12,25 22,45 T2,75"
      fill="none"
      stroke="#D4AF37"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <Circle cx="32" cy="15" r="3" fill="#FFF9C4" />
    <Circle cx="28" cy="35" r="4.5" fill="#D4AF37" />
    <Circle cx="18" cy="60" r="3" fill="#B8860B" />
  </Svg>
);

const TicketDetailPopup = ({
  ticket,
  visible,
  onClose,
  onAction
}: {
  ticket: LuckyDrawItem;
  visible: boolean;
  onClose: () => void;
  onAction: (item: LuckyDrawItem) => void;
}) => {
  const { t } = useTranslation();
  const isCompleted = ticket.status === "completed";
  const isUpcoming = ticket.status === "upcoming";
  const userWon = ticket.userWon;

  // Animation progress for spring scale and unfolding height
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, { duration: 500 });
    } else {
      progress.value = 0;
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    // Height unfolds from 140 to 390 (completed has winner list) or 310 (active/upcoming)
    const heightLimit = isCompleted ? 390 : 310;
    const currentHeight = 140 + progress.value * (heightLimit - 140);
    return {
      height: currentHeight,
      transform: [
        { scale: 0.94 + progress.value * 0.06 }
      ]
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  // Status Action Button
  let statusText = "Coming Soon";
  if (!isUpcoming && !isCompleted) {
    statusText = ticket.ticketNumber ? "Enter Live" : "Join Draw";
  } else if (isCompleted) {
    statusText = userWon ? "Claim Prize" : "Done";
  }

  const handleActionButtonPress = () => {
    if (isCompleted && !userWon) {
      onClose();
    } else {
      onAction(ticket);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={{ width: "92%" }}>
          <AnimatedReanimated.View
            style={[
              styles.popupTicketContainer,
              animatedContainerStyle,
              userWon && styles.cardWon,
              isCompleted && styles.cardCompleted
            ]}
          >
            {/* Expanded Ticket Body */}
            <View style={{ flex: 1, flexDirection: "row", position: "relative" }}>
              {/* Left Side (70%) */}
              <LinearGradient
                colors={["#5B0015", "#3D000E"]}
                style={styles.popupTicketLeft}
              >
                {/* Status Badge */}
                <View style={[
                  styles.statusRibbon,
                  isUpcoming && styles.statusRibbonUpcoming,
                  isCompleted && styles.statusRibbonCompleted,
                ]}>
                  <ResponsiveText color="#FFFFFF" size="xs" weight="bold">
                    {isUpcoming ? "UPCOMING" : (isCompleted ? "COMPLETED" : "LIVE")}
                  </ResponsiveText>
                </View>

                {/* Details */}
                <View style={{ marginTop: 28, flex: 1 }}>
                  <ResponsiveText color="#FFFFFF" size="sm" weight="bold" style={styles.cardTitle} numberOfLines={1}>
                    {ticket.title}
                  </ResponsiveText>
                  <ResponsiveText color="#D4AF37" size="md" weight="bold" style={styles.prizeText} numberOfLines={1}>
                    {ticket.prize}
                  </ResponsiveText>
                  
                  {/* Collapsible/Expandable detailed description */}
                  <AnimatedReanimated.View style={[{ marginTop: 6, flex: 1 }, animatedContentStyle]}>
                    <ResponsiveText color="rgba(255,255,255,0.72)" size="xs" style={{ lineHeight: 17, marginBottom: 8 }} numberOfLines={3}>
                      {ticket.description}
                    </ResponsiveText>
                    
                    {!isCompleted && (
                      <ResponsiveText color="#D4AF37" size="xs" style={{ lineHeight: 14 }}>
                        {t("luckyDrawInfo")}
                      </ResponsiveText>
                    )}

                    {/* Completed Draw Winner details */}
                    {isCompleted && ticket.winners && ticket.winners.length > 0 && (
                      <View style={{ marginTop: 6, borderTopWidth: 0.5, borderTopColor: "rgba(212,175,55,0.2)", paddingTop: 6 }}>
                        <ResponsiveText color="#D4AF37" size="xs" weight="bold" style={{ marginBottom: 4 }}>
                          {t("luckyDrawWinnersList") || "Winners List"}
                        </ResponsiveText>
                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 95 }}>
                          {ticket.winners.slice(0, 3).map((winner: any, idx: number) => {
                            const isCurrentUser = winner.user_id === ticket.currentUserId;
                            return (
                              <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                                <Ionicons name="ribbon" size={12} color="#D4AF37" />
                                <ResponsiveText color="#FFFFFF" size="xs" style={{ marginLeft: 4, flex: 1 }}>
                                  {winner.user_name || winner.userName} {isCurrentUser && `(You)`}
                                </ResponsiveText>
                                <ResponsiveText color="#D4AF37" size="xs" weight="bold">
                                  Rank {winner.prize_rank}
                                </ResponsiveText>
                              </View>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </AnimatedReanimated.View>
                </View>

                {/* Footer details */}
                <View style={styles.ticketLeftFooter}>
                  <View style={styles.participantInfo}>
                    <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.5)" />
                    <ResponsiveText color="rgba(255,255,255,0.5)" size="xs" style={{ marginLeft: 4 }}>
                      {t("luckyDrawParticipated").replace("{count}", ticket.participants.toLocaleString())}
                    </ResponsiveText>
                  </View>
                  <ResponsiveText color="rgba(255,255,255,0.6)" size="xs" weight="semibold">
                    {isUpcoming ? (ticket.startDate ? `Starts ${formatDate(ticket.startDate)}` : "Upcoming") : formatDate(ticket.endDate)}
                  </ResponsiveText>
                </View>
              </LinearGradient>

              {/* Vertical Perforated divider */}
              <View style={styles.perforatedDivider}>
                <Svg height="100%" width="2">
                  <Line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="100%"
                    stroke="rgba(212, 175, 55, 0.38)"
                    strokeWidth="2"
                    strokeDasharray="4, 4"
                  />
                </Svg>
              </View>

              {/* Right Side (30%) */}
              <LinearGradient
                colors={["#FFF9C4", "#D4AF37", "#B8860B"]}
                style={styles.popupTicketRight}
              >
                <MaterialCommunityIcons name="ticket-confirmation" size={32} color="#5B0015" style={{ marginBottom: 6 }} />
                
                <ResponsiveText color="#5B0015" size="xs" weight="bold" style={{ marginBottom: 12 }}>
                  {ticket.ticketNumber ? `#${ticket.ticketNumber}` : `#000${ticket.id}`}
                </ResponsiveText>

                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    isUpcoming && styles.statusButtonUpcoming,
                    isCompleted && styles.statusButtonCompleted,
                  ]}
                  onPress={handleActionButtonPress}
                  activeOpacity={0.8}
                >
                  <ResponsiveText
                    color={isUpcoming || isCompleted ? "#FFFFFF" : "#5B0015"}
                    size="xs"
                    weight="bold"
                    style={{ textAlign: "center" }}
                    numberOfLines={1}
                  >
                    {statusText}
                  </ResponsiveText>
                </TouchableOpacity>
              </LinearGradient>

              {/* Semicircle notches at the divider */}
              <View style={[styles.notchVertical, styles.notchTop]} />
              <View style={[styles.notchVertical, styles.notchBottom]} />
            </View>
          </AnimatedReanimated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const CornerBracket = ({ type }: { type: "TL" | "TR" | "BL" | "BR" }) => {
  let pathD = "";
  if (type === "TL") pathD = "M0,6 L0,0 L6,0 M0,3 L3,0";
  if (type === "TR") pathD = "M6,6 L6,0 L0,0 M6,3 L3,0";
  if (type === "BL") pathD = "M0,0 L0,6 L6,6 M0,3 L3,6";
  if (type === "BR") pathD = "M6,0 L6,6 L0,6 M6,3 L3,6";

  return (
    <Svg width="8" height="8" viewBox="0 0 6 6">
      <Path
        d={pathD}
        fill="none"
        stroke="rgba(212, 175, 55, 0.48)"
        strokeWidth="1"
      />
    </Svg>
  );
};

const LuckyTicketCard = ({
  item,
  onPress,
  isRevealed,
  onReveal
}: {
  item: LuckyDrawItem;
  onPress?: () => void;
  isRevealed?: boolean;
  onReveal?: () => void;
}) => {
  const { t } = useTranslation();
  const isCompleted = item.status === "completed";
  const isUpcoming = item.status === "upcoming";
  const userWon = item.userWon;

  // Reanimated values for appearing Fade Up
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  // Reanimated value for press scale animation
  const scale = useSharedValue(1);

  // Reanimated value for shimmer on gold ticket area
  const shimmerTranslateX = useSharedValue(-120);

  useEffect(() => {
    // Fade Up animation on mount
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withTiming(0, { duration: 600 });

    // Shimmer animation loop running every 8 seconds (8000ms)
    // The shine swipe takes 1500ms, then waits 6500ms before repeating.
    const startShine = () => {
      shimmerTranslateX.value = -120;
      shimmerTranslateX.value = withTiming(180, { duration: 1500 });
    };

    startShine();
    const interval = setInterval(startShine, 8000);
    return () => clearInterval(interval);
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  const animatedShimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 75 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 75 });
  };

  // Local animated scratch effect values
  const [foilOpacity] = useState(new Animated.Value(1));
  const [foilScale] = useState(new Animated.Value(1));

  const handleScratch = () => {
    Animated.parallel([
      Animated.timing(foilOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(foilScale, {
        toValue: 1.12,
        duration: 350,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onReveal) onReveal();
    });
  };

  const isWonAndUnrevealed = isCompleted && userWon && !isRevealed;

  // Status Button Action Text
  let statusText = "Coming Soon";
  if (!isUpcoming && !isCompleted) {
    statusText = item.ticketNumber ? "Enter" : "Join Draw";
  } else if (isCompleted) {
    statusText = "View Result";
  }

  // Determine floating prize image
  const goldCoinImg = require("@assets/images/luxury_gold_coin.png");
  const diamondCoinImg = require("@assets/images/diamond_coin_badge.png");
  const digiGoldImg = require("@assets/images/luxury_gold_ring.png");

  let prizeImgSrc = goldCoinImg;
  if (item.prize.toLowerCase().includes("point") || item.prize.toLowerCase().includes("test")) {
    prizeImgSrc = diamondCoinImg;
  } else if (item.prize.toLowerCase().includes("ring") || item.prize.toLowerCase().includes("jewel") || item.prize.toLowerCase().includes("necklace")) {
    prizeImgSrc = digiGoldImg;
  }

  // Define pressable component type
  const AnimatedPressable = AnimatedReanimated.createAnimatedComponent(Pressable);

  return (
    <AnimatedPressable
      onPress={isUpcoming ? undefined : (isWonAndUnrevealed ? handleScratch : onPress)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.ticketContainer,
        animatedContainerStyle,
        userWon && styles.cardWon,
        isCompleted && styles.cardCompleted,
      ]}
    >
      {/* LEFT SIDE (72%): Maroon luxury theme background */}
      <LinearGradient
        colors={["#7A0019", "#4A2417"]}
        style={styles.ticketLeft}
      >
        {/* Corner Brackets for premium embossed look */}
        <View style={{ position: "absolute", top: 8, left: 8 }}><CornerBracket type="TL" /></View>
        <View style={{ position: "absolute", top: 8, right: 8 }}><CornerBracket type="TR" /></View>
        <View style={{ position: "absolute", bottom: 8, left: 8 }}><CornerBracket type="BL" /></View>
        <View style={{ position: "absolute", bottom: 8, right: 8 }}><CornerBracket type="BR" /></View>

        {/* Slanted Status Ribbon (Upcoming / Live / Completed) */}
        <View style={[
          styles.statusRibbonSlanted,
          isUpcoming && styles.statusRibbonUpcomingSlanted,
          isCompleted && styles.statusRibbonCompletedSlanted,
        ]}>
          <Ionicons name="time" size={10} color="#7A0019" style={{ marginRight: 3, transform: [{ skewX: "18deg" }] }} />
          <Text style={[styles.ribbonText, { transform: [{ skewX: "18deg" }] }]}>
            {isUpcoming ? "UPCOMING" : (isCompleted ? "COMPLETED" : "LIVE")}
          </Text>
        </View>

        {/* Draw details */}
        <View style={styles.ticketLeftContent}>
          <Text style={styles.drawNameText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.8}>
            {item.title}
          </Text>
          <View style={styles.prizeRowInline}>
            <Ionicons name="star" size={14} color="#D4AF37" style={{ marginRight: 4 }} />
            <Text style={styles.prizeNameText} numberOfLines={1}>
              Win: {item.prize}
            </Text>
          </View>
          <Text style={styles.descriptionText} numberOfLines={1}>
            Join and win exciting rewards!
          </Text>
        </View>

        {/* Footer: Start Date + Participant Count in Columns */}
        <View style={styles.ticketLeftFooter}>
          <View style={styles.footerCol}>
            <Ionicons name="calendar-outline" size={14} color="#D4AF37" />
            <View style={{ marginLeft: 5 }}>
              <Text style={styles.footerLabelText}>
                {isUpcoming ? "Starts on" : "Ends on"}
              </Text>
              <Text style={styles.footerValueText}>
                {formatDate(isUpcoming ? (item.startDate || item.endDate) : item.endDate)}
              </Text>
            </View>
          </View>
          <View style={styles.footerColDivider} />
          <View style={styles.footerCol}>
            <Ionicons name="people-outline" size={14} color="#D4AF37" />
            <View style={{ marginLeft: 5 }}>
              <Text style={styles.footerLabelText}>
                Participants
              </Text>
              <Text style={styles.footerValueText}>
                {item.participants.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Floating Prize Image */}
        <View style={styles.prizeImageContainerCard}>
          <Image source={prizeImgSrc} style={styles.prizeImageCard} resizeMode="contain" />
        </View>
      </LinearGradient>

      {/* VERTICAL DIVIDER: Perforated line using SVG */}
      <View style={styles.perforatedDivider}>
        <Svg height="100%" width="2">
          <Line
            x1="1"
            y1="0"
            x2="1"
            y2="100%"
            stroke="rgba(212, 175, 55, 0.38)"
            strokeWidth="2"
            strokeDasharray="4, 4"
          />
        </Svg>
      </View>

      {/* RIGHT SIDE (28%): Gold colored ticket area */}
      <LinearGradient
        colors={["#FFE082", "#FFF9C4", "#D4AF37", "#AA7C11", "#D4AF37", "#F5D36C", "#FFF9C4"]}
        style={styles.ticketRight}
      >
        {/* Shimmer animation view */}
        <AnimatedReanimated.View style={[StyleSheet.absoluteFill, animatedShimmerStyle, { width: 90 }]}>
          <LinearGradient
            colors={["transparent", "rgba(255, 255, 255, 0.5)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </AnimatedReanimated.View>

        {/* Circular Ticket Badge in center */}
        <View style={styles.ticketIconCircle}>
          <MaterialCommunityIcons name="ticket-confirmation" size={18} color="#FFF8E8" />
        </View>
        
        <Text style={styles.ticketLabel}>
          Ticket
        </Text>
        <Text
          style={styles.stubTicketId}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {item.ticketNumber ? `Ticket #${item.ticketNumber}` : `Ticket #${item.id}`}
        </Text>

        {/* Action / Status Button */}
        <View style={styles.stubStatusButtonMaroon}>
          <Text style={styles.stubStatusButtonText} numberOfLines={1}>
            {statusText}
          </Text>
        </View>
      </LinearGradient>

      {/* Semicircle Notches on Left and Right center edges */}
      <View style={[styles.notchHorizontal, styles.notchLeftCenter]} />
      <View style={[styles.notchHorizontal, styles.notchRightCenter]} />

      {/* Interactive Golden Scratch Foil Overlay */}
      {isWonAndUnrevealed && (
        <Animated.View style={[
          StyleSheet.absoluteFill,
          {
            zIndex: 100,
            opacity: foilOpacity,
            transform: [{ scale: foilScale }],
            backgroundColor: "#B8860B",
            borderRadius: 16,
            overflow: "hidden"
          }
        ]}>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.foilContainer}
            onPress={handleScratch}
          >
            <LinearGradient
              colors={["#FFD700", "#B8860B", "#D4AF37"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.foilGradient}
            >
              <MaterialCommunityIcons name="gift-outline" size={rf(32)} color="#fff" style={styles.foilGiftIcon} />
              <ResponsiveText color="#fff" size="sm" weight="bold" style={styles.foilText}>
                {t("luckyDrawYouWonBadge") || "YOU WON! 🎉"}
              </ResponsiveText>
              <ResponsiveText color="#fff" size="xs" weight="semibold" style={styles.foilSubText}>
                Tap to scratch & claim!
              </ResponsiveText>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </AnimatedPressable>
  );
};

const LuckyDrawCard = (props: any) => {
  return <LuckyTicketCard {...props} />;
};

// Sub-component for the radial timer pulsing rings
const PulsingRing = ({ delay }: { delay: number }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animate = () => {
      scale.setValue(1);
      opacity.setValue(0.4);
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        animate();
      });
    };

    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulsingRing,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

const LiveCountdownScreen = ({
  draw,
  onMinimize,
  onFinish
}: {
  draw: LuckyDrawItem;
  onMinimize: () => void;
  onFinish: () => void;
}) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, total: 1000 });
  const [tickerIndex, setTickerIndex] = useState(0);

  const tickerEvents = useMemo(() => [
    "Aravind entered the draw",
    "Priyan registered ticket #8842",
    "Divya entered the draw",
    "Manoj registered ticket #1092",
    "Sonia entered the draw",
    "Ticket #5521 registered",
    "Anil entered the draw",
    "Karthik joined the room",
  ], []);

  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(draw.endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, total: 0 });
        onFinish();
        return;
      }
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setTimeLeft({ minutes: mins, seconds: secs, total: diff });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [draw, onFinish]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerEvents.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [tickerEvents]);

  const formatNumber = (n: number) => (n < 10 ? `0${n}` : n);

  return (
    <LinearGradient
      colors={["#2C0006", "#850111", "#4A0010"]}
      style={styles.liveContainer}
    >
      <View style={styles.liveHeader}>
        <TouchableOpacity onPress={onMinimize} style={styles.liveHeaderBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <ResponsiveText color="#FFD700" size="sm" weight="bold" style={styles.liveHeaderTitle}>
          LIVE DRAW ROOM
        </ResponsiveText>
        <TouchableOpacity onPress={onMinimize} style={styles.liveMinimizeBtn}>
          <Ionicons name="contract" size={20} color="#FFD700" style={{ marginRight: 4 }} />
          <ResponsiveText color="#FFD700" size="xs" weight="bold">
            Minimize
          </ResponsiveText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
        <View style={styles.liveDrawCard}>
          <ResponsiveText color="#FFD700" size="md" weight="bold" style={{ textAlign: 'center', marginBottom: 4 }}>
            {draw.title}
          </ResponsiveText>
          <ResponsiveText color="#fff" size="sm" style={{ textAlign: 'center', opacity: 0.8 }}>
            Prize: {draw.prize}
          </ResponsiveText>
        </View>

        <View style={styles.radialTimerWrapper}>
          <PulsingRing delay={0} />
          <PulsingRing delay={1000} />
          <View style={styles.radialTimerInner}>
            <ResponsiveText color="rgba(255,255,255,0.7)" size="xs" weight="semibold">
              STARTING IN
            </ResponsiveText>
            <ResponsiveText color="#FFD700" size="xl" weight="bold" style={styles.radialTimerText}>
              {`${formatNumber(timeLeft.minutes)}:${formatNumber(timeLeft.seconds)}`}
            </ResponsiveText>
            {draw.ticketNumber ? (
              <View style={styles.liveTicketBadge}>
                <ResponsiveText color="#fff" size="xs" weight="bold">
                  Ticket: {draw.ticketNumber}
                </ResponsiveText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.liveTickerWrapper}>
          <View style={styles.liveTickerHeader}>
            <View style={styles.livePulseDot} />
            <ResponsiveText color="#fff" size="xs" weight="semibold">
              LIVE ACTIVITY
            </ResponsiveText>
          </View>
          <View style={styles.liveTickerItem}>
            <Ionicons name="person-add" size={14} color="#FFD700" style={{ marginRight: 8 }} />
            <ResponsiveText color="#fff" size="xs">
              {tickerEvents[tickerIndex]}
            </ResponsiveText>
          </View>
        </View>

        <View style={styles.sponsorBanner}>
          <LinearGradient
            colors={["rgba(255,215,0,0.15)", "rgba(255,215,0,0.05)"]}
            style={styles.sponsorGradient}
          >
            <Ionicons name="ribbon-outline" size={24} color="#FFD700" style={{ marginBottom: 6 }} />
            <ResponsiveText color="#FFD700" size="xs" weight="bold" style={{ textAlign: 'center', marginBottom: 2 }}>
              SPONSOR SPECIAL OFFER
            </ResponsiveText>
            <ResponsiveText color="#fff" size="xs" style={{ textAlign: 'center', opacity: 0.9 }}>
              Get extra 5% rewards points on Chit purchases today!
            </ResponsiveText>
          </LinearGradient>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const LiveSpinningScreen = ({
  draw,
  onFinishedSpinning
}: {
  draw: LuckyDrawItem;
  onFinishedSpinning: (winnerName: string, ticketNumber: string) => void;
}) => {
  const [spinningName, setSpinningName] = useState("Selecting...");
  const [spinningTicket, setSpinningTicket] = useState("----");

  const mockNames = ["Ramesh Kumar", "Sita Devi", "Anil Sharma", "Deepak Gupta", "Asha Nair", "Vijay Singh", "Latha Rao", "Karan Johar", "Sunita Patil", "Rajesh V"];

  useEffect(() => {
    let elapsed = 0;
    let delay = 60;
    let timerId: any = null;

    const spin = () => {
      elapsed += delay;
      const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
      const randomTicket = "#" + Math.floor(1000 + Math.random() * 9000);
      setSpinningName(randomName);
      setSpinningTicket(randomTicket);

      if (elapsed > 4000) {
        const winnerName = draw.userWon
          ? "You"
          : (draw.winners?.[0]?.user_name || draw.winners?.[0]?.userName || "Rajesh Kumar");
        const winnerTicket = draw.userWon
          ? draw.ticketNumber
          : (draw.winners?.[0]?.ticket_number || "#4982");

        setSpinningName(winnerName);
        setSpinningTicket(winnerTicket);

        setTimeout(() => {
          onFinishedSpinning(winnerName, winnerTicket);
        }, 1500);
      } else {
        delay = Math.min(400, delay + 20);
        timerId = setTimeout(spin, delay);
      }
    };

    timerId = setTimeout(spin, delay);
    return () => clearTimeout(timerId);
  }, []);

  return (
    <LinearGradient
      colors={["#2C0006", "#850111", "#4A0010"]}
      style={styles.liveContainer}
    >
      <View style={styles.liveHeader}>
        <ResponsiveText color="#FFD700" size="md" weight="bold" style={{ flex: 1, textAlign: 'center' }}>
          EXECUTING DRAW
        </ResponsiveText>
      </View>

      <View style={styles.spinningContent}>
        <ResponsiveText color="#fff" size="md" weight="semibold" style={{ marginBottom: hp(4), textAlign: 'center' }}>
          DETERMINING THE WINNER...
        </ResponsiveText>

        <View style={styles.slotMachineWrapper}>
          <LinearGradient
            colors={["#FFD700", "#B8860B", "#D4AF37"]}
            style={styles.slotBorder}
          >
            <View style={styles.slotInner}>
              <Ionicons name="trophy" size={32} color="#FFD700" style={{ marginBottom: 12 }} />
              <ResponsiveText color="#fff" size="lg" weight="bold" style={styles.slotNameText}>
                {spinningName}
              </ResponsiveText>
              <ResponsiveText color="#FFD700" size="md" weight="bold" style={styles.slotTicketText}>
                {spinningTicket}
              </ResponsiveText>
            </View>
          </LinearGradient>
        </View>

        <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: hp(4) }} />
      </View>
    </LinearGradient>
  );
};

// --- Main Component ---

export default function LuckyDraw() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const drawId = params?.drawId as string;
  const { t } = useTranslation();
  const user = useGlobalStore((state) => state.user);
  const activeDrawCountdown = useGlobalStore((state) => state.activeDrawCountdown);
  const setActiveDrawCountdown = useGlobalStore((state) => state.setActiveDrawCountdown);

  const handleBack = () => {
    try {
      const cache = useGlobalStore.getState().getCachedVisibility();
      if (cache && cache.data && cache.data.showDashboardAfterLogin === 0) {
        router.replace("/(app)/(tabs)/home");
        return;
      }
    } catch (e) {
      console.error("Error reading visibility cache in LuckyDraw handleBack:", e);
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(tabs)/home");
    }
  };

  const [luckyDraws, setLuckyDraws] = useState<LuckyDrawItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [recentWinner, setRecentWinner] = useState<string>("");

  // Live Draw Room states
  const [activeDraw, setActiveDraw] = useState<LuckyDrawItem | null>(null);
  const [drawState, setDrawState] = useState<"countdown" | "spinning" | "result" | null>(null);

  // Scratch reveal states
  const [revealedDraws, setRevealedDraws] = useState<Record<string, boolean>>({});
  // Celebration Modal states
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationItem, setCelebrationItem] = useState<LuckyDrawItem | null>(null);

  // Non-winner Detail Modal states
  const [nonWinnerVisible, setNonWinnerVisible] = useState(false);
  const [nonWinnerItem, setNonWinnerItem] = useState<LuckyDrawItem | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<LuckyDrawItem | null>(null);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Animated values
  const [scaleAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load revealed scratchcards on mount
  useEffect(() => {
    const loadRevealed = async () => {
      try {
        const stored = await AsyncStorage.getItem("revealed_lucky_draws");
        if (stored) {
          setRevealedDraws(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Error loading revealed draws:", err);
      }
    };
    loadRevealed();
  }, []);

  const handleReveal = async (item: LuckyDrawItem) => {
    try {
      const updated = { ...revealedDraws, [item.id]: true };
      setRevealedDraws(updated);
      await AsyncStorage.setItem("revealed_lucky_draws", JSON.stringify(updated));
      showCelebration(item);
    } catch (err) {
      console.error("Error saving revealed draw:", err);
    }
  };

  const showCelebration = (item: LuckyDrawItem) => {
    setCelebrationItem(item);
    setCelebrationVisible(true);
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const shareToWhatsApp = () => {
    if (!celebrationItem) return;

    const userName = user?.name || "Customer";
    const userId = user?.id || (user as any)?.userId || "N/A";
    const ticketNo = celebrationItem.ticketNumber || "N/A";
    const drawTitle = celebrationItem.title || "Lucky Draw";
    const prizeDesc = celebrationItem.prize || "";

    const message = `🎉 *LUCKY DRAW WINNER!* 🎉\n\n` +
      `Hello team, I am claiming my prize for the *${drawTitle}* draw.\n\n` +
      `👤 *User Name:* ${userName}\n` +
      `🆔 *User ID:* ${userId}\n` +
      `🎟️ *Ticket Number:* ${ticketNo}\n` +
      `🎁 *Prize Won:* ${prizeDesc}\n\n` +
      `Please let me know the next steps to collect my reward. Thank you!`;

    const encodedMsg = encodeURIComponent(message);
    const url = `whatsapp://send?text=${encodedMsg}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const webUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        console.error("Error opening WhatsApp:", err);
        Alert.alert(t("error"), "Could not open WhatsApp.");
      });
  };

  const showNonWinnerDetails = (item: LuckyDrawItem) => {
    setNonWinnerItem(item);
    setNonWinnerVisible(true);
  };

  // Sliding tab indicator animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === "active" ? 0 : 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const tabTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, wp(45) - 4],
  });

  const fetchLuckyDraws = async (showInitialLoader = true) => {
    try {
      if (showInitialLoader && isMountedRef.current) {
        setLoading(true);
      }
      const response = await luckyDrawAPI.getLuckyDraws();
      if (response && response.data && response.data.success) {
        const list = response.data.data.map((apiItem: any): LuckyDrawItem => {
          const firstPrize = apiItem.prizes?.find((p: any) => p.prize_rank === 1) || apiItem.prizes?.[0];
          const prizeStr = firstPrize
            ? `${firstPrize.description || firstPrize.prize_value} (${firstPrize.prize_type})`
            : "Special Prize";

          return {
            id: apiItem.id.toString(),
            title: apiItem.title,
            prize: prizeStr,
            description: firstPrize?.description || apiItem.title,
            endDate: convertUTCToLocal(apiItem.draw_datetime || apiItem.end_date),
            status: apiItem.status === "completed" ? "completed" : apiItem.status === "active" ? "ongoing" : "upcoming",
            participants: apiItem.participants || 0,
            image: "",
            ticketNumber: apiItem.userEligibility?.ticketNumber || "",
            userWon: apiItem.userEligibility?.won || false,
            winners: apiItem.winners || [],
            currentUserId: user?.id,
            startDate: apiItem.start_date ? convertUTCToLocal(apiItem.start_date) : undefined,
          };
        });

        if (isMountedRef.current) {
          // Extract a real recent winner from the completed lucky draws sorted by date descending
          const completedDraws = response.data.data
            .filter((d: any) => d.status === "completed" && d.winners && d.winners.length > 0)
            .sort((a: any, b: any) => {
              const dateA = convertUTCToLocal(a.draw_datetime || a.end_date).getTime();
              const dateB = convertUTCToLocal(b.draw_datetime || b.end_date).getTime();
              return dateB - dateA;
            });
          const completedDraw = completedDraws[0];
          if (completedDraw) {
            const firstWinner = completedDraw.winners.find((w: any) => w.prize_rank === 1) || completedDraw.winners[0];
            const firstPrize = completedDraw.prizes?.find((p: any) => p.prize_rank === 1) || completedDraw.prizes?.[0];
            const prizeStr = firstPrize
              ? `${firstPrize.description || firstPrize.prize_value}`
              : "Special Prize";
            const winnerName = firstWinner.user_name || firstWinner.userName || "Customer";
            setRecentWinner(`${t("luckyDrawRecentWinnerLabel") || "Recent Winner"}: ${winnerName} won ${prizeStr}`);
          } else {
            setRecentWinner("");
          }

          // Filter list based on tab
          if (activeTab === "active") {
            setLuckyDraws(list.filter((item: any) => item.status !== "completed"));
          } else {
            setLuckyDraws(list.filter((item: any) => item.status === "completed"));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching lucky draws:", error);
      if (isMountedRef.current) {
        Alert.alert(t("error"), t("failedToFetchData"));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLuckyDraws(false);
  };

  useEffect(() => {
    fetchLuckyDraws();
  }, [activeTab]);

  // Handle draw deep link routing
  useEffect(() => {
    if (drawId && luckyDraws.length > 0) {
      const match = luckyDraws.find((d) => d.id === drawId);
      if (match) {
        if (match.status === "completed") {
          if (match.userWon) {
            showCelebration(match);
          } else {
            showNonWinnerDetails(match);
          }
        } else {
          setActiveDraw(match);
          setDrawState("countdown");
        }
      }
    }
  }, [drawId, luckyDraws]);

  const handleParticipatePress = (item: LuckyDrawItem) => {
    if (item.userWon) {
      showCelebration(item);
      return;
    }

    if (item.status === "completed") {
      showNonWinnerDetails(item);
      return;
    }

    if (item.ticketNumber) {
      Alert.alert(
        t("success"),
        `Congratulations!\n\nYou are registered in '${item.title}' draw.\n\nYour Ticket Number:\n${item.ticketNumber}`,
        [
          { text: t("ok") },
          {
            text: "Enter Live Room",
            onPress: () => {
              setActiveDraw(item);
              setDrawState("countdown");
            }
          }
        ]
      );
    } else {
      Alert.alert(
        t("info"),
        t("luckyDrawInfo"),
        [{ text: t("ok") }]
      );
    }
  };

  if (activeDraw) {
    if (drawState === "countdown") {
      return (
        <LiveCountdownScreen
          draw={activeDraw}
          onMinimize={() => {
            setActiveDrawCountdown({
              id: activeDraw.id,
              title: activeDraw.title,
              prize: activeDraw.prize,
              description: activeDraw.description,
              endDate: activeDraw.endDate.toISOString()
            });
            setActiveDraw(null);
            setDrawState(null);
            handleBack();
          }}
          onFinish={() => {
            setDrawState("spinning");
          }}
        />
      );
    } else if (drawState === "spinning") {
      return (
        <LiveSpinningScreen
          draw={activeDraw}
          onFinishedSpinning={(winnerName, ticketNumber) => {
            if (activeDraw.userWon) {
              showCelebration(activeDraw);
            } else {
              Alert.alert(
                t("luckyDrawCompleted") || "Completed",
                `The winner is ${winnerName} with ticket ${ticketNumber}.`
              );
            }
            setActiveDraw(null);
            setDrawState(null);
          }}
        />
      );
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === "ios" ? ["left", "right"] : ["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || "#F2E6D2"} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.quaternary }]} />

      {/* Background Decor */}
      <View style={styles.bgDecorCircle1} />
      <View style={styles.bgDecorCircle2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => handleBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={luckyDrawColors.primary} />
        </TouchableOpacity>
        <ResponsiveText
          variant="title"
          size="lg"
          weight="bold"
          color={luckyDrawColors.primaryDark}
        >
          {t("luckyDraw")}
        </ResponsiveText>
        <TouchableOpacity style={styles.historyButton} onPress={() => setActiveTab(activeTab === "active" ? "history" : "active")}>
          <MaterialCommunityIcons
            name={activeTab === "active" ? "history" : "trophy-outline"}
            size={24}
            color={luckyDrawColors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Toggle Segment */}
      <View style={styles.segmentWrapper}>
        <View style={styles.segmentContainer}>
          <Animated.View style={[
            styles.segmentIndicator,
            { transform: [{ translateX: tabTranslateX }] }
          ]}>
            <LinearGradient
              colors={["#FFD700", "#D4AF37", "#B8860B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.segmentButton}
            onPress={() => setActiveTab("active")}
          >
            <ResponsiveText
              color={activeTab === "active" ? "#2C0006" : "#E5A93C"}
              size="xs"
              weight="bold"
            >
              {t("luckyDrawActiveDraws")}
            </ResponsiveText>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.segmentButton}
            onPress={() => setActiveTab("history")}
          >
            <ResponsiveText
              color={activeTab === "history" ? "#2C0006" : "#E5A93C"}
              size="xs"
              weight="bold"
            >
              {t("luckyDrawHistory")}
            </ResponsiveText>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={luckyDrawColors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={luckyDrawColors.primary}
              colors={[luckyDrawColors.primary]}
            />
          }
        >
          {/* Banner Section */}
          <View style={styles.banner}>
            <LinearGradient
              colors={["#850111", "#4A0010"]}
              style={styles.bannerGradient}
            >
              <GoldOrnamentLeft />
              <GoldOrnamentRight />
              <View style={styles.bannerContent}>
                <ResponsiveText color="#FFD700" size="xl" weight="bold" style={styles.bannerTitle}>
                  {t("luckyDrawBannerTitle")}
                </ResponsiveText>
                <ResponsiveText color="#fff" size="md" style={styles.bannerSubtitle}>
                  {t("luckyDrawBannerSubtitle")}
                </ResponsiveText>

                <View style={styles.winnersTicker}>
                  <Ionicons name="notifications-outline" size={14} color="#FFD700" />
                  <ResponsiveText color="#FFD700" size="xs" style={{ marginLeft: 6 }}>
                    {recentWinner || t("luckyDrawRecentWinner")}
                  </ResponsiveText>
                </View>
              </View>

              <View style={styles.bannerIconContainer}>
                <MaterialCommunityIcons name="clover" size={rf(100)} color="rgba(255,215,0,0.15)" />
              </View>
            </LinearGradient>
          </View>

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <ResponsiveText color={luckyDrawColors.primaryDark} size="md" weight="bold">
              {activeTab === "active" ? t("luckyDrawActiveDraws") : t("luckyDrawHistory")}
            </ResponsiveText>
          </View>

          {/* Lucky Draw Cards / Empty state */}
          {activeTab === "active" ? (
            (() => {
              const ongoingDraws = luckyDraws.filter(d => d.status === "ongoing");
              const upcomingDraws = luckyDraws.filter(d => d.status === "upcoming");

              if (ongoingDraws.length === 0 && upcomingDraws.length === 0) {
                return (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name="clover"
                      size={64}
                      color={luckyDrawColors.subtle}
                    />
                    <ResponsiveText color={luckyDrawColors.muted} size="sm" style={styles.emptyText}>
                      {t("luckyDrawNoActive") || "No active draws found"}
                    </ResponsiveText>
                  </View>
                );
              }

              return (
                <>
                  {ongoingDraws.length > 0 && (
                    <>
                      <View style={styles.subSectionHeader}>
                        <ResponsiveText color={luckyDrawColors.primary} size="xs" weight="bold" style={styles.subSectionTitle}>
                          {t("luckyDrawOngoing") || "ONGOING DRAWS"}
                        </ResponsiveText>
                        <View style={styles.subSectionLine} />
                      </View>
                      {ongoingDraws.map((item) => (
                        <LuckyDrawCard
                          key={item.id}
                          item={item}
                          onPress={() => setSelectedTicket(item)}
                          isRevealed={revealedDraws[item.id]}
                          onReveal={() => handleReveal(item)}
                        />
                      ))}
                    </>
                  )}

                  {upcomingDraws.length > 0 && (
                    <>
                      <View style={styles.subSectionHeader}>
                        <ResponsiveText color={luckyDrawColors.primary} size="xs" weight="bold" style={styles.subSectionTitle}>
                          {t("luckyDrawUpcoming") || "UPCOMING DRAWS"}
                        </ResponsiveText>
                        <View style={styles.subSectionLine} />
                      </View>
                      {upcomingDraws.map((item) => (
                        <LuckyDrawCard
                          key={item.id}
                          item={item}
                          onPress={() => setSelectedTicket(item)}
                          isRevealed={revealedDraws[item.id]}
                          onReveal={() => handleReveal(item)}
                        />
                      ))}
                    </>
                  )}
                </>
              );
            })()
          ) : (
            // Completed Draws (History)
            luckyDraws.length > 0 ? (
              luckyDraws.map((item) => (
                <LuckyDrawCard
                  key={item.id}
                  item={item}
                  onPress={() => setSelectedTicket(item)}
                  isRevealed={revealedDraws[item.id]}
                  onReveal={() => handleReveal(item)}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="history"
                  size={64}
                  color={luckyDrawColors.subtle}
                />
                <ResponsiveText color={luckyDrawColors.muted} size="sm" style={styles.emptyText}>
                  {t("luckyDrawNoHistory") || "No history found"}
                </ResponsiveText>
              </View>
            )
          )}

          {/* Custom Winner Celebration Modal */}
          <Modal
            visible={celebrationVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setCelebrationVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View style={[
                styles.celebrationCard,
                {
                  transform: [{ scale: scaleAnim }]
                }
              ]}>
                <LinearGradient
                  colors={["#2C0006", "#850111", "#4A0010"]}
                  style={styles.celebrationGradient}
                >
                  <View style={styles.confettiContainer}>
                    <MaterialCommunityIcons name="star-four-points" size={16} color="#FFD700" style={[styles.confettiStar, { top: '10%', left: '15%' }]} />
                    <MaterialCommunityIcons name="star-four-points" size={24} color="#FFD700" style={[styles.confettiStar, { top: '15%', right: '20%' }]} />
                    <MaterialCommunityIcons name="star-four-points" size={14} color="#FFD700" style={[styles.confettiStar, { bottom: '25%', left: '25%' }]} />
                    <MaterialCommunityIcons name="star-four-points" size={20} color="#FFD700" style={[styles.confettiStar, { bottom: '15%', right: '15%' }]} />
                  </View>

                  <View style={styles.celebrationHeader}>
                    <ResponsiveText color="#FFD700" size="lg" weight="bold" style={styles.celebrationTitle}>
                      {t("luckyDrawCongratulations") || "CONGRATULATIONS!"}
                    </ResponsiveText>
                    <ResponsiveText color="#fff" size="sm" style={styles.celebrationSubtitle}>
                      {t("luckyDrawYouWonDesc") || "You won in this draw!"}
                    </ResponsiveText>
                  </View>

                  <View style={styles.trophyWrapper}>
                    <LinearGradient
                      colors={["#FFD700", "#B8860B"]}
                      style={styles.trophyBg}
                    >
                      <MaterialCommunityIcons name="trophy" size={rf(60)} color="#fff" />
                    </LinearGradient>
                  </View>

                  <View style={styles.prizeDetails}>
                    <ResponsiveText color="#FFD700" size="md" weight="bold" style={styles.raffleName}>
                      {celebrationItem?.title}
                    </ResponsiveText>
                    <ResponsiveText color="#fff" size="lg" weight="bold" style={styles.prizeName}>
                      {celebrationItem?.prize}
                    </ResponsiveText>
                    <ResponsiveText color="rgba(255,255,255,0.7)" size="xs" style={styles.prizeDesc}>
                      {celebrationItem?.description}
                    </ResponsiveText>
                  </View>

                  {celebrationItem?.ticketNumber && (
                    <View style={styles.ticketBadgeCelebration}>
                      <MaterialCommunityIcons name="ticket-confirmation" size={16} color="#FFD700" />
                      <ResponsiveText color="#FFD700" size="xs" weight="bold" style={{ marginLeft: 8 }}>
                        {t("luckyDrawDrawNo").replace("{no}", celebrationItem.ticketNumber)}
                      </ResponsiveText>
                    </View>
                  )}

                  <ResponsiveText color="rgba(255,255,255,0.8)" size="xs" style={styles.contactDetailsText}>
                    {t("luckyDrawDeliveryDesc") || "Our team will contact you shortly to deliver your prize."}
                  </ResponsiveText>

                  {/* WhatsApp Claim and Done buttons */}
                  <TouchableOpacity
                    style={styles.whatsappShareButton}
                    onPress={shareToWhatsApp}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#25D366", "#128C7E"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.whatsappGradient}
                    >
                      <MaterialCommunityIcons name="whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <ResponsiveText color="#fff" size="sm" weight="bold">
                        {t("claimOnWhatsApp") || "Claim on WhatsApp"}
                      </ResponsiveText>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={() => setCelebrationVisible(false)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#FFD700", "#B8860B"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.claimButtonGradient}
                    >
                      <ResponsiveText color="#2C0006" size="sm" weight="bold">
                        {t("ok") || "Done"}
                      </ResponsiveText>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            </View>
          </Modal>

          {/* Custom Non-Winner Modal Details Sheet */}
          <Modal
            visible={nonWinnerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setNonWinnerVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.nonWinnerCard}>
                <LinearGradient
                  colors={["#1c1c1c", "#2a2a2a", "#121212"]} // Slate/carbon dark background
                  style={styles.nonWinnerGradient}
                >
                  <View style={styles.nonWinnerHeader}>
                    <ResponsiveText color="#FFD700" size="md" weight="bold" style={styles.nonWinnerTitle}>
                      {t("luckyDrawThankYou") || "Thank You for Participating!"}
                    </ResponsiveText>
                    <ResponsiveText color="rgba(255,255,255,0.7)" size="xs" style={styles.nonWinnerSubtitle}>
                      {t("luckyDrawBetterLuck") || "Better luck next time! Keep participating in our draws."}
                    </ResponsiveText>
                  </View>

                  <View style={styles.nonWinnerInfoWrapper}>
                    <ResponsiveText color="#FFD700" size="sm" weight="bold" style={styles.nonWinnerDrawTitle}>
                      {nonWinnerItem?.title}
                    </ResponsiveText>
                    <ResponsiveText color="#fff" size="xs" style={{ opacity: 0.9, marginBottom: 8 }}>
                      Prize: {nonWinnerItem?.prize}
                    </ResponsiveText>
                  </View>

                  {nonWinnerItem?.winners && nonWinnerItem.winners.length > 0 ? (
                    <View style={styles.nonWinnerWinnersList}>
                      <ResponsiveText color="#FFD700" size="xs" weight="bold" style={styles.nonWinnerListTitle}>
                        {t("luckyDrawWinnersList") || "Winners List"}
                      </ResponsiveText>
                      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hp(20) }}>
                        {nonWinnerItem.winners.map((winner: any, idx: number) => {
                          const rank = winner.prize_rank;
                          const ribbonColor = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : "#D4AF37";
                          const rankColor = rank === 1 ? "#FFD700" : rank === 2 ? "#E2E8F0" : rank === 3 ? "#FFEDD5" : "rgba(255,255,255,0.7)";

                          return (
                            <View key={idx} style={[
                              styles.nonWinnerRow,
                              rank === 1 && { backgroundColor: "rgba(255,215,0,0.06)", borderColor: "rgba(255,215,0,0.2)" }
                            ]}>
                              <Ionicons name="ribbon" size={16} color={ribbonColor} />
                              <ResponsiveText color="#FFFFFF" size="xs" style={styles.nonWinnerRowName} weight={rank === 1 ? "bold" : "normal"}>
                                {winner.user_name || winner.userName}
                              </ResponsiveText>
                              <ResponsiveText color={rankColor} size="xs" weight="bold">
                                Rank {rank}
                              </ResponsiveText>
                            </View>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : (
                    <View style={styles.nonWinnerNoWinners}>
                      <ResponsiveText color="rgba(255,255,255,0.5)" size="xs">
                        Winners will be updated shortly.
                      </ResponsiveText>
                    </View>
                  )}

                  <View style={styles.nonWinnerFooterTextContainer}>
                    <Ionicons name="sparkles-outline" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                    <ResponsiveText color="rgba(255,255,255,0.8)" size="xs" style={{ flex: 1 }}>
                      Next draw details will be updated soon. Stay active and keep saving gold!
                    </ResponsiveText>
                  </View>

                  <TouchableOpacity
                    style={styles.nonWinnerCloseButton}
                    onPress={() => setNonWinnerVisible(false)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#FFD700", "#B8860B"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.nonWinnerCloseButtonGradient}
                    >
                      <ResponsiveText color="#1c1c1c" size="sm" weight="bold">
                        {t("ok") || "Done"}
                      </ResponsiveText>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Modal>

          {/* Footer info */}
          <View style={styles.footerInfo}>
            <Ionicons name="information-circle-outline" size={16} color={luckyDrawColors.subtle} />
            <ResponsiveText color={luckyDrawColors.subtle} size="xs" style={{ marginLeft: 8, flex: 1 }}>
              {t("luckyDrawTerms")}
            </ResponsiveText>
          </View>

          <View style={{ height: hp(5) }} />
        </ScrollView>
      )}

      {selectedTicket && (
        <TicketDetailPopup
          ticket={selectedTicket}
          visible={selectedTicket !== null}
          onClose={() => setSelectedTicket(null)}
          onAction={(item) => {
            setSelectedTicket(null);
            handleParticipatePress(item);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.quaternary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: "transparent",
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: luckyDrawColors.surfaceSoft,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  historyButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: luckyDrawColors.surfaceSoft,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  segmentWrapper: {
    paddingHorizontal: wp(5),
    marginBottom: hp(1),
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#160507", // Deep black-burgundy
    borderRadius: 14,
    padding: 2,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.35)", // Golden outline
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: luckyDrawColors.primary,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: hp(8),
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: hp(2),
    textAlign: "center",
    paddingHorizontal: wp(10),
  },
  bgDecorCircle1: {
    position: "absolute",
    top: -hp(10),
    right: -wp(20),
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  bgDecorCircle2: {
    position: "absolute",
    bottom: -hp(10),
    left: -wp(20),
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  banner: {
    width: "100%",
    height: hp(22),
    borderRadius: 25,
    overflow: "hidden",
    marginVertical: hp(2),
    borderWidth: 1.5,
    borderColor: "#D4AF37", // Elegant gold border
    ...shadowUtils.SHADOW_PRESETS.medium,
  },
  bannerGradient: {
    flex: 1,
    flexDirection: "row",
    padding: wp(6),
  },
  bannerContent: {
    flex: 2,
    justifyContent: "center",
  },
  bannerIconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  bannerTitle: {
    letterSpacing: 2,
    marginBottom: 4,
  },
  bannerSubtitle: {
    opacity: 0.8,
    marginBottom: hp(2),
    lineHeight: 20,
  },
  winnersTicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
    marginTop: hp(0.5),
  },
  ticketContainer: {
    width: "100%",
    height: 170,
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    overflow: "visible",
    marginBottom: 20,
    backgroundColor: "#7A0019",
    // Premium VIP shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  ticketLeft: {
    flex: 0.72,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 18,
    justifyContent: "space-between",
    position: "relative",
  },
  ticketLeftContent: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 56, // Keeps text from overlapping with prize image
  },
  ticketLeftFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  statusRibbon: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#D4AF37",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  statusRibbonUpcoming: {
    backgroundColor: "#7F7F7F",
  },
  statusRibbonCompleted: {
    backgroundColor: "#B28530",
  },
  statusRibbonSlanted: {
    position: "absolute",
    top: 10,
    left: -5,
    backgroundColor: "#E6B800",
    paddingHorizontal: 10,
    paddingVertical: 3,
    transform: [{ skewX: "-18deg" }],
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: "#B8860B",
  },
  statusRibbonUpcomingSlanted: {
    backgroundColor: "#E6B800",
  },
  statusRibbonCompletedSlanted: {
    backgroundColor: "#E2E8F0",
  },
  ribbonText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#7A0019",
  },
  drawNameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  prizeRowInline: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  prizeNameText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#D4AF37",
  },
  descriptionText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.72)",
    marginBottom: 4,
  },
  footerCol: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerColDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "rgba(212, 175, 55, 0.22)",
    marginHorizontal: wp(2),
  },
  footerLabelText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
  },
  footerValueText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  prizeImageContainerCard: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 54,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 27,
    // Soft shadow for gold ornament/prize
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  prizeImageCard: {
    width: "100%",
    height: "100%",
  },
  ticketIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#7A0019",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  ticketLabel: {
    fontSize: 10,
    color: "#7A0019",
    opacity: 0.8,
    marginBottom: 2,
    fontWeight: "600",
  },
  stubTicketId: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7A0019",
    marginBottom: 8,
    textAlign: "center",
    width: "90%",
  },
  stubStatusButtonMaroon: {
    width: "92%",
    height: 26,
    borderRadius: 13,
    backgroundColor: "#7A0019",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    marginTop: 2,
  },
  stubStatusButtonText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#D4AF37",
  },
  notchHorizontal: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFF7E8", // Background color: #FFF7E8
    zIndex: 99,
  },
  notchLeftCenter: {
    left: -7,
    top: "50%",
    marginTop: -7,
  },
  notchRightCenter: {
    right: -7,
    top: "50%",
    marginTop: -7,
  },
  bgIconContainer: {
    position: "absolute",
    right: -10,
    bottom: -10,
    opacity: 0.08,
  },
  perforatedDivider: {
    width: 2,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  ticketRight: {
    flex: 0.30,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    position: "relative",
  },
  statusButton: {
    width: "90%",
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#D4AF37",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  statusButtonUpcoming: {
    backgroundColor: "#7F7F7F",
    borderColor: "#7F7F7F",
  },
  statusButtonCompleted: {
    backgroundColor: "#5B0015",
    borderColor: "#5B0015",
  },
  notchVertical: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.quaternary || "#F2E6D2",
    zIndex: 99,
  },
  notchTop: {
    left: "70%",
    marginLeft: -10,
    top: -10.5,
  },
  notchBottom: {
    left: "70%",
    marginLeft: -10,
    bottom: -10.5,
  },
  popupTicketContainer: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    overflow: "hidden",
    backgroundColor: "#5B0015",
    // Premium shadow
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  popupTicketLeft: {
    flex: 0.70,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    padding: 12,
    justifyContent: "space-between",
    position: "relative",
  },
  popupTicketRight: {
    flex: 0.30,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    position: "relative",
  },
  card: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: hp(2.5),
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.22)",
  },
  cardWon: {
    borderWidth: 2,
    borderColor: "#D4AF37",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  cardCompleted: {
    opacity: 0.88,
  },
  cardGradient: {
    padding: wp(5),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.28)",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(2.5),
  },
  textSection: {
    flex: 1,
  },
  imageSection: {
    width: 64,
    height: 64,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    borderRadius: 32, // Fully circular
    justifyContent: "center",
    alignItems: "center",
    marginLeft: wp(4),
    borderWidth: 1.5,
    borderColor: "#D4AF37", // Elegant gold border
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  cardTitle: {
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  ticketBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 10,
    borderWidth: 1.2,
    borderColor: "rgba(212, 175, 55, 0.4)",
    borderStyle: "dashed", // Realistic tear-off ticket design
  },
  prizeText: {
    marginBottom: 8,
    fontSize: rf(19),
  },
  descText: {
    lineHeight: 18,
  },
  winnersContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: hp(1.5),
    marginBottom: hp(1.5),
  },
  winnersTitle: {
    marginBottom: hp(1),
  },
  winnerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 6,
  },
  winnerRowCurrentUser: {
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryButton: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  entryButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2),
    marginTop: hp(1),
  },
  segmentIndicator: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 2,
    width: wp(45) - 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  foilContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  foilGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(4),
  },
  foilGiftIcon: {
    marginBottom: 8,
  },
  foilText: {
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  foilSubText: {
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(6),
  },
  celebrationCard: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  celebrationGradient: {
    paddingVertical: hp(4),
    paddingHorizontal: wp(6),
    alignItems: "center",
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  confettiStar: {
    position: "absolute",
    opacity: 0.6,
  },
  celebrationHeader: {
    alignItems: "center",
    marginBottom: hp(3),
  },
  celebrationTitle: {
    letterSpacing: 2,
    marginBottom: 6,
    textTransform: "uppercase",
    textAlign: "center",
  },
  celebrationSubtitle: {
    opacity: 0.9,
    textAlign: "center",
  },
  trophyWrapper: {
    marginBottom: hp(3),
  },
  trophyBg: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  prizeDetails: {
    alignItems: "center",
    marginBottom: hp(3),
  },
  raffleName: {
    opacity: 0.8,
    marginBottom: 4,
    textAlign: "center",
  },
  prizeName: {
    textAlign: "center",
    marginBottom: 6,
  },
  prizeDesc: {
    textAlign: "center",
  },
  ticketBadgeCelebration: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.12)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.35)",
    borderStyle: "dashed",
    marginBottom: hp(3),
  },
  contactDetailsText: {
    textAlign: "center",
    opacity: 0.8,
    marginBottom: hp(4),
    lineHeight: 18,
  },
  claimButton: {
    width: "80%",
    borderRadius: 14,
    overflow: "hidden",
  },
  claimButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  liveContainer: {
    flex: 1,
  },
  liveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,215,0,0.15)",
  },
  liveHeaderBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  liveHeaderTitle: {
    letterSpacing: 1.5,
  },
  liveMinimizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  liveContent: {
    alignItems: "center",
    paddingVertical: hp(3),
    paddingHorizontal: wp(5),
  },
  liveDrawCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: wp(4),
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: hp(4),
  },
  radialTimerWrapper: {
    width: wp(60),
    height: wp(60),
    justifyContent: "center",
    alignItems: "center",
    marginVertical: hp(4),
  },
  radialTimerInner: {
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: "#2C0006",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#D4AF37",
    zIndex: 10,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  radialTimerText: {
    fontSize: rf(28),
    marginVertical: 4,
    letterSpacing: 2,
  },
  liveTicketBadge: {
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  liveTickerWrapper: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    padding: wp(4),
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.15)",
    marginBottom: hp(4),
  },
  liveTickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  liveTickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  sponsorBanner: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  sponsorGradient: {
    padding: wp(5),
    alignItems: "center",
  },
  spinningContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(6),
  },
  slotMachineWrapper: {
    width: "100%",
    height: hp(25),
    borderRadius: 24,
    overflow: "hidden",
  },
  slotBorder: {
    flex: 1,
    padding: 3,
  },
  slotInner: {
    flex: 1,
    backgroundColor: "#2C0006",
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(4),
  },
  slotNameText: {
    fontSize: rf(26),
    color: "#fff",
    marginBottom: 6,
  },
  slotTicketText: {
    fontSize: rf(20),
    color: "#FFD700",
  },
  pulsingRing: {
    position: "absolute",
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    borderWidth: 2,
    borderColor: "#D4AF37",
  },
  whatsappShareButton: {
    width: "80%",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },
  whatsappGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  subSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: wp(1),
  },
  subSectionTitle: {
    color: "#D4AF37",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  subSectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    marginLeft: 12,
  },
  nonWinnerCard: {
    width: "90%",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 215, 0, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  nonWinnerGradient: {
    paddingVertical: hp(3.5),
    paddingHorizontal: wp(5.5),
    alignItems: "center",
  },
  nonWinnerHeader: {
    alignItems: "center",
    marginBottom: hp(2.5),
  },
  nonWinnerTitle: {
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: "center",
    textTransform: "uppercase",
  },
  nonWinnerSubtitle: {
    textAlign: "center",
    lineHeight: 18,
  },
  nonWinnerInfoWrapper: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  nonWinnerDrawTitle: {
    marginBottom: 4,
    textAlign: "center",
  },
  nonWinnerWinnersList: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 14,
    padding: 12,
    marginBottom: hp(2.5),
  },
  nonWinnerListTitle: {
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  nonWinnerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  nonWinnerRowName: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    marginLeft: 8,
  },
  nonWinnerNoWinners: {
    paddingVertical: 12,
    alignItems: "center",
  },
  nonWinnerFooterTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    padding: 10,
    borderRadius: 10,
    marginBottom: hp(3),
    width: "100%",
  },
  nonWinnerCloseButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  nonWinnerCloseButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
