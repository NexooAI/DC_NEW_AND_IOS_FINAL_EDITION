import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Animated } from "react-native";
import {
  resolveBottomNavStyle,
  resolveShowDashboardTab,
} from "@/common/components/navigation/CustomBottomBar";
import BottomBarV1Classic from "@/common/components/navigation/bars/BottomBarV1Classic";
import BottomBarV2Floating from "@/common/components/navigation/bars/BottomBarV2Floating";
import BottomBarV3CenterFab from "@/common/components/navigation/bars/BottomBarV3CenterFab";
import BottomBarV4Curved from "@/common/components/navigation/bars/BottomBarV4Curved";
import { TabItem, BottomBarProps } from "@/common/components/navigation/bars/types";

// Mock hooks
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        bottom_nav_home: "Home",
        bottom_nav_savings: "Savings",
        dashboard: "Dashboard",
        rewards: "Rewards",
        bottom_nav_profile: "Profile",
      };
      return translations[key] || key;
    },
  }),
}));

const mock4Tabs: TabItem[] = [
  { name: "home", label: "bottom_nav_home", icon: "home-outline", iconActive: "home" },
  { name: "savings", label: "bottom_nav_savings", icon: "wallet-outline", iconActive: "wallet" },
  { name: "rewards", label: "rewards", icon: "gift-outline", iconActive: "gift", badge: 3 },
  { name: "profile", label: "bottom_nav_profile", icon: "person-outline", iconActive: "person" },
];

const mock5Tabs: TabItem[] = [
  { name: "home", label: "bottom_nav_home", icon: "home-outline", iconActive: "home" },
  { name: "savings", label: "bottom_nav_savings", icon: "wallet-outline", iconActive: "wallet" },
  { name: "dashboard_tab", label: "dashboard", icon: "grid-outline", iconActive: "grid" },
  { name: "rewards", label: "rewards", icon: "gift-outline", iconActive: "gift" },
  { name: "profile", label: "bottom_nav_profile", icon: "person-outline", iconActive: "person" },
];

const createMockProps = (tabs = mock4Tabs, current = "home", onTabPress = jest.fn()): BottomBarProps => ({
  tabs,
  current,
  onTabPress,
  primaryColor: "#0e1e38",
  secondaryColor: "#d4af37",
  userProfileImage: undefined,
  tabAnimations: [0, 1, 2, 3, 4].map(() => new Animated.Value(1)),
  badgeAnimations: [0, 1, 2, 3, 4].map(() => new Animated.Value(1)),
});

describe("Bottom Navigation Bar 4 Models & Configuration Logic", () => {
  describe("Style Resolution Logic (resolveBottomNavStyle)", () => {
    it("defaults to v1_classic when no config is provided", () => {
      expect(resolveBottomNavStyle(undefined, undefined)).toBe("v1_classic");
      expect(resolveBottomNavStyle({}, {})).toBe("v1_classic");
    });

    it("prioritizes API bottomNavStyle strings", () => {
      expect(resolveBottomNavStyle({ bottomNavStyle: "v1_classic" })).toBe("v1_classic");
      expect(resolveBottomNavStyle({ bottomNavStyle: "v2_floating" })).toBe("v2_floating");
      expect(resolveBottomNavStyle({ bottomNavStyle: "v3_center_fab" })).toBe("v3_center_fab");
      expect(resolveBottomNavStyle({ bottomNavStyle: "v4_curved" })).toBe("v4_curved");
    });

    it("resolves API numeric versions (1, 2, 3, 4)", () => {
      expect(resolveBottomNavStyle({ bottomNavVersion: 1 })).toBe("v1_classic");
      expect(resolveBottomNavStyle({ bottomNavVersion: 2 })).toBe("v2_floating");
      expect(resolveBottomNavStyle({ bottomNavVersion: 3 })).toBe("v3_center_fab");
      expect(resolveBottomNavStyle({ bottomNavVersion: 4 })).toBe("v4_curved");
    });

    it("falls back to local appConfig when API is not set", () => {
      expect(resolveBottomNavStyle(undefined, { bottomNavStyle: "v2_floating" })).toBe("v2_floating");
      expect(resolveBottomNavStyle(undefined, { bottomNavVersion: 3 })).toBe("v3_center_fab");
      expect(resolveBottomNavStyle(undefined, { constants: { bottomNavStyle: "v4_curved" } })).toBe("v4_curved");
    });
  });

  describe("Dashboard Visibility Logic (resolveShowDashboardTab)", () => {
    it("resolves false when showBottomNavDashboard is false", () => {
      expect(resolveShowDashboardTab({ showBottomNavDashboard: 0 }, { showBottomNavDashboard: false })).toBe(false);
      expect(resolveShowDashboardTab(undefined, { showBottomNavDashboard: false })).toBe(false);
    });

    it("resolves true when API sets showBottomNavDashboard: 1 or true", () => {
      expect(resolveShowDashboardTab({ showBottomNavDashboard: 1 }, {})).toBe(true);
      expect(resolveShowDashboardTab({ showBottomNavDashboard: true }, {})).toBe(true);
    });

    it("resolves true when appConfig sets showBottomNavDashboard: true", () => {
      expect(resolveShowDashboardTab(undefined, { showBottomNavDashboard: true })).toBe(true);
      expect(resolveShowDashboardTab(undefined, { constants: { showBottomNavDashboard: true } })).toBe(true);
    });
  });

  describe("Model 1: BottomBarV1Classic", () => {
    it("renders all tabs with labels and responds to press", () => {
      const onTabPress = jest.fn();
      const props = createMockProps(mock4Tabs, "home", onTabPress);
      const { getByText } = render(<BottomBarV1Classic {...props} />);

      expect(getByText("Home")).toBeTruthy();
      expect(getByText("Savings")).toBeTruthy();
      expect(getByText("Rewards")).toBeTruthy();
      expect(getByText("Profile")).toBeTruthy();

      fireEvent.press(getByText("Savings"));
      expect(onTabPress).toHaveBeenCalledWith(mock4Tabs[1], 1);
    });

    it("renders badge when provided", () => {
      const props = createMockProps(mock4Tabs, "home");
      const { getByText } = render(<BottomBarV1Classic {...props} />);
      expect(getByText("3")).toBeTruthy();
    });
  });

  describe("Model 2: BottomBarV2Floating", () => {
    it("renders floating island structure with 4 tabs", () => {
      const onTabPress = jest.fn();
      const props = createMockProps(mock4Tabs, "savings", onTabPress);
      const { getByText } = render(<BottomBarV2Floating {...props} />);

      expect(getByText("Home")).toBeTruthy();
      expect(getByText("Savings")).toBeTruthy();
      expect(getByText("Rewards")).toBeTruthy();
      expect(getByText("Profile")).toBeTruthy();

      fireEvent.press(getByText("Rewards"));
      expect(onTabPress).toHaveBeenCalledWith(mock4Tabs[2], 2);
    });
  });

  describe("Model 3: BottomBarV3CenterFab", () => {
    it("renders 5 tabs with center hero FAB button (Dashboard)", () => {
      const onTabPress = jest.fn();
      const props = createMockProps(mock5Tabs, "home", onTabPress);
      const { getByText } = render(<BottomBarV3CenterFab {...props} />);

      expect(getByText("Home")).toBeTruthy();
      expect(getByText("Savings")).toBeTruthy();
      expect(getByText("Dashboard")).toBeTruthy();
      expect(getByText("Rewards")).toBeTruthy();
      expect(getByText("Profile")).toBeTruthy();

      fireEvent.press(getByText("Dashboard"));
      expect(onTabPress).toHaveBeenCalledWith(mock5Tabs[2], 2);
    });

    it("renders 4 tabs with center hero button", () => {
      const onTabPress = jest.fn();
      const props = createMockProps(mock4Tabs, "home", onTabPress);
      const { getByText } = render(<BottomBarV3CenterFab {...props} />);

      expect(getByText("Home")).toBeTruthy();
      expect(getByText("Savings")).toBeTruthy();
      expect(getByText("Rewards")).toBeTruthy();
      expect(getByText("Profile")).toBeTruthy();
    });
  });

  describe("Model 4: BottomBarV4Curved", () => {
    it("renders curved bar with active glowing dot", () => {
      const onTabPress = jest.fn();
      const props = createMockProps(mock4Tabs, "profile", onTabPress);
      const { getByText } = render(<BottomBarV4Curved {...props} />);

      expect(getByText("Home")).toBeTruthy();
      expect(getByText("Savings")).toBeTruthy();
      expect(getByText("Rewards")).toBeTruthy();
      expect(getByText("Profile")).toBeTruthy();

      fireEvent.press(getByText("Home"));
      expect(onTabPress).toHaveBeenCalledWith(mock4Tabs[0], 0);
    });
  });
});
