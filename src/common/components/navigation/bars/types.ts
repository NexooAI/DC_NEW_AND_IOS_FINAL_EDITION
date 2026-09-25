import { Animated } from "react-native";

export type TabItem = {
  name: string;
  label: string;
  icon: any;
  iconActive: any;
  badge?: number | null;
};

export interface BottomBarProps {
  tabs: TabItem[];
  current: string;
  onTabPress: (tab: TabItem, index: number) => void;
  primaryColor: string;
  secondaryColor: string;
  userProfileImage?: string;
  tabAnimations: Animated.Value[];
  badgeAnimations: Animated.Value[];
}
