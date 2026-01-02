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
import RatingModal from "@/components/RatingModal"; // Added RatingModal import
import { Ionicons } from "@expo/vector-icons";
import LanguageSelector from "@/components/LanguageSelector";
import { getLanguageName } from "@/utils/languageUtils";
import { useBiometrics } from "@/hooks/useBiometrics";
import { Switch } from "react-native";

const ProfileScreen = () => {
  const { t } = useTranslation();
  const { isLoggedIn, user, language, logout, setLanguage, updateUser } =
    useGlobalStore();
  const [editing, setEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showCustomerSupportModal, setShowCustomerSupportModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false); // State to control Rating Modal

  // Removed Rating Modal Hook

  // Biometric Hook
  const { 
    isSupported, 
    isEnrolled, 
    isEnabled: isBiometricEnabled, 
    enableBiometrics, 
    disableBiometrics 
  } = useBiometrics();
  
  const [localProfilePhoto, setLocalProfilePhoto] = useState<string | null>(
    null
  );
  const [showMpinModal, setShowMpinModal] = useState(false);
  const [mpinInput, setMpinInput] = useState("");
  
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
    const packageName = "com.nexooai.dcjewellery"; // Correct Application ID
    const url = Platform.OS === 'android' 
      ? `market://details?id=${packageName}` 
      : `https://apps.apple.com/us/app/dc-jewellers-gold-diamonds/id6755081937`; // Replace with actual iOS ID if available
      
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

  const toggleLanguage = () => {
    setLanguageSelectorVisible(true);
  };

  const handleCopyReferralCode = () => {
    Clipboard.setString(user?.referralCode || "");
    Alert.alert(t("copied"), t("referral_code_copied"));
  };

  const handleShareApp = async () => {
    try {
      const playStoreLink =
        "https://play.google.com/store/apps/details?id=com.nexooai.srimurugangoldhouse&hl=en-US";
      const message = `Join me on Srimurugan Gold House! Download the app from: ${playStoreLink}`;

      const result = await Share.share({
        message: message,
        url: playStoreLink,
        title: "Srimurugan Gold House",
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

  // Handler to show delete account modal
  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };
  
  // Handle Biometric Toggle
  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // To enable, we need to confirm MPIN
      setShowMpinModal(true);
    } else {
      // To disable, just do it
      await disableBiometrics();
      Alert.alert(t("success"), t("biometricsDisabled") || "Biometrics disabled");
    }
  };

  const handleConfirmMpinForBiometrics = async () => {
    if (mpinInput.length !== 4) {
      Alert.alert(t("error"), t("pleaseEnterValidMpin"));
      return;
    }
    
    // Here we should verify MPIN with backend to be 100% sure, 
    // but for now we'll assume if they know it, it's fine or we can assume successful login earlier
    // In a real app, verify MPIN with API before enabling
    
    // Better: Verify with API
    try {
        const response = await apiWithLoader.post("/auth/login-mpin", {
            mobileNumber: user?.mobile,
            mpin: mpinInput
        });
        
        if (response.data.success) {
            const success = await enableBiometrics(mpinInput);
            if (success) {
                Alert.alert(t("success"), t("biometricsEnabled"));
                setShowMpinModal(false);
                setMpinInput("");
            } else {
                Alert.alert(t("error"), t("failedToEnableBiometrics") || "Failed to enable biometrics");
            }
        } else {
             Alert.alert(t("error"), t("incorrectMpin"));
        }
    } catch (error) {
        // Fallback or error handling
        Alert.alert(t("error"), t("incorrectMpin"));
    }
  };

  // Confirm delete account - calls API and handles response
  const confirmDeleteAccount = async () => {
    try {
      if (!user?.id) {
        Alert.alert(
          t("errorTitle") || "Error",
          t("userIDNotFoundPleaseLoginAgain") ||
          "User ID not found. Please login again."
        );
        return;
      }

      // Show loading indicator if needed, or rely on API loader
      
      const response = await userAPI.deactivateUser(user.id);
      console.log("Delete account response", response);
      
      // Check for success in the response data
      if (response.data && response.data.success) {
        Alert.alert(
          t("success") || "Success",
          t("deleteAccountSuccess") || "Account deleted successfully",
          [
            {
              text: t("ok") || "OK",
              onPress: async () => {
                // Clear user data and redirect to login
                await handleLogout(); // Reuse existing logout logic if possible, or manual clear
                // If handleLogout is not available in scope or suitable:
                /*
                logout();
                router.replace("/(auth)/login");
                */
               setShowDeleteAccountModal(false);
              },
            },
          ]
        );
      } else {
        // Check if it's the specific investment active error
        // Adjust condition based on actual API error structure
        if (
          response.data?.message ===
          "Investment is active so user acccount cannot be deactivated"
        ) {
          setShowDeleteAccountModal(false);
          setShowCustomerSupportModal(true);
        } else {
          Alert.alert(
            t("errorTitle") || "Error",
            t("deleteAccountError") ||
            response.data?.message || 
            "Failed to delete account. Please try again."
          );
        }
      }
    } catch (error: any) {
      console.error("Delete account error:", error);
      setShowDeleteAccountModal(false);

      // Check for specific error status codes
      if (error.response?.status === 404) {
         // Handle 404 if needed
      }

      // Check error message in response if available
      const errorMessage = error.response?.data?.message || error.message;
      
      if (
        errorMessage ===
        "Investment is active so user acccount cannot be deactivated"
      ) {
        setShowCustomerSupportModal(true);
      } else {
        Alert.alert(
          t("errorTitle") || "Error",
          t("deleteAccountError") ||
          errorMessage ||
          "Failed to delete account. Please try again."
        );
      }
    }
  };

  // Cancel delete account modal
  const cancelDeleteAccount = () => {
    setShowDeleteAccountModal(false);
  };

  // Animation transform

  // Animation transform
  const slideTransform = {
    transform: [{ translateX: slideAnim }],
    opacity: fadeAnim,
  };

  return (
    <AuthGuard>
      <View style={styles.container}>
        {/* Header Background */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[
              theme.colors.primary,
              theme.colors.primary,
            ]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerOverlay} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View style={[styles.contentWrapper, slideTransform]}>
                {/* Profile Header Card */}
                <View style={styles.profileCard}>
                  <View style={styles.profileHeaderTop}>
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
                          <Icon name="person" size={40} color={theme.colors.primary} />
                        </View>
                      )}
                      <View style={styles.profileImageEdit}>
                        {isUploading ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Icon name="camera-alt" size={16} color="white" />
                        )}
                      </View>
                    </TouchableOpacity>

                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName} numberOfLines={1}>{user?.name || t("notProvided")}</Text>
                      <Text style={styles.profileEmail} numberOfLines={1}>{user?.email || t("notProvided")}</Text>
                      <Text style={styles.profileEmail} numberOfLines={1}>+91 - {user?.mobile || t("notProvided")}</Text>
                      
                      <View style={styles.userIdBadge}>
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
                        color={editing ? "#FF4444" : theme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
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

                {/* Biometric Toggle */}
                {isSupported && isEnrolled && (
                  <>
                    <View style={styles.settingItem}>
                      <View style={[styles.settingIcon, { backgroundColor: '#E0F7FA' }]}>
                        <Icon name="fingerprint" size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={styles.settingText}>{t("biometricLogin") || "Biometric Login"}</Text>
                        <Text style={styles.settingDesc}>{t("setupBiometricsMsg") || "Use Fingerprint/FaceID to login"}</Text>
                      </View>
                      <Switch
                        value={isBiometricEnabled}
                        onValueChange={handleBiometricToggle}
                        trackColor={{ false: "#767577", true: theme.colors.secondary }}
                        thumbColor={isBiometricEnabled ? theme.colors.primary : "#f4f3f4"}
                      />
                    </View>
                    <View style={styles.divider} />
                  </>
                )}

                <View style={styles.divider} />

                <TouchableOpacity style={styles.settingItem} onPress={toggleLanguage}>
                  <View style={[styles.settingIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Icon name="language" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>{t("language")}</Text>
                    <Text style={styles.settingDesc}>
                      {getLanguageName(language as any) || "English"}
                    </Text>
                  </View>
                  <Text style={styles.languageBadge}>
                    {language ? language.toUpperCase() : "EN"}
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

                {/* Rate Us Menu Item */}
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => setShowRatingModal(true)}
                >
                  <View style={[styles.settingIcon, { backgroundColor: "#fff0f5" }]}>
                    <Icon name="star-rate" size={24} color="#E91E63" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>{t("rateUs") || "Rate Us"}</Text>
                    <Text style={styles.settingDesc}>
                      {t("rateUsDesc") || "Rate our app on Play Store / App Store"}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#9E9E9E" />
                </TouchableOpacity>

                <View style={styles.divider} />

                 {/* Delete Account Button */}
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={handleDeleteAccount}
                >
                  <View
                    style={[styles.settingIcon, { backgroundColor: "#FFEBEE" }]}
                  >
                    <Icon name="delete-forever" size={24} color="#D32F2F" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingText, { color: "#D32F2F" }]}>
                      {t("deleteAccount")}
                    </Text>
                     <Text style={styles.settingDesc}>Delete your account permanently</Text>
                  </View>
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

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
      />

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

      <LanguageSelector
        visible={languageSelectorVisible}
        onClose={() => setLanguageSelectorVisible(false)}
      />

      {/* MPIN Input Modal for Biometrics */}
      <Modal
        visible={showMpinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMpinModal(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.mpinModalContainer}>
                <Text style={styles.mpinModalTitle}>{t("enterMpin") || "Enter MPIN"}</Text>
                <Text style={styles.mpinModalDesc}>{t("verifyMpinToEnableBiometrics") || "Please enter your MPIN to enable biometric login"}</Text>
                
                <TextInput 
                    style={styles.mpinInput}
                    value={mpinInput}
                    onChangeText={(text) => setMpinInput(text.replace(/[^0-9]/g, '').slice(0, 4))}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    autoFocus
                />
                
                <View style={styles.mpinModalActions}>
                    <TouchableOpacity 
                        style={styles.mpinModalCancel}
                        onPress={() => {
                            setShowMpinModal(false);
                            setMpinInput("");
                        }}
                    >
                        <Text style={styles.mpinModalCancelText}>{t("cancel")}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.mpinModalConfirm}
                        onPress={handleConfirmMpinForBiometrics}
                    >
                        <Text style={styles.mpinModalConfirmText}>{t("enable") || "Enable"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteAccountModal}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDeleteAccount}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {t("deleteAccount_confirmation_title")}
            </Text>
            <Text style={styles.modalMessage}>
              {t("deleteAccount_confirmation_message")}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={cancelDeleteAccount}
              >
                <Text style={styles.modalCancelText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  { backgroundColor: "#D32F2F" },
                ]}
                onPress={confirmDeleteAccount}
              >
                <Text style={styles.modalConfirmText}>
                  {t("deleteAccount")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Support Modal (for Active Investment case) */}
      <Modal
        visible={showCustomerSupportModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCustomerSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
             <View style={{ marginBottom: 15 }}>
                <Icon name="support-agent" size={50} color={theme.colors.primary} />
            </View>
            <Text style={styles.modalTitle}>
              {t("contactUs")}
            </Text>
            <Text style={styles.modalMessage}>
              {t("investmentActiveError") ||
                "Investment is active so user acccount cannot be deactivated. Please contact support."}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                   setShowCustomerSupportModal(false);
                   // Navigate to support or open dialer
                   // router.push("/(app)/support"); // If you have a support route
                   // Or just close
                }}
              >
                <Text style={styles.modalConfirmText}>
                  {t("ok")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </AuthGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  headerContainer: {
    height: 220,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingTop: 50, // Push content down to overlap header
  },
  contentWrapper: {
    paddingHorizontal: 20,
  },
  // Profile Card
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  profileHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageEdit: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D1E',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6E7687',
    marginBottom: 8,
  },
  userIdBadge: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  userIdText: {
    fontSize: 12,
    color: '#6E7687',
    fontWeight: '600',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Edit Form
  editFormCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  editFormTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  editFormField: {
    marginBottom: 16,
  },
  editFormLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
    marginLeft: 4,
  },
  editFormInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A202C',
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  editFormActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelEditText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  saveEditButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveEditText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },

  // Referral Card
  referralCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  referralIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F3', // Light pink/primary tint
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D1E',
  },
  referralContent: {
    marginBottom: 20,
  },
  referralDesc: {
    fontSize: 14,
    color: '#6E7687',
    marginBottom: 16,
    lineHeight: 20,
  },
  referralCodeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
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
    fontWeight: '500',
  },
  referralCodeText: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1.5,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsSection: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  rewardsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardsDetails: {
    marginLeft: 12,
  },
  rewardsLabel: {
    fontSize: 13,
    color: '#D87A04',
    marginBottom: 2,
    fontWeight: '600',
  },
  rewardsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D87A04',
  },
  inviteButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inviteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D1E',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1D1E',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  languageBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 60, // Indent divider to align with text
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5', // Light red bg
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E53E3E',
    marginLeft: 8,
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1D1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#E53E3E',
  },
  modalConfirmText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  
  // MPIN Modal (Specific)
  mpinModalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
  },
  mpinModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1A1D1E',
  },
  mpinModalDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  mpinInput: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 24,
    color: '#1A1D1E',
    backgroundColor: '#F8FAFC',
    letterSpacing: 8,
  },
  mpinModalActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  mpinModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  mpinModalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  mpinModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  mpinModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});

export default ProfileScreen;