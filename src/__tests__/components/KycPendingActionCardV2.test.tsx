import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { KycPendingActionCardV2 } from "../../components/homeV2/KycPendingActionCardV2";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("KycPendingActionCardV2 Component", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders pending action badge and KYC texts", () => {
    const { getByText } = render(
      <KycPendingActionCardV2
        title="Complete KYC Verification"
        description="Verify your KYC details now"
      />
    );

    expect(getByText("PENDING ACTION")).toBeTruthy();
    expect(getByText("Complete Now")).toBeTruthy();
    expect(getByText("Complete KYC Verification")).toBeTruthy();
    expect(getByText("Verify your KYC details now")).toBeTruthy();
  });

  it("navigates to KYC screen when tapped", () => {
    const { getByText } = render(
      <KycPendingActionCardV2 />
    );

    fireEvent.press(getByText("PENDING ACTION"));
    expect(mockPush).toHaveBeenCalledWith("/(app)/(tabs)/home/kyc");
  });

  it("triggers custom onPress callback if supplied", () => {
    const customPress = jest.fn();
    const { getByText } = render(
      <KycPendingActionCardV2 onPress={customPress} />
    );

    fireEvent.press(getByText("PENDING ACTION"));
    expect(customPress).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
