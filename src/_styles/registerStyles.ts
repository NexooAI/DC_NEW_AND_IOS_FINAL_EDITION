import { StyleSheet, Platform, Dimensions } from "react-native";
import { theme } from "@/constants/theme";

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isSmallScreen = screenHeight < 700;
const isMediumScreen = screenHeight >= 700 && screenHeight < 800;
const isLargeScreen = screenHeight >= 800;

export const registerStyles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: "cover",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.transparent, // Adjust opacity as needed
    zIndex: 0,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    paddingHorizontal: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 0,
    paddingBottom: Platform.OS === "ios" ? 40 : 60,
    minHeight: '100%',
  },
  formContainer: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    borderRadius: Math.min(16, screenWidth * 0.04),
    padding: Math.min(16, screenWidth * 0.04),
    paddingBottom: Math.min(20, screenWidth * 0.05),
    width: "100%",
    maxWidth: Math.min(400, screenWidth * 0.9),
    alignSelf: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteLight,
    marginBottom: Math.min(8, screenWidth * 0.02),
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadowBlack,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        backdropFilter: "blur(12px)",
      },
      android: {
        elevation: 6,
        shadowColor: theme.colors.shadowBlack,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
    position: "relative",
  },
  cardContent: {
    position: "relative",
    zIndex: 1,
    paddingVertical: Math.min(16, screenWidth * 0.04),
    paddingHorizontal: Math.min(20, screenWidth * 0.05),
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    color: theme.colors.white,
    fontSize: Math.min(24, screenWidth * 0.06),
    fontWeight: "bold",
    marginBottom: Math.min(4, screenWidth * 0.02),
    textAlign: "center",
    lineHeight: Math.min(28, screenWidth * 0.07),
    paddingHorizontal: Math.min(20, screenWidth * 0.05),
  },
  subtitle: {
    color: theme.colors.white,
    fontSize: Math.min(18, screenWidth * 0.045),
    marginBottom: Math.min(10, screenWidth * 0.05),
    textAlign: "center",
    opacity: 0.9,
    lineHeight: Math.min(20, screenWidth * 0.05),
    paddingHorizontal: Math.min(8, screenWidth * 0.02),
    flexWrap: "wrap",
    maxWidth: "100%",
    width: "100%",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 6,
  },
  loginButton: {
    width: "100%",
    maxWidth: Math.min(300, screenWidth * 0.75),
    height: Math.min(50, screenWidth * 0.125),
    borderRadius: Math.min(25, screenWidth * 0.06),
    overflow: "hidden",
    marginTop: Math.min(8, screenWidth * 0.02),
    alignSelf: "center",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadowBlack,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: theme.colors.primary,
    fontSize: Math.min(20, screenWidth * 0.05),
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: Math.min(20, screenWidth * 0.05),
    paddingHorizontal: Math.min(8, screenWidth * 0.02),
  },
  otpContainer: {
    alignItems: "center",
    marginVertical: 4,
    width: "100%",
    paddingVertical: 16, // Added for more vertical space
    minHeight: 220, // Ensures enough space for small screens
  },
  otpTitle: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
    lineHeight: isSmallScreen ? 24 : isMediumScreen ? 26 : 28,
  },
  otpSentText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
    marginBottom: 10,
    opacity: 0.8,
    textAlign: "center",
    flex: 1,
    lineHeight: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  },
  otpSentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  editIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  otpInputsWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Math.min(12, screenWidth * 0.03),
    minHeight: Math.min(80, screenWidth * 0.2),
    paddingHorizontal: Math.min(20, screenWidth * 0.05),
    paddingRight: Math.min(50, screenWidth * 0.125),
    position: 'relative',
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '85%', // Increased width for better visibility
    maxWidth: Math.min(320, screenWidth * 0.8),
    minWidth: Math.min(180, screenWidth * 0.45),
    alignSelf: 'center',
    gap: Math.min(8, screenWidth * 0.02), // Responsive gap
  },
  otpInput: {
    width: Math.min(48, screenWidth * 0.12),
    height: Math.min(48, screenWidth * 0.12),
    borderWidth: 1,
    borderColor: theme.colors.bgBlackLight,
    borderRadius: Math.min(10, screenWidth * 0.025),
    color: theme.colors.black,
    fontSize: Math.min(22, screenWidth * 0.055),
    backgroundColor: theme.colors.white,
    textAlign: 'center',
    marginHorizontal: Math.min(4, screenWidth * 0.01), // Responsive margin
    fontWeight: '600',
  },
  eyeButton: {
    position: "absolute",
    right: Math.min(-35, -screenWidth * 0.09),
    top: Math.min(15, screenWidth * 0.038),
    padding: Math.min(6, screenWidth * 0.015),
    zIndex: 10,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  timerText: {
    color: theme.colors.white,
    marginLeft: 8,
    fontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
    opacity: 0.8,
    textAlign: "center",
    flex: 1,
    lineHeight: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  },
  resendButton: {
    marginTop: isSmallScreen ? 8 : 10,
    paddingVertical: isSmallScreen ? 8 : 10,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    borderRadius: isSmallScreen ? 16 : 20,
    backgroundColor: "rgba(255, 201, 12, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 201, 12, 0.3)",
    minHeight: isSmallScreen ? 36 : 40,
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    color: theme.colors.secondary,
    fontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
    textAlign: "center",
    lineHeight: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
    opacity: 0.8,
    textAlign: "center",
    lineHeight: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  },
  registerLink: {
    color: theme.colors.link,
    fontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginLeft: 4,
    textAlign: "center",
    lineHeight: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  },
  errorAlert: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.bgErrorMedium,
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    shadowColor: theme.colors.shadowBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  errorMessage: {
    color: theme.colors.white,
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  poweredByContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  poweredByText: {
    color: theme.colors.primary,
    fontSize: 14,
    opacity: 0.7,
    letterSpacing: 1,
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 40 : 40,
    marginBottom: 30,
    marginTop: 0,
  },
  logo: {
    width: Platform.OS === "ios" ? 220 : 240,
    height: Platform.OS === "ios" ? 220 : 240,
    aspectRatio: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: theme.colors.white,
    fontSize: 16,
    opacity: 0.8,
  },
  footerLink: {
    color: theme.colors.link,
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginLeft: 4,
  },
  errorText: {
    color: theme.colors.textError,
    fontSize: isSmallScreen ? 11 : isMediumScreen ? 12 : 13,
    marginTop: 4,
    marginLeft: 4,
    textAlign: "left",
    lineHeight: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
  },
  mpinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    alignSelf: "center",
  },
  inputWrapper: {
    position: "relative",
  },
  mpinInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: theme.colors.borderWhiteLight,
    borderRadius: 15,
    backgroundColor: theme.colors.bgWhiteVeryHeavy,
    color: theme.colors.black,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
    shadowColor: theme.colors.shadowBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mpinInputEmpty: {
    borderColor: theme.colors.borderWhiteLight,
    backgroundColor: theme.colors.bgWhiteVeryHeavy,
  },
  mpinInputFilled: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.white,
    shadowColor: theme.colors.shadowGold,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  inputIndicator: {
    position: "absolute",
    bottom: 10,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.black,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgErrorLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    color: theme.colors.white,
    fontSize: 14,
    marginBottom: 8,
    alignSelf: "center",
    textAlign: "center",
  },
  eyeToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    alignSelf: "center",
  },
  eyeText: {
    color: theme.colors.secondary,
    marginLeft: 10,
    fontSize: 16,
  },
  submitButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadowBlack,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.colors.textDark,
    fontSize: isSmallScreen ? 16 : isMediumScreen ? 17 : 18,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
  },
  backButton: {
    marginTop: isSmallScreen ? 12 : 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isSmallScreen ? 10 : 12,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    borderRadius: isSmallScreen ? 20 : 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    minHeight: isSmallScreen ? 40 : 44,
    flexWrap: "wrap",
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
    marginLeft: 8,
    fontWeight: "500",
    opacity: 0.9,
    textAlign: "center",
    flexShrink: 1,
    lineHeight: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  },

});
// You'll need to update your registerStyles.ts file with the new styles or add them here.
// For demonstration, I'm adding them directly.
// Ensure your existing registerStyles are merged with these new ones.
export const newRegisterStyles = StyleSheet.create({
  // Add or modify these styles in your _styles/registerStyles.ts file
  mobileInputTopRight: {
    alignSelf: 'flex-end', // Aligns the PhoneInput to the right
    marginTop: -80, // Adjust as needed to move it up
    marginBottom: 20, // Adjust spacing below it
    width: 'auto', // Allow it to shrink to content
    position: 'absolute', // Position it absolutely
    top: 20, // Adjust top position
    right: 20, // Adjust right position
    zIndex: 5, // Bring it to front
    backgroundColor: theme.colors.overlayDark, // Optional: Add a background
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textInput: {
    height: 50,
    backgroundColor: theme.colors.bgWhiteLight,
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    color: theme.colors.white,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: typeof theme.colors.border === 'string' ? theme.colors.border : '#ccc',
  },
  additionalDetailsContainer: {
    width: "100%",
    marginTop: 30, // Adjust spacing from OTP
  },
  otpInputsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the OTP inputs and eye icon
    width: '100%',
    marginBottom: 20,
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%', // Adjust width for OTP inputs
    marginRight: 10, // Space between OTP inputs and eye icon
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: typeof theme.colors.border === 'string' ? theme.colors.border : '#ccc',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 24,
    color: theme.colors.white,
    backgroundColor: theme.colors.bgWhiteLight,
  },
  eyeButton: {
    padding: 10,
  },
  // Ensure existing styles are compatible, e.g., registerStyles.formContainer
  // might need adjustment for vertical alignment or padding if the mobile input shifts.
  formContainer: {
    width: "90%",
    maxWidth: 500,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Dimensions.get('window').height * 0.15, // Adjusted to make space for the floating phone input
    marginBottom: 20,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    width: "100%",
    padding: 20, // Increased padding
  },
  cardContent: {
    paddingTop: 30, // Increased top padding to give space for mobile input moving up
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // Needed for absolute positioning of mobile input
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: theme.colors.white,
    overflow: "hidden",
  },
  modalHeader: {
    alignItems: "center",
  },
  modalIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    marginTop: 10,
  },
  modalDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

});