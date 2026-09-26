import React from "react";
import { render } from "@testing-library/react-native";
import { LiveRatesCardV2 } from "../../components/homeV2/LiveRatesCardV2";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("LiveRatesCardV2 Component", () => {
  it("renders rates accurately without any hardcoded change pills when change is null", () => {
    const { queryByText, getByText } = render(
      <LiveRatesCardV2
        goldRate="7,100"
        silverRate="85.00"
        goldChange={null}
        silverChange={null}
        goldPurity="22K"
      />
    );

    expect(getByText("Gold Rate (22K)")).toBeTruthy();
    expect(getByText("Silver Rate")).toBeTruthy();

    // Verify hardcoded fake pills "+12" and "+0.50" are NOT present
    expect(queryByText("+12")).toBeNull();
    expect(queryByText("+0.50")).toBeNull();
  });

  it("renders positive change badge with green caret-up", () => {
    const { getByText } = render(
      <LiveRatesCardV2
        goldRate="7,100"
        silverRate="85.00"
        goldChange="+25"
        silverChange="+1.20"
      />
    );

    expect(getByText("+25")).toBeTruthy();
    expect(getByText("+1.20")).toBeTruthy();
  });

  it("renders negative change badge with caret-down", () => {
    const { getByText } = render(
      <LiveRatesCardV2
        goldRate="7,100"
        silverRate="85.00"
        goldChange="-30"
        silverChange="-0.75"
      />
    );

    expect(getByText("-30")).toBeTruthy();
    expect(getByText("-0.75")).toBeTruthy();
  });
});
