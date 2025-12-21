import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Clipboard,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  StyleSheet,
  Share,
  Modal,
  KeyboardAvoidingView,
  Linking, // Added Linking
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import useGlobalStore from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import AuthGuard from "@/components/AuthGuard";
import { userAPI } from "@/services/api";
import apiWithLoader from "@/services/apiWithLoader";
import { getFullImageUrl } from "@/utils/imageUtils";
import { logger } from "@/utils/logger";
// Removed RatingModal import
import { Ionicons } from "@expo/vector-icons";

const ProfileScreen = () => {
  const { t } = useTranslation();
  const { isLoggedIn, user, language, logout, setLanguage, updateUser } =
    useGlobalStore();
  const [editing, setEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Removed Rating Modal Hook

  const [localProfilePhoto, setLocalProfilePhoto] = useState<string | null>(
    null
  );
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile?.toString() || "",
  });

  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const profileImageScale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Function to open Rate Us URL directly
  const openRateUs = () => {
    const packageName = "com.nexooai.akilajewellers"; // Correct Application ID
    const url = Platform.OS === 'android' 
      ? `market://details?id=${packageName}` 
      : `https://apps.apple.com/app/idYOUR_APP_ID`; // Replace with actual iOS ID if available
      
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to web URL if market scheme is not supported
        Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`);
      }
    });
  };

  // Get profile photo from local storage
  const getLocalProfilePhoto = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.profile_photo) {
          setLocalProfilePhoto(parsedUser.profile_photo);
        }
      }
    } catch (error) {
      logger.error("Error getting local profile photo:", error);
    }
  };

  // Load local profile photo on component mount and when user changes
  useEffect(() => {
    getLocalProfilePhoto();
  }, [user]);

  // Function to get the best available profile image
  const getProfileImageSource = () => {
    if (user?.profileImage) {
      return { uri: getFullImageUrl(user.profileImage) };
    } else if (localProfilePhoto) {
      return { uri: getFullImageUrl(localProfilePhoto) };
    }
    return undefined;
  };

  // Animation effects
  useEffect(() => {
    // Slide in animation for content
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      logout();
      router.replace("/(auth)/login");
      setShowLogoutModal(false);
    } catch (error) {
      logger.error("Logout error:", error);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleImageUpload = async () => {
    // Your existing image upload logic
    try {
      // On Android 13+ (API 33+), the system Photo Picker is used automatically
      // and doesn't require READ_MEDIA_* permissions. Only request permissions on iOS
      // or older Android versions if needed.
      if (Platform.OS === 'ios') {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
          Alert.alert(
            t("permissionRequired") || "Permission Required",
            t("pleaseAllowAccessToPhotoLibrary") ||
            "Please allow access to photo library to upload profile image."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const fileSizeInMB = selectedAsset.fileSize
          ? selectedAsset.fileSize / (1024 * 1024)
          : 0;
        if (fileSizeInMB > 5) {
          Alert.alert(
            t("fileTooLarge") || "File Too Large",
            t("imageSizeShouldBeLessThan5MB") ||
            "Image size should be less than 5MB."
          );
          return;
        }

        if (!user?.id) {
          Alert.alert(
            t("errorTitle") || "Error",
            t("userIDNotFoundPleaseLoginAgain") ||
            "User ID not found. Please login again."
          );
          return;
        }

        setIsUploading(true);
        try {
          const uploadResponse = await userAPI.uploadProfileImage(
            user.id,
            selectedAsset.uri
          );
          const responseData = uploadResponse.data;

          if (responseData.success && responseData.url) {
            const fullImageUrl = `${theme.baseUrl}${responseData.url}`;
            const userData = await AsyncStorage.getItem("userData");
            if (userData) {
              const parsedUser = JSON.parse(userData);
              parsedUser.profile_photo = responseData.url;
              await AsyncStorage.setItem(
                "userData",
                JSON.stringify(parsedUser)
              );
            }
            updateUser({ ...user, profile_photo: responseData.url });
            Alert.alert(
              t("successTitle") || "Success",
              t("profileImageUpdatedSuccessfully") ||
              "Profile image updated successfully!"
            );
          } else {
            Alert.alert(
              t("uploadFailed") || "Upload Failed",
              responseData.message ||
              t("failedToUploadProfileImagePleaseTryAgain") ||
              "Failed to upload profile image."
            );
          }
        } catch (error: any) {
          let errorMessage =
            t("failedToUploadProfileImagePleaseCheckInternet") ||
            "Failed to upload profile image.";
          Alert.alert(t("uploadError") || "Upload Error", errorMessage);
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      setIsUploading(false);
      Alert.alert(
        t("errorTitle") || "Error",
        t("anUnexpectedError") ||
        "An unexpected error occurred."
      );
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.id) {
        Alert.alert(
          t("errorTitle") || "Error",
          "User ID not found. Please login again."
        );
        return;
      }

      const profileData = {
        name: editData.name,
        email: editData.email,
        mobile_number: editData.mobile,
      };

      const response = await apiWithLoader.user.updateProfile(
        Number(user.id),
        profileData
      );

      if (response && response.data) {
        try {
          const userData = await AsyncStorage.getItem("userData");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            const updatedUserData = {
              ...parsedUser,
              ...profileData,
            };
            await AsyncStorage.setItem(
              "userData",
              JSON.stringify(updatedUserData)
            );
          }
        } catch (error) {
          logger.error("Error updating local storage:", error);
        }

        updateUser({
          ...user,
          ...profileData,
        });
        setEditing(false);
        Alert.alert(
          t("successTitle") || "Success",
          t("profileUpdatedSuccessfully")
        );
      } else {
        Alert.alert(
          t("errorTitle") || "Error",
          t("failedToUpdateProfilePleaseTryAgain")
        );
      }
    } catch (error) {
      logger.error("Profile update error:", error);
      Alert.alert(
        t("errorTitle") || "Error",
        t("failedToUpdateProfilePleaseCheckInternet")
      );
    }
  };

  const handleEditToggle = async () => {
    if (editing) {
      setEditData({
        name: user?.name || "",
        email: user?.email || "",
        mobile: user?.mobile?.toString() || "",
      });
    } else {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setEditData({
            name: parsedUser.name || user?.name || "",
            email: parsedUser.email || user?.email || "",
            mobile:
              parsedUser.mobile?.toString() || user?.mobile?.toString() || "",
          });
        } else {
          setEditData({
            name: user?.name || "",
            email: user?.email || "",
            mobile: user?.mobile?.toString() || "",
          });
        }
      } catch (error) {
        logger.error("Error loading local user data:", error);
        setEditData({
          name: user?.name || "",
          email: user?.email || "",
          mobile: user?.mobile?.toString() || "",
        });
      }
    }
    setEditing(!editing);
  };

  const updateEditField = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
  };

  const toggleLanguage = async () => {
    const newLang = language === "en" ? "ta" : "en";
    await setLanguage(newLang);
  };

  const handleCopyReferralCode = () => {
    Clipboard.setString(user?.referralCode || "");
    Alert.alert(t("copied"), t("referral_code_copied"));
  };

  const handleShareApp = async () => {
    try {
      const playStoreLink =
        "https://play.google.com/store/apps/details?id=com.nexooai.akilajewellers&hl=en_IN";
      const message = `Join me on Akila Jewellers Gold and Diamonds! Download the app from: ${playStoreLink}`;

      const result = await Share.share({
        message: message,
        url: playStoreLink,
        title: "Akila Jewellers",
      });
    } catch (error) {
      logger.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share the app link");
    }
  };

  const handleChangeKYC = () => {
    router.push("/home/kyc");
  };

  const handleChangeMPIN = () => {
    router.push({
      pathname: "/reset_mpin",
      params: { mode: "reset", from: "profile" },
    });
  };

  // Animation transform
  const slideTransform = {
    transform: [{ translateX: slideAnim }],
    opacity: fadeAnim,
  };

  return (
    <AuthGuard>
      <View style={styles.container}>
        {/* Header Background */}
        <LinearGradient
          colors={[
            theme.colors.primary,
            theme.colors.primary + "CC",
            theme.colors.primary + "99",
          ]}
          style={styles.headerBackground}
        />

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeWave} />

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View style={[styles.contentWrapper, slideTransform]}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  onPress={handleImageUpload}
                  style={styles.profileImageContainer}
                  disabled={isUploading}
                >
                  {getProfileImageSource() ? (
                    <Image
                      source={getProfileImageSource()}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Icon name="person" size={40} color="white" />
                    </View>
                  )}
                  <View style={styles.profileImageEdit}>
                    {isUploading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Icon name="camera-alt" size={18} color="white" />
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user?.name || t("notProvided")}</Text>
                  <Text style={styles.profileEmail}>{user?.email || t("notProvided")}</Text>

                  <View style={styles.userIdContainer}>
                    <Icon name="badge" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.userIdText}>ID: {user?.id || "N/A"}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditToggle}
                >
                  <Icon
                    name={editing ? "close" : "edit"}
                    size={20}
                    color={editing ? "#FF4444" : "white"}
                  />
                </TouchableOpacity>
              </View>

              {/* Edit Mode */}
              {editing ? (
                <View style={styles.editFormCard}>
                  <Text style={styles.editFormTitle}>{t("editProfile")}</Text>

                  <View style={styles.editFormField}>
                    <Text style={styles.editFormLabel}>{t("fullName")}</Text>
                    <TextInput
                      style={styles.editFormInput}
                      value={editData.name}
                      onChangeText={(value) => updateEditField("name", value)}
                      placeholder={t("enterFullName")}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.editFormField}>
                    <Text style={styles.editFormLabel}>{t("emailAddress")}</Text>
                    <TextInput
                      style={styles.editFormInput}
                      value={editData.email}
                      onChangeText={(value) => updateEditField("email", value)}
                      placeholder={t("enterEmailAddress")}
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.editFormField}>
                    <Text style={styles.editFormLabel}>{t("mobileNumber")}</Text>
                    <TextInput
                      style={[styles.editFormInput, styles.disabledInput]}
                      value={editData.mobile}
                      onChangeText={(value) => updateEditField("mobile", value)}
                      placeholder={t("enterMobileNumber")}
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                      editable={false}
                    />
                  </View>

                  <View style={styles.editFormActions}>
                    <TouchableOpacity
                      style={styles.cancelEditButton}
                      onPress={() => setEditing(false)}
                    >
                      <Text style={styles.cancelEditText}>{t("cancel")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveEditButton}
                      onPress={handleSave}
                    >
                      <Text style={styles.saveEditText}>{t("save")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Referral Card
                <View style={styles.referralCard}>
                  <LinearGradient
                    colors={[
                      theme.colors.primary + "15",
                      theme.colors.primary + "08",
                      "rgba(255, 255, 255, 0.95)",
                    ]}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.referralHeader}>
                    <View style={styles.referralIcon}>
                      <Icon name="card-giftcard" size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.referralTitle}>{t("referral_rewards")}</Text>
                  </View>

                  <View style={styles.referralContent}>
                    <Text style={styles.referralDesc}>{t("your_referral_code")}</Text>

                    <TouchableOpacity
                      style={styles.referralCodeCard}
                      onPress={handleCopyReferralCode}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={[theme.colors.primary, theme.colors.primary + "DD"]}
                        style={styles.referralCodeGradient}
                      >
                        <View style={styles.referralCodeContent}>
                          <Text style={styles.referralCodeLabel}>{t("yourCode")}</Text>
                          <Text style={styles.referralCodeText}>
                            {user?.referralCode || "N/A"}
                          </Text>
                        </View>
                        <View style={styles.copyButton}>
                          <Icon name="content-copy" size={20} color="white" />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.rewardsSection}>
                      <View style={styles.rewardsInfo}>
                        <Icon name="stars" size={28} color="#FFC107" />
                        <View style={styles.rewardsDetails}>
                          <Text style={styles.rewardsLabel}>{t("total_rewards")}</Text>
                          <Text style={styles.rewardsValue}>
                            {user?.rewards || 0} {t("points")}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={handleShareApp}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.primary + "DD"]}
                      style={styles.inviteButtonGradient}
                    >
                      <Icon name="person-add" size={20} color="white" />
                      <Text style={styles.inviteButtonText}>
                        {t("inviteFriendsEarn")}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Settings Card */}
              <View style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>{t("settings") || "Settings"}</Text>

                <TouchableOpacity style={styles.settingItem} onPress={handleChangeKYC}>
                  <View style={[styles.settingIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Icon name="verified-user" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>{t("changeKYC")}</Text>
                    <Text style={styles.settingDesc}>Update your KYC details</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#9E9E9E" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.settingItem} onPress={handleChangeMPIN}>
                  <View style={[styles.settingIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Icon name="lock" size={24} color="#4CAF50" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>{t("changeMPIN")}</Text>
                    <Text style={styles.settingDesc}>Change your MPIN for security</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#9E9E9E" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.settingItem} onPress={toggleLanguage}>
                  <View style={[styles.settingIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Icon name="language" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>{t("language")}</Text>
                    <Text style={styles.settingDesc}>
                      {language === "en" ? "English" : "தமிழ்"}
                    </Text>
                  </View>
                  <Text style={styles.languageBadge}>
                    {language === "en" ? "EN" : "TA"}
                  </Text>
                  <Icon name="chevron-right" size={24} color="#9E9E9E" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.settingItem} onPress={() => router.push("/home/ratechart")}>
                  <View style={[styles.settingIcon, { backgroundColor: '#FFF9C4' }]}>
                    <Icon name="show-chart" size={24} color={theme.colors.secondary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>{t("rateChart") || 'Rate Chart'}</Text>
                    <Text style={styles.settingDesc}>{t("viewCurrentGoldAndDiamondRates") || 'View current gold and diamond rates'}</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#9E9E9E" />
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* Rate Us Button */}
                <TouchableOpacity style={styles.settingItem} onPress={openRateUs}>
                  <View style={[styles.settingIcon, { backgroundColor: '#FFF8E1' }]}>
                    <Ionicons name="star" size={24} color="#FFD700" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>{t("rateUs") || "Rate Us"}</Text>
                    <Text style={styles.settingDesc}>{t("rateUsDesc") || "Love the app? Rate us on the store!"}</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#9E9E9E" />
                </TouchableOpacity>
              </View>

              {/* Logout Button */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="logout" size={20} color="#FF4444" />
                <Text style={styles.logoutText}>{t("logout")}</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Icon name="logout" size={40} color="#FF4444" />
            </View>
            <Text style={styles.modalTitle}>
              {t("logout_confirmation_title") || "Logout"}
            </Text>
            <Text style={styles.modalMessage}>
              {t("logout_confirmation_message") || "Are you sure you want to logout?"}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={cancelLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmLogout}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["#FF4444", "#CC0000"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.modalConfirmText}>{t("logout")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>


    </AuthGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 50,
    right: 30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 120,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeWave: {
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 20,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  userIdText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
    fontWeight: '500',
  },
  editButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editFormCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  editFormTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  editFormField: {
    marginBottom: 20,
  },
  editFormLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  editFormInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#F1F3F4',
    color: '#999',
  },
  editFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelEditButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cancelEditText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveEditButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 15,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveEditText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  referralCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  referralIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(133, 1, 17, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  referralTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  referralContent: {
    marginBottom: 20,
  },
  referralDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  referralCodeCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  referralCodeGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralCodeContent: {
    flex: 1,
  },
  referralCodeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  referralCodeText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 2,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 15,
    padding: 20,
  },
  rewardsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardsDetails: {
    marginLeft: 15,
  },
  rewardsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rewardsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF9800',
  },
  inviteButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  inviteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  settingIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#999',
  },
  languageBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    backgroundColor: 'rgba(133, 1, 17, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    paddingVertical: 18,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 10,
    overflow: 'hidden',
  },
  modalConfirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;