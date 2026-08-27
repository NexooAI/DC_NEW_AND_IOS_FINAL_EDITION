import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Keyboard,
  ImageBackground,
  BackHandler,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "@/hooks/useTranslation";

import { logger } from "@/utils/logger";
import { formatDate as globalFormatDate } from "@/utils/dateTimeUtils";
const idTypes = [
  { name: "Aadhar", value: "aadhar" },
  { name: "PAN", value: "pan" },
  { name: "Voter ID", value: "voterid" },
];

const nomineeRelationship = [
  // { name: "Aadhar", value: "aadhar" },
  { name: "Father", value: "father" },
  { name: "Mother", value: "mother" },
  { name: "Brother", value: "brother" },
  { name: "Sister", value: "sister" },
  { name: "Son", value: "son" },
  { name: "Daughter", value: "daughter" },
  { name: "Spouse", value: "spouse" },
  { name: "Friend", value: "friend" },
  { name: "Relative", value: "relative" },
  { name: "Other", value: "other" },
  // { name: "PAN", value: "pan" },
  // { name: "Voter ID", value: "voterid" },
];

// Add interfaces at the top of the file
interface FormData {
  doorno: string;
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  dob: string;
  addressprooftype: string;
  idNumber: string;
  nominee_name: string;
  nominee_relationship: string;
}

interface PincodeData {
  Name: string;
  District: string;
  State: string;
  Circle: string;
  Division: string;
  Region: string;
  Block: string;
  Country: string;
  Pincode: string;
}

interface FormDatePickerProps {
  label: string;
  value: string;
  onDateChange: (date: string) => void;
  error?: string;
}

const formatDateToDDMMYYYY = (dateVal: string | Date | number | null | undefined): string => {
  if (!dateVal) return "";
  try {
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) {
      if (typeof dateVal === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal)) {
        return dateVal;
      }
      return "";
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};

export default function KycForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { language, user } = useGlobalStore();
  const { isVisible, visibleData } = useAppVisibility();
  const isShortKyc = isVisible("shortKyc");

  const [idTypesList, setIdTypesList] = useState(idTypes);

  useEffect(() => {
    let active = true;
    const fetchIdTypes = async () => {
      try {
        logger.log("📡 [API] Fetching dynamic ID proof types...");
        const response = await api.get("/config/kyc-doc-types");
        if (!active) return;

        let fetchedList = null;
        if (response?.data?.data && Array.isArray(response.data.data)) {
          fetchedList = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          fetchedList = response.data;
        }

        if (fetchedList && fetchedList.length > 0) {
          const mapped = fetchedList.map((item: any) => ({
            name: item.name || item.label || item.value,
            value: item.value,
          }));
          setIdTypesList(mapped);
          logger.log("✅ [API] Fetched ID proof types successfully:", mapped);
          return;
        }
      } catch (err) {
        logger.warn("⚠️ [API] Failed to fetch KYC proof types from /config/kyc-doc-types:", err);
      }

      try {
        const docTypesFromVis = (visibleData as any)?.kycDocTypes || (visibleData as any)?.kyc_doc_types;
        if (docTypesFromVis && Array.isArray(docTypesFromVis) && docTypesFromVis.length > 0) {
          const mapped = docTypesFromVis.map((item: any) => ({
            name: item.name || item.label || item.value,
            value: item.value,
          }));
          setIdTypesList(mapped);
          logger.log("✅ [Cache] Using ID proof types from visibility configuration:", mapped);
          return;
        }
      } catch (err) {
        logger.error("❌ Failed to parse doc types from visibility cache:", err);
      }

      logger.log("ℹ️ Using static fallback ID proof types");
    };

    fetchIdTypes();
    return () => {
      active = false;
    };
  }, [visibleData]);

  const [formData, setFormData] = useState<FormData>({
    doorno: "",
    street: "",
    area: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    dob: "",
    addressprooftype: "",
    idNumber: "",
    nominee_name: "",
    nominee_relationship: "",
  });

  const [activeSection, setActiveSection] = useState<'identity' | 'address' | 'nominee' | null>('identity');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [kycId, setKycId] = useState<string | null>(null);
  const [pincodeData, setPincodeData] = useState<PincodeData[]>([]);
  const [isLoadingPincode, setIsLoadingPincode] = useState(false);
  const [pincodeLookupFailed, setPincodeLookupFailed] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const isMountedRef = React.useRef(true); // Track component mount state for async operations

  const navBarHeight = 56; // Typical bottom nav bar height

  // Hardware back press override when navigated from profile
  useEffect(() => {
    const handleBackPress = () => {
      if (from === "profile") {
        router.replace("/(app)/(tabs)/profile");
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => backHandler.remove();
  }, [from, router]);

  const handleBack = () => {
    if (from === "profile") {
      router.replace("/(app)/(tabs)/profile");
    } else {
      router.back();
    }
  };

  // Cleanup on component unmount
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Keyboard listeners
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        if (isMountedRef.current) {
          setKeyboardVisible(true);
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        if (isMountedRef.current) {
          setKeyboardVisible(false);
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Fetch KYC details on mount
  useEffect(() => {
    const fetchKyc = async () => {
      try {
        const res = await api.get(`/kyc/status/${user?.id}`);
        // Check if component is still mounted before updating state
        if (isMountedRef.current && res.data && res.data.data) {
          const kycData = res.data.data;
          setKycId(kycData.id?.toString() || null);

          // Map the API response to form fields
          setFormData({
            doorno: kycData.doorno || "",
            street: kycData.street || "",
            area: kycData.area || "",
            city: kycData.city || "",
            district: kycData.district || "",
            state: kycData.state || "",
            country: kycData.country || "India",
            pincode: kycData.pincode || "",
            dob: formatDateToDDMMYYYY(kycData.dob),
            addressprooftype: kycData.addressproof || "",
            idNumber: kycData.enternumber || "",
            nominee_name: kycData.nominee_name || "",
            nominee_relationship: kycData.nominee_relationship || "",
          });
        }
      } catch (e) {
        logger.error("Error fetching KYC:", e);
        // Don't crash - just log the error
      }
    };
    fetchKyc();
  }, [user?.id]);

  // Function to fetch pincode data
  const fetchPincodeData = async (pincode: string) => {
    if (pincode.length !== 6) return;

    if (isMountedRef.current) {
      setIsLoadingPincode(true);
      setPincodeData([]);
      setPincodeLookupFailed(false);
    }

    try {
      const response = await api.get(`/pincode/${pincode}`);
      const responseData = response.data?.data ?? response.data;
      const pincodeResult = Array.isArray(responseData)
        ? responseData[0]
        : responseData;
      const postOffices = Array.isArray(pincodeResult?.PostOffice)
        ? pincodeResult.PostOffice
        : Array.isArray(responseData)
          ? responseData
          : [];

      if (!isMountedRef.current) return;

      if (
        pincodeResult &&
        (!pincodeResult.Status || pincodeResult.Status === "Success") &&
        postOffices.length > 0
      ) {
        setPincodeData(postOffices);

        const firstResult = postOffices[0];
        setFormData((prev) => ({
          ...prev,
          city: postOffices.length === 1 ? (firstResult.Name || firstResult.Block || firstResult.District) : "",
          district: firstResult.District,
          state: firstResult.State,
          country: firstResult.Country || "India",
        }));
      } else {
        setPincodeData([]);
        setPincodeLookupFailed(false);
        Alert.alert("Invalid Pincode", "Please enter a valid 6-digit pincode");
      }
    } catch {
      if (isMountedRef.current) {
        setPincodeData([]);
        setPincodeLookupFailed(true);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingPincode(false);
      }
    }
  };

  // Handle pincode change
  const handlePincodeChange = (text: string) => {
    handleChange("pincode", text);
    setPincodeLookupFailed(false);

    // Clear city when pincode changes
    if (text.length === 6) {
      setFormData((prev) => ({
        ...prev,
        city: "",
        district: "",
        state: "",
      }));
      fetchPincodeData(text);
    } else if (text.length < 6) {
      setPincodeData([]);
      setFormData((prev) => ({
        ...prev,
        city: "",
        district: "",
        state: "",
      }));
    }

    // Clear errors when pincode is being entered
    if (errors.pincode) {
      setErrors((prev) => ({ ...prev, pincode: "" }));
    }
  };

  // Handle city selection
  const handleCitySelection = (cityName: string) => {
    if (!isMountedRef.current) return;

    const selectedCityData = pincodeData.find((city) => city.Name === cityName);
    if (selectedCityData) {
      setFormData((prev) => ({
        ...prev,
        city: selectedCityData.Name,
        district: selectedCityData.District,
        state: selectedCityData.State,
        country: selectedCityData.Country,
      }));
    }
  };

  // Toggle manual/automatic address mode
  const toggleMode = () => {
    const newMode = !pincodeLookupFailed;
    setPincodeLookupFailed(newMode);
    if (!newMode && formData.pincode.length === 6) {
      fetchPincodeData(formData.pincode);
    }
  };

  // Update the FormDatePicker component with proper types
  const FormDatePicker: React.FC<FormDatePickerProps> = ({
    label,
    value,
    onDateChange,
    error,
  }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(
      value && value.length === 10 ? new Date(value.split("/").reverse().join("-")) : null
    );

    // Sync selectedDate state if value changes from parent (e.g. typing or loading)
    useEffect(() => {
      if (value && value.length === 10) {
        const parts = value.split("/");
        const dobDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(dobDate.getTime())) {
          setSelectedDate(dobDate);
        }
      }
    }, [value]);

    const handleDateChange = (event: any, date?: Date) => {
      if (date) {
        setSelectedDate(date);
        if (Platform.OS === "android") {
          setShowPicker(false);
          onDateChange(formatDate(date));
        }
      }
    };

    const handleIosConfirmation = () => {
      setShowPicker(false);
      if (selectedDate) {
        onDateChange(formatDate(selectedDate));
      }
    };

    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const handleTextChange = (text: string) => {
      // Remove any non-numeric characters
      let cleaned = text.replace(/[^0-9]/g, "");

      // Auto-format DD/MM/YYYY
      let formatted = "";
      if (cleaned.length > 0) {
        formatted += cleaned.substring(0, 2);
      }
      if (cleaned.length > 2) {
        formatted += "/" + cleaned.substring(2, 4);
      }
      if (cleaned.length > 4) {
        formatted += "/" + cleaned.substring(4, 8);
      }

      onDateChange(formatted);
    };

    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 100);

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);

    return (
      <View style={styles.formGroup}>
        <View style={styles.dateInputWrapper}>
          <TextInput
            style={styles.dateInput}
            value={value}
            onChangeText={handleTextChange}
            placeholder="DD/MM/YYYY"
            keyboardType="number-pad"
            maxLength={10}
            placeholderTextColor="gray"
          />
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              setShowPicker(!showPicker);
            }}
          >
            <Ionicons
              name="calendar"
              size={24}
              color="#007AFF"
              style={styles.calendarIcon}
            />
          </TouchableOpacity>
        </View>

        {showPicker && (
          <View>
            <DateTimePicker
              value={selectedDate || new Date(maxDate)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handleDateChange}
              minimumDate={minDate}
              maximumDate={maxDate}
              themeVariant="light"
            />

            {Platform.OS === "ios" && (
              <View style={styles.iosButtonContainer}>
                <TouchableOpacity
                  onPress={handleIosConfirmation}
                  style={styles.iosButton}
                >
                  <Text style={styles.buttonText}>Confirm Date</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  const handleChange = (field: string, value: string) => {
    logger.log("handleChange", field, value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for the field when the user starts typing/changing
    if (value) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Update the validateForm function to handle type safety
  const getIdentitySummary = () => {
    if (!formData.dob && !formData.addressprooftype && !formData.idNumber) {
      return "Click edit to fill identity details";
    }
    const dobText = formData.dob || "—";
    const typeText = formData.addressprooftype ? formData.addressprooftype.toUpperCase() : "—";
    const numText = formData.idNumber || "—";
    return `DOB: ${dobText} | ${typeText}: ${numText}`;
  };

  const getAddressSummary = () => {
    if (!formData.pincode && !formData.city && !formData.doorno && !formData.street) {
      return "Click edit to fill address details";
    }
    const door = formData.doorno ? `${formData.doorno}, ` : "";
    const street = formData.street ? `${formData.street}, ` : "";
    const area = formData.area ? `${formData.area}, ` : "";
    const city = formData.city ? `${formData.city}` : "";
    const pin = formData.pincode ? ` - ${formData.pincode}` : "";
    return `${door}${street}${area}${city}${pin}`;
  };

  const getNomineeSummary = () => {
    if (!formData.nominee_name && !formData.nominee_relationship) {
      return "Optional - Not added yet";
    }
    const name = formData.nominee_name || "—";
    const rel = formData.nominee_relationship ? formData.nominee_relationship.charAt(0).toUpperCase() + formData.nominee_relationship.slice(1) : "—";
    return `${name} (${rel})`;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Check for empty fields first, excluding nominee details
    Object.keys(formData).forEach((field) => {
      if (field === "nominee_name" || field === "nominee_relationship") {
        return; // Optional
      }
      if (isShortKyc) {
        // Only validate street (used for Full Address), dob, addressprooftype, idNumber
        const allowedShortFields = ["street", "dob", "addressprooftype", "idNumber"];
        if (!allowedShortFields.includes(field)) {
          return; // Skip individual address field validation
        }
      }
      // If pincode lookup succeeded, district, state, and country are filled in state,
      // so they shouldn't trigger an error. If lookup failed, they're typed manually.
      const value = formData[field as keyof FormData];
      if (typeof value === "string" && !value.trim()) {
        newErrors[field] = t("thisFieldIsRequired") || "This field is required";
      }
    });

    // Validate nominee consistency: if one is filled, both must be filled
    if (formData.nominee_name.trim() && !formData.nominee_relationship.trim()) {
      newErrors.nominee_relationship = t("pleaseSelectRelationship") || "Please select a relationship";
    }
    if (!formData.nominee_name.trim() && formData.nominee_relationship.trim()) {
      newErrors.nominee_name = t("pleaseEnterNomineeName") || "Please enter nominee name";
    }

    // Validate Date of Birth (DD/MM/YYYY)
    if (
      formData.dob &&
      !/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(formData.dob)
    ) {
      newErrors.dob = t("dobFormatError") || "Date of Birth must be in DD/MM/YYYY format";
    }

    // Validate age - must be 18 or older
    if (formData.dob) {
      try {
        const parts = formData.dob.split("/");
        const dobDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();

        // Adjust age if birthday hasn't occurred this year
        const actualAge =
          monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < dobDate.getDate())
            ? age - 1
            : age;

        if (actualAge < 18) {
          newErrors.dob = t("ageLimitError") || "You must be at least 18 years old to proceed";
        }
      } catch (error) {
        newErrors.dob = t("invalidDateFormat") || "Invalid date format";
      }
    }

    // Validate Pincode (must be 6 digits)
    if (!isShortKyc && formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = t("pincodeLengthError") || "Pincode must be 6 digits";
    }

    // Validate ID Number based on Address Proof Type
    if (formData.idNumber) {
      if (
        formData.addressprooftype === "aadhar" &&
        !/^\d{12}$/.test(formData.idNumber)
      ) {
        newErrors.idNumber = "Aadhar number must be 12 digits";
      } else if (
        formData.addressprooftype === "pan" &&
        !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.idNumber)
      ) {
        newErrors.idNumber =
          "PAN number must be in valid format (e.g., ABCDE1234F)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update the getPlaceholderText function with proper typing
  const getPlaceholderText = (idType: string): string => {
    const placeholders: { [key: string]: string } = {
      aadhar: t("kycAadhaarPlaceholder") || "Enter your 12-digit Aadhar number",
      pan: t("kycPanPlaceholder") || "Enter your PAN number (e.g., ABCDE1234F)",
      voterid: t("kycIdPlaceholderDefault") || "Enter your Voter ID number",
    };
    return placeholders[idType] || t("kycIdPlaceholderDefault") || "Enter your ID number";
  };

  // Update the formatIdNumber function with proper typing
  const formatIdNumber = (text: string, idType: string): string => {
    return idType === "pan" ? text.toUpperCase() : text;
  };

  // Update the getMaxLength function with proper typing
  const getMaxLength = (idType: string): number => {
    const maxLengths: { [key: string]: number } = {
      aadhar: 12,
      pan: 10,
      voterid: 10,
    };
    return maxLengths[idType] || 20;
  };

  const handleSubmit = async () => {
    const formatDateForSubmit = (dateStr: string) => {
      if (!dateStr) return "";
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        // convert DD/MM/YYYY to YYYY-MM-DD
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    };

    // Convert DOB to YYYY-MM-DD format only once and store
    const formattedDob = formatDateForSubmit(formData.dob);

    // Optionally, update UI to show formatted date in DD/MM/YYYY after patching
    // This step is optional since you already handle display formatting elsewhere
    setFormData((prev) => ({
      ...prev,
      dob: formattedDob.split("-").reverse().join("/"),
    }));

    if (validateForm()) {
      try {
        const requestBody = {
          user_id: user?.id || 2,
          doorno: isShortKyc ? "-" : formData.doorno,
          street: formData.street,
          area: isShortKyc ? "-" : formData.area,
          city: isShortKyc ? "-" : formData.city,
          district: isShortKyc ? "-" : formData.district,
          state: isShortKyc ? "-" : formData.state,
          country: isShortKyc ? "India" : formData.country,
          pincode: isShortKyc ? "000000" : formData.pincode,
          dob: formattedDob, // Use the formatted date here
          addressproof: formData.addressprooftype,
          enternumber: formData.idNumber,
          nominee_name: formData.nominee_name,
          nominee_relationship: formData.nominee_relationship,
        };

        const response = kycId
          ? await api.put(`/kyc/${kycId}`, requestBody)
          : await api.post("/kyc", requestBody);

        // Check if component is still mounted before showing alerts and navigating
        if (!isMountedRef.current) {
          logger.log("Component unmounted, skipping KYC submission response handling");
          return;
        }

        if (response.data?.data?.affectedRows > 0 || response.data?.data?.id) {
          const title = kycId 
            ? (t("kycUpdatedTitle") || "KYC Updated") 
            : (t("kycSubmittedTitle") || "KYC Submitted");

          const responseMsg = response.data?.message;
          let alertMsg = "";
          if (responseMsg === "KYC record updated successfully") {
            alertMsg = t("kycRecordUpdatedSuccess") || responseMsg;
          } else if (responseMsg === "KYC record created successfully" || responseMsg === "KYC details submitted successfully") {
            alertMsg = t("kycRecordSubmittedSuccess") || responseMsg;
          } else {
            alertMsg = responseMsg || 
              (kycId
                ? (t("kycUpdatedSuccess") || "Your KYC details have been updated successfully.")
                : (t("kycSubmittedSuccess") || "Your KYC details have been submitted successfully."));
          }

          Alert.alert(title, alertMsg);

          // Safe navigation with error handling
          try {
            if (!router) {
              logger.error("Router not available for navigation");
              return;
            }
            if (from === "profile") {
              router.replace("/(app)/(tabs)/profile");
            } else {
              router.back();
            }
          } catch (navError) {
            logger.error("Error navigating back after KYC submission:", navError);
            // Fallback: try to navigate to profile
            try {
              if (router && typeof router.replace === 'function') {
                router.replace("/(tabs)/profile");
              }
            } catch (fallbackError) {
              logger.error("Fallback navigation also failed:", fallbackError);
            }
          }
        } else {
          Alert.alert(t("error") || "Error", t("kycSubmissionFailed") || "KYC submission failed. Please try again.");
        }
      } catch (error: any) {
        logger.error("KYC Submission Error:", error);
        if (isMountedRef.current) {
          const errorMessage =
            error.response?.data?.message ||
            t("errorOccurred") || "An error occurred. Please try again.";
          Alert.alert(t("error") || "Error", errorMessage);
        }
      }
    } else {
      if (isMountedRef.current) {
        Alert.alert(t("error") || "Error", t("pleaseFixTheErrorInTheForm") || "Please fix the errors in the form.");
      }
    }
  };

  const handleGoToSchemes = () => {
    if (!isMountedRef.current) {
      logger.log("Component unmounted, skipping navigation to schemes");
      return;
    }

    try {
      if (!router || typeof router.replace !== 'function') {
        logger.error("Router not available for navigation");
        return;
      }
      router.replace("/(tabs)/savings");
    } catch (error) {
      logger.error("Error navigating to schemes:", error);
    }
  };

  const handleRetryPayment = async () => {
    // ... existing code ...
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        {/* Fixed Header */}
        <View style={[styles.header, Platform.OS === 'android' && { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{t("kycDetails")}</Text>
              <Text style={styles.headerSubtitle}>
                {t("updateYourPersonalDetails") || "Update your personal details"}
              </Text>
            </View>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: keyboardVisible ? 50 : 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Identity Details Section */}
          <View style={[styles.sectionCard, styles.activeSectionCard]}>
            <View style={styles.sectionHeaderClickable}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="card-outline" size={24} color="#bfa14a" />
                <View style={styles.sectionHeaderTitleContainer}>
                  <Text style={[styles.sectionTitle, { color: "#bfa14a" }]}>
                    Identity Details
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.formContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t("dateOfBirth") || "Date of Birth"} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                <FormDatePicker
                  label={t("dateOfBirth") || "Date of Birth"}
                  value={formData.dob}
                  onDateChange={(date) => handleChange("dob", date)}
                  error={errors.dob}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t("idProofType") || "ID Proof Type"} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                <Dropdown
                  style={[
                    styles.dropdown,
                    focusedField === "addressprooftype" &&
                    styles.dropdownFocused,
                  ]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={idTypesList.map((id) => ({
                    label: id.name,
                    value: id.value,
                  }))}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                              placeholder={t("kycSelectIdProof") || "Select your ID proof"}
                  value={formData.addressprooftype}
                  onFocus={() => setFocusedField("addressprooftype")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(item) => {
                    handleChange("addressprooftype", item.value);
                    setFocusedField(null);
                  }}
                />
                {errors.addressprooftype && (
                  <Text style={styles.errorText}>
                    {errors.addressprooftype}
                  </Text>
                )}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t("kycIdNumber") || "ID Number"} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor="gray"
                  placeholder={getPlaceholderText(
                    formData.addressprooftype
                  )}
                  value={formData.idNumber}
                  onChangeText={(text) =>
                    handleChange(
                      "idNumber",
                      formatIdNumber(text, formData.addressprooftype)
                    )
                  }
                  autoCapitalize={
                    formData.addressprooftype === "pan"
                      ? "characters"
                      : "none"
                  }
                  keyboardType={
                    formData.addressprooftype === "pan"
                      ? "default"
                      : "number-pad"
                  }
                  maxLength={getMaxLength(formData.addressprooftype)}
                />
                {errors.idNumber && (
                  <Text style={styles.errorText}>{errors.idNumber}</Text>
                )}
              </View>
            </View>
          </View>

          {/* 2. Address Details Section */}
          <View style={[styles.sectionCard, styles.activeSectionCard]}>
            <View style={styles.sectionHeaderClickable}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="home-outline" size={24} color="#1976d2" />
                <View style={styles.sectionHeaderTitleContainer}>
                  <Text style={[styles.sectionTitle, { color: "#1976d2" }]}>
                    {t("kycAddressDetails") || "Address Details"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.formContent}>
              {isShortKyc ? (
                /* Short KYC Address Form */
                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t("kycFullAddress") || "Full Address"} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                  <TextInput
                    style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 10 }]}
                    placeholder={t("kycFullAddressPlaceholder") || "Enter your full address (Door No, Street, City, Pincode)"}
                    placeholderTextColor="gray"
                    multiline={true}
                    numberOfLines={4}
                    value={formData.street}
                    onChangeText={(text) => handleChange("street", text)}
                  />
                  {errors.street && (
                    <Text style={styles.errorText}>{errors.street}</Text>
                  )}
                </View>
              ) : (
                /* Standard KYC Address Form */
                <>
                  {/* Pincode */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("kycPincode") || "Pincode"} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                    <View style={styles.pincodeContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder={t("kycPincodePlaceholder") || "Enter your 6-digit pincode"}
                        placeholderTextColor="gray"
                        keyboardType="number-pad"
                        value={formData.pincode}
                        onChangeText={handlePincodeChange}
                        maxLength={6}
                      />
                      {isLoadingPincode && (
                        <View style={styles.loadingIndicator}>
                          <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                      )}
                    </View>
                    {errors.pincode && (
                      <Text style={styles.errorText}>{errors.pincode}</Text>
                    )}
                    <TouchableOpacity 
                      onPress={toggleMode} 
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end', 
                        alignSelf: 'flex-end',
                        marginTop: 8,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                      }}
                    >
                      <Text style={{ color: "#1976d2", fontSize: 12, fontWeight: "600", marginRight: 4 }}>
                        {pincodeLookupFailed 
                          ? (t("switchToAutomaticMode") || "Switch to Automatic Mode") 
                          : (t("switchToManualMode") || "Switch to Manual Mode")
                        }
                      </Text>
                      <Ionicons 
                        name={pincodeLookupFailed ? "refresh-circle-outline" : "create-outline"} 
                        size={16} 
                        color="#1976d2" 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* City (Only show if pincode lookup succeeded or explicitly entered) */}
                  {(!isLoadingPincode || pincodeLookupFailed) && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>{t("kycCity") || "City"} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                      {!pincodeLookupFailed && pincodeData && pincodeData.length > 1 ? (
                        <Dropdown
                          style={[
                            styles.dropdown,
                            focusedField === "city" && styles.dropdownFocused,
                          ]}
                          placeholderStyle={styles.placeholderStyle}
                          selectedTextStyle={styles.selectedTextStyle}
                          data={pincodeData.map((po) => ({
                            label: po.Name,
                            value: po.Name,
                          }))}
                          maxHeight={300}
                          labelField="label"
                          valueField="value"
                          placeholder={t("kycCityPlaceholder") || "Select your city"}
                          value={formData.city}
                          onFocus={() => setFocusedField("city")}
                          onBlur={() => setFocusedField(null)}
                          onChange={(item) => {
                            handleCitySelection(item.value);
                            setFocusedField(null);
                          }}
                        />
                      ) : (
                        <TextInput
                          style={[
                            styles.input,
                            !pincodeLookupFailed && { opacity: 0.7, backgroundColor: "#f9f9f9" }
                          ]}
                          placeholder={
                            pincodeLookupFailed
                              ? (t("kycCityPlaceholder") || "Enter your city")
                              : (t("kycCityEnterPincodeFirst") || "Enter pincode first to select city")
                          }
                          value={formData.city}
                          editable={pincodeLookupFailed}
                          onChangeText={(text) => handleChange("city", text)}
                        />
                      )}
                    </View>
                  )}
                  {errors.city && (
                    <Text style={styles.errorText}>{errors.city}</Text>
                  )}

                  {/* District (Only show if pincode lookup succeeded or explicitly entered) */}
                  {(!isLoadingPincode || pincodeLookupFailed) && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>{t("kycDistrict") || "District"} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                      <TextInput
                        style={[
                          styles.input,
                          !pincodeLookupFailed && { opacity: 0.7, backgroundColor: "#f9f9f9" }
                        ]}
                        placeholder={t("kycDistrictPlaceholder") || "Enter your district"}
                        value={formData.district}
                        editable={pincodeLookupFailed}
                        onChangeText={(text) => handleChange("district", text)}
                      />
                      {errors.district && (
                        <Text style={styles.errorText}>{errors.district}</Text>
                      )}
                    </View>
                  )}

                  {/* State (Only show if pincode lookup succeeded or explicitly entered) */}
                  {(!isLoadingPincode || pincodeLookupFailed) && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>{t("kycState") || "State"} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                      <TextInput
                        style={[
                          styles.input,
                          !pincodeLookupFailed && { opacity: 0.7, backgroundColor: "#f9f9f9" }
                        ]}
                        placeholder={t("kycStatePlaceholder") || "Enter your state"}
                        value={formData.state}
                        editable={pincodeLookupFailed}
                        onChangeText={(text) => handleChange("state", text)}
                      />
                      {errors.state && (
                        <Text style={styles.errorText}>{errors.state}</Text>
                      )}
                    </View>
                  )}

                  {/* Door Number */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("kycDoorNo") || "Door No."} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t("kycDoorNoPlaceholder") || "Enter your door number"}
                      value={formData.doorno}
                      placeholderTextColor="gray"
                      onChangeText={(text) => handleChange("doorno", text)}
                    />
                    {errors.doorno && (
                      <Text style={styles.errorText}>{errors.doorno}</Text>
                    )}
                  </View>

                  {/* Street */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("kycStreet") || "Street"} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t("kycStreetPlaceholder") || "Enter your street name"}
                      placeholderTextColor="gray"
                      value={formData.street}
                      onChangeText={(text) => handleChange("street", text)}
                    />
                    {errors.street && (
                      <Text style={styles.errorText}>{errors.street}</Text>
                    )}
                  </View>

                  {/* Area */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("kycArea") || "Area"} <Text style={{ color: "#FF3B30" }}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t("kycAreaPlaceholder") || "Enter your area/locality"}
                      placeholderTextColor="gray"
                      value={formData.area}
                      onChangeText={(text) => handleChange("area", text)}
                    />
                    {errors.area && (
                      <Text style={styles.errorText}>{errors.area}</Text>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>

          {/* 3. Nominee Details Section */}
          <View style={[styles.sectionCard, styles.activeSectionCard]}>
            <View style={styles.sectionHeaderClickable}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="people-outline" size={24} color="#388e3c" />
                <View style={styles.sectionHeaderTitleContainer}>
                  <Text style={[styles.sectionTitle, { color: "#388e3c" }]}>
                    {t("kycNomineeDetails") || "Nominee Details (Optional)"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.formContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t("kycNomineeRelationship") || "Nominee Relationship"}</Text>
                <Dropdown
                  style={[
                    styles.dropdown,
                    focusedField === "nominee_relationship" &&
                    styles.dropdownFocused,
                  ]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={nomineeRelationship.map((id) => ({
                    label: id.name,
                    value: id.value,
                  }))}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder={t("kycSelectRelationship") || "Select relationship"}
                  value={formData.nominee_relationship}
                  onFocus={() => setFocusedField("nominee_relationship")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(item) => {
                    handleChange("nominee_relationship", item.value);
                    setFocusedField(null);
                  }}
                />
                {errors.nominee_relationship && (
                  <Text style={styles.errorText}>
                    {errors.nominee_relationship}
                  </Text>
                )}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t("kycNomineeName") || "Nominee Name"}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("kycNomineeNamePlaceholder") || "Enter your nominee's full name"}
                  placeholderTextColor="gray"
                  value={formData.nominee_name}
                  onChangeText={(text) =>
                    handleChange("nominee_name", text)
                  }
                />
                {errors.nominee_name && (
                  <Text style={styles.errorText}>
                    {errors.nominee_name}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.submitButton}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.submitButtonText}>
                  {kycId ? (t("updateKyc") || "Update KYC") : (t("submitKyc") || "Submit KYC")}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFC857"
                  style={styles.buttonIcon}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Extra space at the bottom */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.quaternary || "#F2E6D2",
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.quaternary || "#F2E6D2",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  headerRightPlaceholder: {
    width: 40,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingTop: 10,
  },
  mainCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  groupCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  formContent: {
    paddingHorizontal: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#333",
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#666",
  },
  pincodeContainer: {
    position: "relative",
  },
  loadingIndicator: {
    position: "absolute",
    right: 14,
    top: 14,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  loadingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  helpText: {
    color: "#666",
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  buttonContainer: {
    paddingVertical: 12,
    marginTop: 12,
    alignItems: "center",
  },
  submitButton: {
    width: "70%",
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  submitButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  bottomSpace: {
    height: 20,
  },
  groupAddress: {
    borderLeftWidth: 4,
    borderLeftColor: "#1976d2",
  },
  groupIdProof: {
    borderLeftWidth: 4,
    borderLeftColor: "#bfa14a",
  },
  groupNominee: {
    borderLeftWidth: 4,
    borderLeftColor: "#388e3c",
  },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
    backgroundColor: "#FFFFFF",
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 16,
  },
  calendarIcon: {
    marginLeft: 10,
    color: "#1976d2",
  },
  iosButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  iosButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  dropdown: {
    height: 55,
    backgroundColor: "#fff",
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dropdownFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "gray",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#333",
  },
  sectionHeaderClickable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionHeaderTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  sectionSummaryText: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  sectionContinueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionContinueButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 15,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    zIndex: 1,
    overflow: "visible",
  },
  activeSectionCard: {
    borderColor: "#bfa14a",
    borderWidth: 1.5,
    zIndex: 100,
    elevation: 10,
  },
});
