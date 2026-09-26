import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { PopularSchemesV2 } from "../../components/homeV2/PopularSchemesV2";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/services/api", () => ({
  get: jest.fn().mockResolvedValue({ data: { data: [] } }),
}));

describe("PopularSchemesV2 Component", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("combines gold schemes into a single Gold Savings card and does not split into two", () => {
    const mockSchemes = [
      {
        SCHEMENAME: "Gold Fixed Monthly Chit",
        SCHEMETYPE: "fixed",
        METAL: "gold",
        ACTIVE: "Y",
      },
      {
        SCHEMENAME: "Gold Daily Flexi",
        SCHEMETYPE: "flexi",
        METAL: "gold",
        ACTIVE: "Y",
      },
      {
        SCHEMENAME: "Silver Digi Saver",
        SCHEMETYPE: "flexi",
        METAL: "silver",
        ACTIVE: "Y",
      },
      {
        SCHEMENAME: "Sparkling Diamond Club",
        SCHEMETYPE: "fixed",
        METAL: "diamond",
        ACTIVE: "Y",
      },
    ];

    const { queryByText, getAllByText } = render(
      <PopularSchemesV2 schemes={mockSchemes} />
    );

    // Verify exactly ONE single "Gold Savings" card is rendered
    expect(getAllByText("Gold Savings")).toHaveLength(1);

    // Verify older split cards are NOT rendered
    expect(queryByText("Monthly Gold Chit")).toBeNull();
    expect(queryByText("Gold Flexi Savings")).toBeNull();

    // Verify Silver and Diamond cards exist
    expect(getAllByText("Silver Savings")).toHaveLength(1);
    expect(getAllByText("Diamond Savings")).toHaveLength(1);
  });

  it("navigates to schemes with gold category when Gold Savings is tapped", () => {
    const mockSchemes = [
      {
        SCHEMENAME: "Gold Standard Scheme",
        SCHEMETYPE: "fixed",
        METAL: "gold",
        ACTIVE: "Y",
      },
    ];

    const { getByText } = render(
      <PopularSchemesV2 schemes={mockSchemes} />
    );

    fireEvent.press(getByText("Gold Savings"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(app)/(tabs)/home/schemes",
      params: {
        type: "gold",
        metal: "gold",
        category: "gold",
      },
    });
  });

  it("renders default single gold card when schemes array is empty", async () => {
    const { getAllByText, queryByText } = render(
      <PopularSchemesV2 schemes={[]} />
    );

    await waitFor(() => {
      expect(getAllByText("Gold Savings")).toHaveLength(1);
    });
    expect(queryByText("Monthly Gold Chit")).toBeNull();
    expect(queryByText("Gold Flexi Savings")).toBeNull();
  });

  it("filters cards when a metal filter tab is pressed", () => {
    const mockSchemes = [
      {
        SCHEMENAME: "Gold Fixed Monthly Chit",
        SCHEMETYPE: "fixed",
        METAL: "gold",
        ACTIVE: "Y",
      },
      {
        SCHEMENAME: "Silver Digi Saver",
        SCHEMETYPE: "flexi",
        METAL: "silver",
        ACTIVE: "Y",
      },
      {
        SCHEMENAME: "Sparkling Diamond Club",
        SCHEMETYPE: "fixed",
        METAL: "diamond",
        ACTIVE: "Y",
      },
    ];

    const { getByText, queryByText } = render(
      <PopularSchemesV2 schemes={mockSchemes} />
    );

    // Initially all cards exist
    expect(queryByText("Gold Savings")).toBeTruthy();
    expect(queryByText("Silver Savings")).toBeTruthy();
    expect(queryByText("Diamond Savings")).toBeTruthy();

    // Tap "silver" tab
    fireEvent.press(getByText("silver"));

    // Now only Silver Savings is displayed, Gold and Diamond are filtered out
    expect(queryByText("Silver Savings")).toBeTruthy();
    expect(queryByText("Gold Savings")).toBeNull();
    expect(queryByText("Diamond Savings")).toBeNull();

    // Tap "allSchemes" tab to reset filter
    fireEvent.press(getByText("allSchemes"));

    // All cards are visible again
    expect(queryByText("Gold Savings")).toBeTruthy();
    expect(queryByText("Silver Savings")).toBeTruthy();
    expect(queryByText("Diamond Savings")).toBeTruthy();
  });
});
