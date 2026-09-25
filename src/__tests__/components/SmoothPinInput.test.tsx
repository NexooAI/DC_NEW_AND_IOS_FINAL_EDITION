import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SmoothPinInput } from "@/components/auth/SmoothPinInput";

describe("SmoothPinInput Component Unit Tests", () => {
  it("renders 4 empty pin boxes by default", () => {
    const handleChange = jest.fn();
    const { getByTestId, queryByText } = render(
      <SmoothPinInput value="" onChangeText={handleChange} testID="test-pin" />
    );

    expect(getByTestId("test-pin")).toBeTruthy();
    expect(getByTestId("pin-box-0")).toBeTruthy();
    expect(getByTestId("pin-box-1")).toBeTruthy();
    expect(getByTestId("pin-box-2")).toBeTruthy();
    expect(getByTestId("pin-box-3")).toBeTruthy();
    // No digits rendered when empty
    expect(queryByText("1")).toBeNull();
  });

  it("renders plain digits when secure is false", () => {
    const handleChange = jest.fn();
    const { getByText } = render(
      <SmoothPinInput
        value="123"
        onChangeText={handleChange}
        secure={false}
        testID="test-pin"
      />
    );

    expect(getByText("1")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
  });

  it("renders secure bullets (●) when secure is true", () => {
    const handleChange = jest.fn();
    const { getAllByText, queryByText } = render(
      <SmoothPinInput
        value="1234"
        onChangeText={handleChange}
        secure={true}
        testID="test-pin"
      />
    );

    // Should NOT show raw numbers
    expect(queryByText("1")).toBeNull();
    expect(queryByText("2")).toBeNull();
    expect(queryByText("3")).toBeNull();
    expect(queryByText("4")).toBeNull();

    // Should render 4 bullets
    const bullets = getAllByText("●");
    expect(bullets.length).toBe(4);
  });

  it("handles smooth typing from digit 1 through digit 4 without dropping 4th digit", () => {
    const handleChange = jest.fn();
    const handleComplete = jest.fn();

    const { getByTestId } = render(
      <SmoothPinInput
        value=""
        onChangeText={handleChange}
        onComplete={handleComplete}
        testID="test-pin"
      />
    );

    const hiddenInput = getByTestId("test-pin-hidden-input");

    // Digit 1
    fireEvent.changeText(hiddenInput, "5");
    expect(handleChange).toHaveBeenLastCalledWith("5");
    expect(handleComplete).not.toHaveBeenCalled();

    // Digit 2
    fireEvent.changeText(hiddenInput, "58");
    expect(handleChange).toHaveBeenLastCalledWith("58");
    expect(handleComplete).not.toHaveBeenCalled();

    // Digit 3
    fireEvent.changeText(hiddenInput, "582");
    expect(handleChange).toHaveBeenLastCalledWith("582");
    expect(handleComplete).not.toHaveBeenCalled();

    // Digit 4 - CRITICAL FIX TEST: 4th digit must trigger onComplete
    fireEvent.changeText(hiddenInput, "5829");
    expect(handleChange).toHaveBeenLastCalledWith("5829");
    expect(handleComplete).toHaveBeenCalledTimes(1);
    expect(handleComplete).toHaveBeenCalledWith("5829");
  });

  it("clamps input to maximum length (4 digits) even if keyboard sends more", () => {
    const handleChange = jest.fn();
    const handleComplete = jest.fn();

    const { getByTestId } = render(
      <SmoothPinInput
        value=""
        onChangeText={handleChange}
        onComplete={handleComplete}
        testID="test-pin"
      />
    );

    const hiddenInput = getByTestId("test-pin-hidden-input");
    fireEvent.changeText(hiddenInput, "12345678");

    // Should slice to length 4
    expect(handleChange).toHaveBeenCalledWith("1234");
    expect(handleComplete).toHaveBeenCalledWith("1234");
  });

  it("sanitizes non-numeric characters", () => {
    const handleChange = jest.fn();

    const { getByTestId } = render(
      <SmoothPinInput value="" onChangeText={handleChange} testID="test-pin" />
    );

    const hiddenInput = getByTestId("test-pin-hidden-input");
    fireEvent.changeText(hiddenInput, "1a2#b3");

    expect(handleChange).toHaveBeenCalledWith("123");
  });

  it("supports backspacing properly", () => {
    const handleChange = jest.fn();

    const { getByTestId } = render(
      <SmoothPinInput
        value="5829"
        onChangeText={handleChange}
        testID="test-pin"
      />
    );

    const hiddenInput = getByTestId("test-pin-hidden-input");
    fireEvent.changeText(hiddenInput, "582");

    expect(handleChange).toHaveBeenCalledWith("582");
  });

  it("toggles between secure bullet and plain text digits when eye toggle is pressed", () => {
    const handleChange = jest.fn();
    const { getByTestId, getAllByText, queryByText, getByText } = render(
      <SmoothPinInput
        value="1234"
        onChangeText={handleChange}
        secure={true}
        allowToggleSecure={true}
        testID="test-pin"
      />
    );

    // Initially secured with bullets
    expect(getAllByText("●").length).toBe(4);
    expect(queryByText("1")).toBeNull();

    // Toggle button should exist
    const toggleBtn = getByTestId("test-pin-eye-toggle");
    expect(toggleBtn).toBeTruthy();

    // Press toggle -> reveal digits
    fireEvent.press(toggleBtn);
    expect(queryByText("●")).toBeNull();
    expect(getByText("1")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(getByText("4")).toBeTruthy();

    // Press toggle again -> mask with bullets
    fireEvent.press(toggleBtn);
    expect(getAllByText("●").length).toBe(4);
    expect(queryByText("1")).toBeNull();
  });
});
