import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { moderateScale } from "react-native-size-matters";
import { useAppTheme } from "@/store/global.store";

export interface FormData {
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

export interface PincodeData {
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

export interface KycFormV2Props {
  formData: FormData;
  handleChange: (field: string, value: string) => void;
  handleSubmit: () => void;
  handleBack: () => void;
  activeSection: "identity" | "address" | "nominee" | null;
  setActiveSection: (section: "identity" | "address" | "nominee" | null) => void;
  errors: { [key: string]: string };
  pincodeData: PincodeData[];
  isLoadingPincode: boolean;
  pincodeLookupFailed: boolean;
  handlePincodeChange: (text: string) => void;
  handleCitySelection: (cityName: string) => void;
  idTypes: Array<{ name: string; value: string }>;
  nomineeRelationship: Array<{ name: string; value: string }>;
  kycId?: string | null;
  keyboardVisible?: boolean;
}

export const KycFormV2: React.FC<KycFormV2Props> = ({
  formData,
  handleChange,
  handleSubmit,
  handleBack,
  activeSection,
  setActiveSection,
  errors,
  pincodeData,
  isLoadingPincode,
  pincodeLookupFailed,
  handlePincodeChange,
  handleCitySelection,
  idTypes,
  nomineeRelationship,
  kycId,
  keyboardVisible = false,
}) => {
  const theme = useAppTheme();
  const primaryColor = theme.colors.primary || "#a3203a";

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Parse existing DOB or fallback to 18 years ago
  const getSelectedDob = (): Date => {
    if (formData.dob) {
      try {
        const parts = formData.dob.split("/");
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          if (!isNaN(d.getTime())) return d;
        }
      } catch {}
    }
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 18);
    return defaultDate;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const formatted = selectedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      handleChange("dob", formatted);
    }
  };

  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 18);
  const minDobDate = new Date();
  minDobDate.setFullYear(minDobDate.getFullYear() - 100);

  const formatIdNumber = (text: string, idType: string): string => {
    return idType === "pan" ? text.toUpperCase() : text;
  };

  const getMaxLength = (idType: string): number => {
    if (idType === "aadhar") return 12;
    if (idType === "pan") return 10;
    if (idType === "voterid") return 10;
    return 20;
  };

  return (
    <View style={styles.root}>
      {/* Background Soft Glow & Top Right Artwork */}
      <LinearGradient
        colors={["#FFFDF8", "#FAF4E8", "#F6EED8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.6 }}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={primaryColor} />
          </TouchableOpacity>

          {/* Header Title & Subtitle */}
          <View style={styles.headerTitleBox}>
            <Text style={[styles.mainTitle, { color: primaryColor }]}>KYC Details</Text>
            <Text style={styles.subTitle}>Update your personal information</Text>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#D97706" />
              <Text style={styles.trustText}>Your details are safe and secured with us</Text>
            </View>
          </View>

          {/* 3D Golden Shield & Digital ID Artwork */}
          <View style={styles.headerArtworkContainer}>
            <Image
              source={require("../../../assets/images/kyc/kyc_shield.jpg")}
              style={styles.headerShieldImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardVisible ? 90 : 36 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ========================================================
              SECTION 1: IDENTITY DETAILS (Active by default)
             ======================================================== */}
          <View style={styles.sectionContainer}>
            {activeSection === "identity" ? (
              <View style={styles.activeCard}>
                {/* Active Crimson Header */}
                <LinearGradient
                  colors={[primaryColor, "#580A18"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeHeaderGradient}
                >
                  <View style={styles.activeHeaderLeft}>
                    <View style={styles.activeIconBadge}>
                      <Ionicons name="card" size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.activeHeaderTextContainer}>
                      <Text style={styles.activeHeaderTitle}>Identity Details</Text>
                      <Text style={styles.activeHeaderSubtitle}>Add your basic information</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.chevronCircle}
                    onPress={() => setActiveSection(null)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-up" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>

                {/* Expanded Form Content */}
                <View style={styles.formBody}>
                  {/* Field 1: Date of Birth */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <View style={styles.fieldIconCircle}>
                        <Ionicons name="calendar-outline" size={15} color={primaryColor} />
                      </View>
                      <Text style={styles.fieldLabel}>Date of Birth</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.inputBox,
                        focusedField === "dob" && styles.inputFocused,
                        errors.dob ? styles.inputError : null,
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.dateValueText,
                          !formData.dob && styles.placeholderText,
                        ]}
                      >
                        {formData.dob || "DD / MM / YYYY"}
                      </Text>
                      <Ionicons name="calendar" size={18} color={primaryColor} />
                    </TouchableOpacity>
                    {errors.dob ? <Text style={styles.errorText}>{errors.dob}</Text> : null}

                    {showDatePicker && (
                      <DateTimePicker
                        value={getSelectedDob()}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleDateChange}
                        minimumDate={minDobDate}
                        maximumDate={maxDobDate}
                        themeVariant="light"
                      />
                    )}
                  </View>

                  {/* Field 2: Address Proof Type */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <View style={styles.fieldIconCircle}>
                        <Ionicons name="document-text-outline" size={15} color={primaryColor} />
                      </View>
                      <Text style={styles.fieldLabel}>Address Proof Type</Text>
                    </View>

                    <Dropdown
                      style={[
                        styles.dropdownBox,
                        focusedField === "addressprooftype" && styles.inputFocused,
                        errors.addressprooftype ? styles.inputError : null,
                      ]}
                      placeholderStyle={styles.placeholderText}
                      selectedTextStyle={styles.inputText}
                      data={idTypes.map((id) => ({
                        label: id.name,
                        value: id.value,
                      }))}
                      maxHeight={260}
                      labelField="label"
                      valueField="value"
                      placeholder="Select your ID proof"
                      value={formData.addressprooftype}
                      onFocus={() => setFocusedField("addressprooftype")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(item) => {
                        handleChange("addressprooftype", item.value);
                        setFocusedField(null);
                      }}
                      renderRightIcon={() => (
                        <Ionicons name="chevron-down" size={16} color="#64748B" />
                      )}
                    />
                    {errors.addressprooftype ? (
                      <Text style={styles.errorText}>{errors.addressprooftype}</Text>
                    ) : null}
                  </View>

                  {/* Field 3: ID Number */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <View style={styles.fieldIconCircle}>
                        <Text style={[styles.fieldHashText, { color: primaryColor }]}>#</Text>
                      </View>
                      <Text style={styles.fieldLabel}>ID Number</Text>
                    </View>

                    <TextInput
                      style={[
                        styles.inputBox,
                        styles.textInputStyle,
                        focusedField === "idNumber" && styles.inputFocused,
                        errors.idNumber ? styles.inputError : null,
                      ]}
                      placeholder="Enter your ID number"
                      placeholderTextColor="#94A3B8"
                      value={formData.idNumber}
                      onFocus={() => setFocusedField("idNumber")}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(text) =>
                        handleChange("idNumber", formatIdNumber(text, formData.addressprooftype))
                      }
                      autoCapitalize={formData.addressprooftype === "pan" ? "characters" : "none"}
                      keyboardType={formData.addressprooftype === "pan" ? "default" : "number-pad"}
                      maxLength={getMaxLength(formData.addressprooftype)}
                    />
                    {errors.idNumber ? (
                      <Text style={styles.errorText}>{errors.idNumber}</Text>
                    ) : null}
                  </View>

                  {/* Confidentiality Notice */}
                  <View style={styles.confidentialNotice}>
                    <Ionicons name="shield-checkmark" size={18} color="#D97706" />
                    <Text style={styles.confidentialText}>
                      Your details are used only for KYC verification and will be kept confidential.
                    </Text>
                  </View>

                  {/* Action Button: Continue to Address */}
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => setActiveSection("address")}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#580A18"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.continueGradient}
                    >
                      <Text style={styles.continueButtonText}>Continue to Address</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Collapsed Identity Section */
              <TouchableOpacity
                style={styles.collapsedCard}
                onPress={() => setActiveSection("identity")}
                activeOpacity={0.85}
              >
                <View style={styles.collapsedHeaderLeft}>
                  <View style={[styles.collapsedIconBadge, { backgroundColor: "#FDF2F4" }]}>
                    <Ionicons name="card" size={18} color={primaryColor} />
                  </View>
                  <View>
                    <Text style={styles.collapsedTitle}>Identity Details</Text>
                    <Text style={styles.collapsedSubtitle}>
                      {formData.dob && formData.idNumber
                        ? `${formData.addressprooftype.toUpperCase() || "ID"}: ${formData.idNumber}`
                        : "Add your basic information"}
                    </Text>
                  </View>
                </View>
                <View style={styles.collapsedChevron}>
                  <Ionicons name="chevron-down" size={18} color="#64748B" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* ========================================================
              SECTION 2: ADDRESS DETAILS (Collapsed or Active)
             ======================================================== */}
          <View style={styles.sectionContainer}>
            {activeSection === "address" ? (
              <View style={styles.activeCard}>
                {/* Active Header for Address */}
                <LinearGradient
                  colors={[primaryColor, "#580A18"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeHeaderGradient}
                >
                  <View style={styles.activeHeaderLeft}>
                    <View style={styles.activeIconBadge}>
                      <Ionicons name="home" size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.activeHeaderTextContainer}>
                      <Text style={styles.activeHeaderTitle}>Address Details</Text>
                      <Text style={styles.activeHeaderSubtitle}>Provide your current address</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.chevronCircle}
                    onPress={() => setActiveSection(null)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-up" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>

                {/* Expanded Address Form Content */}
                <View style={styles.formBody}>
                  {/* Pincode with Auto-Lookup */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <View style={styles.fieldIconCircle}>
                        <Ionicons name="navigate-outline" size={15} color={primaryColor} />
                      </View>
                      <Text style={styles.fieldLabel}>Pincode</Text>
                    </View>
                    <View style={styles.pincodeInputRow}>
                      <TextInput
                        style={[
                          styles.inputBox,
                          styles.textInputStyle,
                          styles.pincodeInput,
                          focusedField === "pincode" && styles.inputFocused,
                          errors.pincode ? styles.inputError : null,
                        ]}
                        placeholder="Enter 6-digit pincode"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        value={formData.pincode}
                        onChangeText={handlePincodeChange}
                        maxLength={6}
                        onFocus={() => setFocusedField("pincode")}
                        onBlur={() => setFocusedField(null)}
                      />
                      {isLoadingPincode && (
                        <View style={styles.pincodeLoadingBadge}>
                          <Text style={styles.pincodeLoadingText}>Checking...</Text>
                        </View>
                      )}
                    </View>
                    {errors.pincode ? (
                      <Text style={styles.errorText}>{errors.pincode}</Text>
                    ) : null}
                  </View>

                  {/* City (Dropdown if postal lookup, or input if failed) */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <View style={styles.fieldIconCircle}>
                        <Ionicons name="business-outline" size={15} color={primaryColor} />
                      </View>
                      <Text style={styles.fieldLabel}>City / Town</Text>
                    </View>
                    {pincodeData.length > 0 ? (
                      <Dropdown
                        style={[
                          styles.dropdownBox,
                          focusedField === "city" && styles.inputFocused,
                          errors.city ? styles.inputError : null,
                        ]}
                        placeholderStyle={styles.placeholderText}
                        selectedTextStyle={styles.inputText}
                        data={pincodeData.map((city) => ({
                          label: city.Name,
                          value: city.Name,
                        }))}
                        maxHeight={260}
                        labelField="label"
                        valueField="value"
                        placeholder="Select your city"
                        value={formData.city}
                        onFocus={() => setFocusedField("city")}
                        onBlur={() => setFocusedField(null)}
                        onChange={(item) => {
                          handleCitySelection(item.value);
                          setFocusedField(null);
                        }}
                        renderRightIcon={() => (
                          <Ionicons name="chevron-down" size={16} color="#64748B" />
                        )}
                      />
                    ) : (
                      <TextInput
                        style={[
                          styles.inputBox,
                          styles.textInputStyle,
                          focusedField === "city" && styles.inputFocused,
                          errors.city ? styles.inputError : null,
                        ]}
                        placeholder={
                          pincodeLookupFailed
                            ? "Enter your city"
                            : "Enter 6-digit pincode first"
                        }
                        placeholderTextColor="#94A3B8"
                        value={formData.city}
                        editable={pincodeLookupFailed || formData.pincode.length === 6}
                        onChangeText={(text) => handleChange("city", text)}
                        onFocus={() => setFocusedField("city")}
                        onBlur={() => setFocusedField(null)}
                      />
                    )}
                    {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
                  </View>

                  {/* Door Number */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <View style={styles.fieldIconCircle}>
                        <Ionicons name="home-outline" size={15} color={primaryColor} />
                      </View>
                      <Text style={styles.fieldLabel}>Door No. / Flat No.</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.inputBox,
                        styles.textInputStyle,
                        focusedField === "doorno" && styles.inputFocused,
                        errors.doorno ? styles.inputError : null,
                      ]}
                      placeholder="e.g. 12/4B, Sunshine Apts"
                      placeholderTextColor="#94A3B8"
                      value={formData.doorno}
                      onChangeText={(text) => handleChange("doorno", text)}
                      onFocus={() => setFocusedField("doorno")}
                      onBlur={() => setFocusedField(null)}
                    />
                    {errors.doorno ? (
                      <Text style={styles.errorText}>{errors.doorno}</Text>
                    ) : null}
                  </View>

                  {/* Street */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <View style={styles.fieldIconCircle}>
                        <Ionicons name="trail-sign-outline" size={15} color={primaryColor} />
                      </View>
                      <Text style={styles.fieldLabel}>Street / Road Name</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.inputBox,
                        styles.textInputStyle,
                        focusedField === "street" && styles.inputFocused,
                        errors.street ? styles.inputError : null,
                      ]}
                      placeholder="e.g. Gandhi Street"
                      placeholderTextColor="#94A3B8"
                      value={formData.street}
                      onChangeText={(text) => handleChange("street", text)}
                      onFocus={() => setFocusedField("street")}
                      onBlur={() => setFocusedField(null)}
                    />
                    {errors.street ? (
                      <Text style={styles.errorText}>{errors.street}</Text>
                    ) : null}
                  </View>

                  {/* Area */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <View style={styles.fieldIconCircle}>
                        <Ionicons name="location-outline" size={15} color={primaryColor} />
                      </View>
                      <Text style={styles.fieldLabel}>Area / Locality</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.inputBox,
                        styles.textInputStyle,
                        focusedField === "area" && styles.inputFocused,
                        errors.area ? styles.inputError : null,
                      ]}
                      placeholder="e.g. Alangulam"
                      placeholderTextColor="#94A3B8"
                      value={formData.area}
                      onChangeText={(text) => handleChange("area", text)}
                      onFocus={() => setFocusedField("area")}
                      onBlur={() => setFocusedField(null)}
                    />
                    {errors.area ? <Text style={styles.errorText}>{errors.area}</Text> : null}
                  </View>

                  {/* Action Button: Continue to Nominee */}
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => setActiveSection("nominee")}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#580A18"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.continueGradient}
                    >
                      <Text style={styles.continueButtonText}>Continue to Nominee</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Collapsed Address Section (Sky-Blue theme with 3D House) */
              <TouchableOpacity
                style={styles.collapsedSkyCard}
                onPress={() => setActiveSection("address")}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={["#F0F9FF", "#E0F2FE"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.collapsedGradientContainer}
                >
                  <View style={styles.collapsedHeaderLeft}>
                    <View style={[styles.collapsedIconBadge, { backgroundColor: "#E0F2FE" }]}>
                      <Ionicons name="home-outline" size={20} color="#0284C7" />
                    </View>
                    <View style={styles.collapsedTextWrapper}>
                      <Text style={styles.collapsedTitle}>Address Details</Text>
                      <Text style={styles.collapsedSubtitle} numberOfLines={1}>
                        {formData.pincode && formData.city
                          ? `${formData.city} - ${formData.pincode}`
                          : "Provide your current address"}
                      </Text>
                    </View>
                  </View>

                  {/* 3D House Artwork */}
                  <View style={styles.artworkWrapper}>
                    <Image
                      source={require("../../../assets/images/kyc/kyc_house.jpg")}
                      style={styles.illustrationImage}
                      resizeMode="contain"
                    />
                    <View style={styles.circleChevronButton}>
                      <Ionicons name="chevron-down" size={16} color="#0284C7" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* ========================================================
              SECTION 3: NOMINEE DETAILS (Optional)
             ======================================================== */}
          <View style={styles.sectionContainer}>
            {activeSection === "nominee" ? (
              <View style={styles.activeCard}>
                {/* Active Header for Nominee */}
                <LinearGradient
                  colors={[primaryColor, "#580A18"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeHeaderGradient}
                >
                  <View style={styles.activeHeaderLeft}>
                    <View style={styles.activeIconBadge}>
                      <Ionicons name="people" size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.activeHeaderTextContainer}>
                      <Text style={styles.activeHeaderTitle}>Nominee Details (Optional)</Text>
                      <Text style={styles.activeHeaderSubtitle}>Add nominee for your scheme</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.chevronCircle}
                    onPress={() => setActiveSection(null)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-up" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>

                {/* Expanded Nominee Form Content */}
                <View style={styles.formBody}>
                  {/* Nominee Name */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <View style={styles.fieldIconCircle}>
                        <Ionicons name="person-outline" size={15} color={primaryColor} />
                      </View>
                      <Text style={styles.fieldLabel}>Nominee Full Name</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.inputBox,
                        styles.textInputStyle,
                        focusedField === "nominee_name" && styles.inputFocused,
                        errors.nominee_name ? styles.inputError : null,
                      ]}
                      placeholder="Enter nominee name"
                      placeholderTextColor="#94A3B8"
                      value={formData.nominee_name}
                      onChangeText={(text) => handleChange("nominee_name", text)}
                      onFocus={() => setFocusedField("nominee_name")}
                      onBlur={() => setFocusedField(null)}
                    />
                    {errors.nominee_name ? (
                      <Text style={styles.errorText}>{errors.nominee_name}</Text>
                    ) : null}
                  </View>

                  {/* Nominee Relationship */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <View style={styles.fieldIconCircle}>
                        <Ionicons name="heart-outline" size={15} color={primaryColor} />
                      </View>
                      <Text style={styles.fieldLabel}>Relationship with Nominee</Text>
                    </View>

                    <Dropdown
                      style={[
                        styles.dropdownBox,
                        focusedField === "nominee_relationship" && styles.inputFocused,
                        errors.nominee_relationship ? styles.inputError : null,
                      ]}
                      placeholderStyle={styles.placeholderText}
                      selectedTextStyle={styles.inputText}
                      data={nomineeRelationship.map((r) => ({
                        label: r.name,
                        value: r.value,
                      }))}
                      maxHeight={260}
                      labelField="label"
                      valueField="value"
                      placeholder="Select relationship"
                      value={formData.nominee_relationship}
                      onFocus={() => setFocusedField("nominee_relationship")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(item) => {
                        handleChange("nominee_relationship", item.value);
                        setFocusedField(null);
                      }}
                      renderRightIcon={() => (
                        <Ionicons name="chevron-down" size={16} color="#64748B" />
                      )}
                    />
                    {errors.nominee_relationship ? (
                      <Text style={styles.errorText}>{errors.nominee_relationship}</Text>
                    ) : null}
                  </View>

                  {/* Final Submit Button */}
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleSubmit}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#580A18"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.continueGradient}
                    >
                      <Text style={styles.continueButtonText}>
                        {kycId ? "Update KYC Details" : "Submit KYC Verification"}
                      </Text>
                      <Ionicons name="checkmark-circle" size={18} color="#FACC15" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Collapsed Nominee Section (Emerald-Green theme with 3D Family) */
              <TouchableOpacity
                style={styles.collapsedMintCard}
                onPress={() => setActiveSection("nominee")}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={["#F0FDF4", "#DCFCE7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.collapsedGradientContainer}
                >
                  <View style={styles.collapsedHeaderLeft}>
                    <View style={[styles.collapsedIconBadge, { backgroundColor: "#DCFCE7" }]}>
                      <Ionicons name="people-outline" size={20} color="#16A34A" />
                    </View>
                    <View style={styles.collapsedTextWrapper}>
                      <Text style={styles.collapsedTitle}>Nominee Details (Optional)</Text>
                      <Text style={styles.collapsedSubtitle} numberOfLines={1}>
                        {formData.nominee_name
                          ? `${formData.nominee_name} (${formData.nominee_relationship || "Nominee"})`
                          : "Add nominee for your scheme"}
                      </Text>
                    </View>
                  </View>

                  {/* 3D Nominee Artwork */}
                  <View style={styles.artworkWrapper}>
                    <Image
                      source={require("../../../assets/images/kyc/kyc_nominee.jpg")}
                      style={styles.illustrationImage}
                      resizeMode="contain"
                    />
                    <View style={styles.circleChevronButton}>
                      <Ionicons name="chevron-down" size={16} color="#16A34A" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  keyboardContainer: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(14),
    paddingTop: Platform.OS === "ios" ? moderateScale(10) : moderateScale(14),
    paddingBottom: moderateScale(12),
    position: "relative",
  },
  backButton: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(163, 32, 58, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  headerTitleBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: moderateScale(8),
  },
  mainTitle: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subTitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  trustText: {
    fontSize: moderateScale(10),
    color: "#78716C",
    fontWeight: "600",
  },
  headerArtworkContainer: {
    position: "absolute",
    right: moderateScale(6),
    top: moderateScale(2),
    width: moderateScale(65),
    height: moderateScale(65),
    opacity: 0.95,
  },
  headerShieldImage: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(12),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(6),
  },
  sectionContainer: {
    marginBottom: moderateScale(14),
  },

  /* Active Card Styles */
  activeCard: {
    borderRadius: moderateScale(18),
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(163, 32, 58, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  activeHeaderGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
  },
  activeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    flex: 1,
  },
  activeIconBadge: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  activeHeaderTextContainer: {
    flex: 1,
  },
  activeHeaderTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  activeHeaderSubtitle: {
    fontSize: moderateScale(11),
    color: "rgba(255, 255, 255, 0.82)",
    marginTop: 1,
  },
  chevronCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Form Body */
  formBody: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(16),
  },
  fieldGroup: {
    marginBottom: moderateScale(14),
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: moderateScale(6),
  },
  fieldIconCircle: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: "#FDF2F4",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldHashText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  fieldLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1E293B",
  },
  inputBox: {
    height: moderateScale(46),
    borderRadius: moderateScale(12),
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: moderateScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textInputStyle: {
    fontSize: moderateScale(13),
    color: "#0F172A",
    fontWeight: "500",
  },
  inputFocused: {
    borderColor: "#a3203a",
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  dropdownBox: {
    height: moderateScale(46),
    borderRadius: moderateScale(12),
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: moderateScale(14),
  },
  inputText: {
    fontSize: moderateScale(13),
    color: "#0F172A",
    fontWeight: "500",
  },
  placeholderText: {
    fontSize: moderateScale(13),
    color: "#94A3B8",
  },
  dateValueText: {
    fontSize: moderateScale(13),
    color: "#0F172A",
    fontWeight: "500",
  },
  errorText: {
    color: "#EF4444",
    fontSize: moderateScale(10.5),
    marginTop: 4,
    marginLeft: 4,
  },

  /* Pincode Row */
  pincodeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  pincodeInput: {
    flex: 1,
  },
  pincodeLoadingBadge: {
    position: "absolute",
    right: 12,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pincodeLoadingText: {
    fontSize: moderateScale(10),
    color: "#D97706",
    fontWeight: "600",
  },

  /* Confidential Notice */
  confidentialNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9EE",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    gap: moderateScale(8),
    marginVertical: moderateScale(8),
  },
  confidentialText: {
    flex: 1,
    fontSize: moderateScale(11),
    color: "#92400E",
    lineHeight: moderateScale(15),
    fontWeight: "500",
  },

  /* Continue / Submit Button */
  continueButton: {
    borderRadius: moderateScale(24),
    overflow: "hidden",
    marginTop: moderateScale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  continueGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: moderateScale(48),
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(20),
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* Collapsed Generic Card */
  collapsedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  collapsedHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    flex: 1,
  },
  collapsedIconBadge: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  collapsedTextWrapper: {
    flex: 1,
  },
  collapsedTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#0F172A",
  },
  collapsedSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: 2,
  },
  collapsedChevron: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Collapsed Sky-Blue Card (Address) */
  collapsedSkyCard: {
    borderRadius: moderateScale(18),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.25)",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  /* Collapsed Mint-Green Card (Nominee) */
  collapsedMintCard: {
    borderRadius: moderateScale(18),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.25)",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  collapsedGradientContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
  },
  artworkWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  illustrationImage: {
    width: moderateScale(60),
    height: moderateScale(54),
    borderRadius: moderateScale(8),
  },
  circleChevronButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default KycFormV2;
