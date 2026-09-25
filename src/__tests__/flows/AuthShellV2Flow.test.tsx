import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AuthShellV2 from "@/components/auth/AuthShellV2";
import { useRouter } from "expo-router";
import api from "@/services/api";
import useGlobalStore from "@/store/global.store";

// Mock Dependencies
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useFocusEffect: (cb: any) => require("react").useEffect(cb, []),
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock("@/services/api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockLogin = jest.fn();
const stableStoreState = {
  user: null,
  isLoggedIn: false,
  login: mockLogin,
  logout: jest.fn(),
  language: "en",
  setLanguage: jest.fn(),
};

(useGlobalStore as unknown as jest.Mock).mockReturnValue(stableStoreState);

describe("AuthShellV2 Flow with SmoothPinInput", () => {
  let mockReplace: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
      back: jest.fn(),
    });
  });

  it("handles Phone -> Send OTP -> Enter 4-digit OTP via SmoothPinInput -> Auto Verify", async () => {
    (api.post as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("check-mobile")) {
        return Promise.resolve({
          status: 200,
          data: { success: true, message: "OTP sent" },
        });
      }
      if (url.includes("verify-otp")) {
        return Promise.resolve({
          status: 200,
          data: {
            success: true,
            token: "jwt-token-123",
            user: { id: 1, name: "Test User", mobile_number: "9876543210" },
          },
        });
      }
      return Promise.resolve({ status: 200, data: { success: true } });
    });

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <AuthShellV2 initialStep="phone" initialMobile="" />
    );

    // 1. Type mobile number
    const mobileInput = getByPlaceholderText("enterMobileNumber");
    fireEvent.changeText(mobileInput, "9876543210");

    // 2. Press Send OTP button
    const sendOtpBtn = getByText("sendOtp");
    fireEvent.press(sendOtpBtn);

    // 3. Wait for OTP step to appear
    await waitFor(() => {
      expect(getByText("enterOtpTitle")).toBeTruthy();
    });

    // 4. Enter 4-digit OTP via SmoothPinInput
    const otpInput = getByTestId("auth-v2-otp-input-hidden-input");
    expect(otpInput).toBeTruthy();

    // Type digits 1, 2, 3, 4 sequentially
    fireEvent.changeText(otpInput, "1234");

    // 5. Verify that onComplete auto-fires and calls verify-otp API
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("verify-otp"),
        expect.objectContaining({
          mobile_number: "9876543210",
          otp: "1234",
        }),
        expect.anything()
      );
    });
  });

  it("handles MPIN login step: typing 4-digit MPIN auto-triggers loginWithMpin", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: {
        success: true,
        token: "jwt-token-456",
        user: { id: 2, name: "MPIN User", mobile_number: "9876543210" },
      },
    });

    const { getByTestId, getByText, queryByText } = render(
      <AuthShellV2 initialStep="mpin" initialMobile="9876543210" />
    );

    // Verify MPIN title renders
    expect(getByText("enterMpinTitle")).toBeTruthy();

    // Target SmoothPinInput for MPIN
    const mpinInput = getByTestId("auth-v2-mpin-input-hidden-input");
    expect(mpinInput).toBeTruthy();

    // Type 4-digit MPIN
    fireEvent.changeText(mpinInput, "4321");

    // Verify API called with 4321
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("login-mpin"),
        expect.objectContaining({
          mobileNumber: "9876543210",
          mpin: "4321",
        })
      );
    });

    // Verify "Login with OTP" is completely removed from MPIN screen (Audio 2 instruction)
    expect(queryByText("loginWithOtp")).toBeNull();

    // Verify Eye toggle button is present on MPIN screen (Audio 4 instruction)
    const eyeToggleBtn = getByTestId("auth-v2-mpin-input-eye-toggle");
    expect(eyeToggleBtn).toBeTruthy();

    // Verify "Powered by" and provider name are displayed (Audio 2 instruction)
    expect(getByText(/poweredBy/i)).toBeTruthy();
    expect(getByText("Agnisofterp")).toBeTruthy();
  });

  it("handles Forgot MPIN: tapping Forgot MPIN triggers OTP send and transitions in-shell to OTP", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: { success: true, message: "OTP sent" },
    });

    const { getByText } = render(
      <AuthShellV2 initialStep="mpin" initialMobile="9876543210" />
    );

    const forgotBtn = getByText("forgotMpin");
    fireEvent.press(forgotBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("check-mobile"),
        expect.objectContaining({
          mobile_number: "9876543210",
        }),
        expect.anything()
      );
      // Seamlessly transitions to OTP step in the luxury shell
      expect(getByText("enterOtpTitle")).toBeTruthy();
      expect(getByText("+91 9876543210")).toBeTruthy();
    });
  });

  it("renders RegisterShellV2 with brand elements, form fields, and Agnisofterp footer", () => {
    const RegisterShellV2 = require("@/components/auth/RegisterShellV2").default;
    const { getByText, getByPlaceholderText } = render(
      <RegisterShellV2 initialMobile="9876543210" />
    );

    const { themeConfig } = require("@/constants/theme.config");
    expect(getByText(themeConfig.customerName)).toBeTruthy();
    expect(getByText(/Agnisofterp/i)).toBeTruthy();
    expect(getByPlaceholderText(/fullNamePlaceholder/i)).toBeTruthy();
  });
});
