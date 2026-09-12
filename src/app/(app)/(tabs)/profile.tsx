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
  StatusBar,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import useGlobalStore, { useAppTheme } from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
// theme import removed to use useAppTheme hook instead
import { COLORS } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import { themeConfig } from "@/constants/theme.config";
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
import { SafeAreaView } from "react-native-safe-area-context";
import ResponsiveText from "@/components/ResponsiveText";
import { wp, hp, rf } from "@/utils/responsiveUtils";
import { useAppVisibility } from "@/hooks/useAppVisibility";


const ProfileScreen = () => {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const { t } = useTranslation();
  const { isLoggedIn, user, language, logout, setLanguage, updateUser, themeMode, toggleThemeMode } =
    useGlobalStore();
  const { isVisible } = useAppVisibility();

  const showKyc = isVisible("showProfileKyc");
  const showMpin = isVisible("showProfileMpin");
  const showBiometrics = isVisible("showProfileBiometrics");
  const showLanguage = isVisible("showProfileLanguage");
  const showRateChart = isVisible("showProfileRateChart");
  const showRateUs = isVisible("showProfileRateUs");
  const showPaymentHistory = isVisible("showProfilePaymentHistory");
  const showDeleteAccount = isVisible("showProfileDeleteAccount");
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
    const packageName = Constants.expoConfig?.android?.package || themeConfig?.bundleIdentifier || "com.nexooai.kanisaajewellerydigigoldsavings";
    const appleId = (Constants.expoConfig?.extra as any)?.appleAppId || "6755081937";
    const url = Platform.OS === 'android'
      ? `market://details?id=${packageName}`
      : `https://apps.apple.com/us/app/id${appleId}`;

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

  const processSelectedImage = async (selectedAsset: any) => {
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
  };

  const launchCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          t("permissionRequired") || "Permission Required",
          t("pleaseAllowAccessToCamera") || "Please allow access to the camera to take a photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processSelectedImage(result.assets[0]);
      }
    } catch (error) {
      logger.error("Error launching camera:", error);
      Alert.alert(t("errorTitle") || "Error", t("failedToLaunchCamera") || "Failed to launch camera.");
    }
  };

  const launchGallery = async () => {
    try {
      if (Platform.OS === 'ios') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(
            t("permissionRequired") || "Permission Required",
            t("pleaseAllowAccessToPhotoLibrary") || "Please allow access to the photo library to choose a photo."
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
        await processSelectedImage(result.assets[0]);
      }
    } catch (error) {
      logger.error("Error launching image library:", error);
      Alert.alert(t("errorTitle") || "Error", t("failedToLaunchGallery") || "Failed to launch gallery.");
    }
  };

  const handleImageUpload = () => {
    Alert.alert(
      t("uploadProfileImage") || "Profile Photo",
      t("chooseAnOption") || "Choose an option to upload your photo",
      [
        {
          text: t("camera") || "Take Photo (Camera)",
          onPress: () => launchCamera(),
        },
        {
          text: t("gallery") || "Choose from Gallery",
          onPress: () => launchGallery(),
        },
        {
          text: t("cancel") || "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      if (!user?.id) {
        Alert.alert(
          t("errorTitle") || "Error",
          t("userIDNotFoundPleaseLoginAgain") || "User ID not found. Please login again."
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
      const packageName = Constants.expoConfig?.android?.package || themeConfig?.bundleIdentifier || "com.nexooai.kanisaajewellerydigigoldsavings";
      const playStoreLink =
        `https://play.google.com/store/apps/details?id=${packageName}&hl=en_IN`;
      const message = `Join me on ${theme.constants.customerName} Gold and Diamonds! Download the app from: ${playStoreLink}`;

      const result = await Share.share({
        message: message,
        url: playStoreLink,
        title: theme.constants.customerName,
      });
    } catch (error) {
      logger.error("Error sharing:", error);
      Alert.alert(t("errorTitle") || "Error", t("failedToShareApp") || "Failed to share the app link");
    }
  };

  const handleChangeKYC = () => {
    router.push({
      pathname: "/home/kyc",
      params: { from: "profile" },
    });
  };

  const handleChangeMPIN = () => {
    router.push({
      pathname: "/reset_mpin",
      params: { mode: "reset", from: "profile" },
    });
  };

  const handleShareLogs = async () => {
    try {
      const logUri = FileSystem.documentDirectory + 'api_logs.txt';
      const fileInfo = await FileSystem.getInfoAsync(logUri);
      if (!fileInfo.exists) {
        Alert.alert(t("noLogs") || "No Logs Available", t("noLogsDesc") || "No API logs have been recorded yet.");
        return;
      }

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert(t("sharingUnavailable") || "Sharing Unavailable", t("sharingUnavailableMsg") || "Sharing is not available on this device.");
        return;
      }

      await Sharing.shareAsync(logUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Share API Logs',
      });
    } catch (error) {
      logger.error("Error sharing logs:", error);
      Alert.alert(t("error") || "Error", t("failedToShareLogs") || "Failed to share API logs.");
    }
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
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || "#F2E6D2"} />
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => router.push("/(app)/(tabs)/home")}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
              <View style={styles.headerTextWrap}>
                <ResponsiveText
                  variant="title"
                  size="xl"
                  weight="bold"
                  color={theme.colors.primary}
                >
                  {t("profile") || "Profile"}
                </ResponsiveText>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>

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
                        <Icon name="person" size={40} color={theme.colors.textDark} />
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
              ) :
                // (
                //   // Referral Card
                //   <View style={styles.referralCard}>
                //     <LinearGradient
                //       colors={[
                //         theme.colors.primary + "15",
                //         theme.colors.primary + "08",
                //         "rgba(255, 255, 255, 0.95)",
                //       ]}
                //       style={StyleSheet.absoluteFill}
                //     />

                //     <View style={styles.referralHeader}>
                //       <View style={styles.referralIcon}>
                //         <Icon name="card-giftcard" size={24} color={theme.colors.textDark} />
                //       </View>
                //       <Text style={styles.referralTitle}>{t("referral_rewards")}</Text>
                //     </View>

                //     <View style={styles.referralContent}>
                //       <Text style={styles.referralDesc}>{t("your_referral_code")}</Text>

                //       <TouchableOpacity
                //         style={styles.referralCodeCard}
                //         onPress={handleCopyReferralCode}
                //         activeOpacity={0.7}
                //       >
                //         <LinearGradient
                //           colors={[theme.colors.primary, theme.colors.primary + "DD"]}
                //           style={styles.referralCodeGradient}
                //         >
                //           <View style={styles.referralCodeContent}>
                //             <Text style={styles.referralCodeLabel}>{t("yourCode")}</Text>
                //             <Text style={styles.referralCodeText}>
                //               {user?.referralCode || "N/A"}
                //             </Text>
                //           </View>
                //           <View style={styles.copyButton}>
                //             <Icon name="content-copy" size={20} color="white" />
                //           </View>
                //         </LinearGradient>
                //       </TouchableOpacity>

                //       <View style={styles.rewardsSection}>
                //         <View style={styles.rewardsInfo}>
                //           <Icon name="stars" size={28} color="#FFC107" />
                //           <View style={styles.rewardsDetails}>
                //             <Text style={styles.rewardsLabel}>{t("total_rewards")}</Text>
                //             <Text style={styles.rewardsValue}>
                //               {user?.rewards || 0} {t("points")}
                //             </Text>
                //           </View>
                //         </View>
                //       </View>
                //     </View>

                //     <TouchableOpacity
                //       style={styles.inviteButton}
                //       onPress={handleShareApp}
                //       activeOpacity={0.8}
                //     >
                //       <LinearGradient
                //         colors={[theme.colors.primary, theme.colors.primary + "DD"]}
                //         style={styles.inviteButtonGradient}
                //       >
                //         <Icon name="person-add" size={20} color="white" />
                //         <Text style={styles.inviteButtonText}>
                //           {t("inviteFriendsEarn")}
                //         </Text>
                //       </LinearGradient>
                //     </TouchableOpacity>
                //   </View>
                // )
                null
              }

              {/* Settings Card */}
              <View style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>{t("settings") || "Settings"}</Text>

                {showKyc && (
                  <>
                    <TouchableOpacity style={styles.settingItem} onPress={handleChangeKYC}>
                      <View style={[styles.settingIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Icon name="verified-user" size={24} color={theme.colors.textDark} />
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={styles.settingText}>{t("changeKYC")}</Text>
                        <Text style={styles.settingDesc}>{t("updateKycDesc") || "Update your KYC details"}</Text>
                      </View>
                      <Icon name="chevron-right" size={24} color="#9E9E9E" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                  </>
                )}

                {showMpin && (
                  <>
                    <TouchableOpacity style={styles.settingItem} onPress={handleChangeMPIN}>
                      <View style={[styles.settingIcon, { backgroundColor: '#E8F5E9' }]}>
                        <Icon name="lock" size={24} color="#4CAF50" />
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={styles.settingText}>{t("changeMPIN")}</Text>
                        <Text style={styles.settingDesc}>{t("changeMpinDesc") || "Change your MPIN for security"}</Text>
                      </View>
                      <Icon name="chevron-right" size={24} color="#9E9E9E" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                  </>
                )}

                {/* Biometric Toggle */}
                {showBiometrics && isSupported && isEnrolled && (
                  <>
                    <View style={styles.settingItem}>
                      <View style={[styles.settingIcon, { backgroundColor: '#E0F7FA' }]}>
                        <Icon name="fingerprint" size={24} color={theme.colors.textDark} />
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

                {/* Dark Mode Toggle */}
                <View style={styles.settingItem}>
                  <View style={[styles.settingIcon, { backgroundColor: '#F0F2F5' }]}>
                    <Ionicons name={themeMode === 'dark' ? "moon" : "sunny-outline"} size={22} color={themeMode === 'dark' ? theme.colors.secondary : theme.colors.textMediumGrey} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingText}>{t("darkMode") || "Dark Mode"}</Text>
                    <Text style={styles.settingDesc}>{t("darkModeDesc") || "Toggle dark mode theme"}</Text>
                  </View>
                  <Switch
                    value={themeMode === 'dark'}
                    onValueChange={toggleThemeMode}
                    trackColor={{ false: "#767577", true: theme.colors.secondary }}
                    thumbColor={themeMode === 'dark' ? theme.colors.primary : "#f4f3f4"}
                  />
                </View>
                <View style={styles.divider} />

                {showLanguage && (
                  <>
                    <TouchableOpacity style={styles.settingItem} onPress={toggleLanguage}>
                      <View style={[styles.settingIcon, { backgroundColor: '#FFF3E0' }]}>
                        <Icon name="language" size={24} color={theme.colors.textDark} />
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
                  </>
                )}

                {showRateChart && (
                  <>
                    <TouchableOpacity style={styles.settingItem} onPress={() => router.push({ pathname: "/home/ratechart", params: { from: "profile" } })}>
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
                  </>
                )}

                {showRateUs && (
                  <>
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
                  </>
                )}

                {/* Share API Logs Button */}
                {__DEV__ && (
                  <>
                    <TouchableOpacity
                      style={styles.settingItem}
                      onPress={handleShareLogs}
                    >
                      <View
                        style={[styles.settingIcon, { backgroundColor: "#E0F7FA" }]}
                      >
                        <Icon name="bug-report" size={24} color={theme.colors.textDark} />
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={styles.settingText}>
                          {t("share_api_logs") || "Share API Logs"}
                        </Text>
                        <Text style={styles.settingDesc}>
                          {t("share_api_logs_desc") || "Share debugging logs for API calls"}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={24} color="#9E9E9E" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                  </>
                )}

                {showPaymentHistory && (
                  <>
                    {/* Payment History Button */}
                    <TouchableOpacity
                      style={styles.settingItem}
                      onPress={() => router.push("/payment-history")}
                    >
                      <View
                        style={[styles.settingIcon, { backgroundColor: "#E8F5E9" }]}
                      >
                        <Icon name="history" size={24} color="#2E7D32" />
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={styles.settingText}>
                          {t("paymentHistory") || "Payment History"}
                        </Text>
                        <Text style={styles.settingDesc}>
                          {t("paymentHistoryDesc") || "View all your successful and failed payment attempts"}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={24} color="#9E9E9E" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                  </>
                )}

                {showDeleteAccount && (
                  /* Delete Account Button */
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
                      <Text style={styles.settingDesc}>{t("deleteAccountDesc") || "Delete your account permanently"}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Logout Button */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="logout" size={20} color="#FF4444" />
                <Text style={styles.logoutText}>{t("logout")}</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>


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
                <Icon name="support-agent" size={50} color={theme.colors.textDark} />
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


      </SafeAreaView>
    </AuthGuard>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.quaternary,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10, // Adjusted padding
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: theme.colors.quaternary || "#F2E6D2",
    // elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerTextWrap: {
    flex: 1,
    marginHorizontal: 14,
    alignItems: "center",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
    paddingTop: 10,
  },
  contentWrapper: {
    paddingHorizontal: 20,
  },
  // Profile Card
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: theme.colors.black,
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
    backgroundColor: theme.colors.backgroundTertiary || '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.borderLight || 'white',
    shadowColor: theme.colors.black,
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
    backgroundColor: theme.colors.backgroundSecondary || '#F0F2F5',
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
    borderColor: theme.colors.borderLight || 'white',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textDarkGrey || '#1A1D1E',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.textGrey || '#6E7687',
    marginBottom: 8,
  },
  userIdBadge: {
    backgroundColor: theme.colors.backgroundSecondary || '#F5F7FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  userIdText: {
    fontSize: 12,
    color: theme.colors.textMediumGrey || '#6E7687',
    fontWeight: '600',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.backgroundSecondary || '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Edit Form
  editFormCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  editFormTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDarkGrey || '#1A1D1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  editFormField: {
    marginBottom: 16,
  },
  editFormLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textGrey || '#4A5568',
    marginBottom: 8,
    marginLeft: 4,
  },
  editFormInput: {
    backgroundColor: theme.colors.backgroundTertiary || '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border || '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme.colors.textDarkGrey || '#1A202C',
  },
  disabledInput: {
    backgroundColor: theme.colors.backgroundSecondary || '#F1F5F9',
    color: theme.colors.textLightGrey || '#94A3B8',
  },
  editFormActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border || '#E2E8F0',
  },
  cancelEditText: {
    color: theme.colors.textGrey || '#64748B',
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
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // Referral Card
  referralCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: theme.colors.black,
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
    backgroundColor: theme.colors.backgroundTertiary || '#FFF0F3', // Light pink/primary tint
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDarkGrey || '#1A1D1E',
  },
  referralContent: {
    marginBottom: 20,
  },
  referralDesc: {
    fontSize: 14,
    color: theme.colors.textGrey || '#6E7687',
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
    color: '#ffffff',
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
    backgroundColor: theme.colors.backgroundSecondary || '#FFF8F0',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border || '#FFE0B2',
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
    color: theme.colors.secondary || '#D87A04',
    marginBottom: 2,
    fontWeight: '600',
  },
  rewardsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary || '#D87A04',
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
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDarkGrey || '#1A1D1E',
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
    color: theme.colors.textDarkGrey || '#1A1D1E',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: theme.colors.textGrey || '#94A3B8',
    lineHeight: 16,
  },
  languageBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textDark,
    backgroundColor: theme.colors.backgroundSecondary || '#FFF0F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight || '#F1F5F9',
    marginLeft: 60, // Indent divider to align with text
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundSecondary || '#FFF5F5', // Light red bg
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: theme.colors.error || '#FED7D7',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.error || '#E53E3E',
    marginLeft: 8,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.backgroundSecondary || '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textDarkGrey || '#1A1D1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: theme.colors.textGrey || '#64748B',
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
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border || '#E2E8F0',
  },
  modalCancelText: {
    color: theme.colors.textGrey || '#64748B',
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
    backgroundColor: theme.colors.error || '#E53E3E',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  // MPIN Modal (Specific)
  mpinModalContainer: {
    width: '85%',
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
  },
  mpinModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.textDarkGrey || '#1A1D1E',
  },
  mpinModalDesc: {
    fontSize: 14,
    color: theme.colors.textGrey || '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  mpinInput: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border || '#E2E8F0',
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 24,
    color: theme.colors.textDarkGrey || '#1A1D1E',
    backgroundColor: theme.colors.backgroundTertiary || '#F8FAFC',
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
    borderColor: theme.colors.border || '#E2E8F0',
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
    color: theme.colors.textGrey || '#64748B',
  },
  mpinModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ProfileScreen;
