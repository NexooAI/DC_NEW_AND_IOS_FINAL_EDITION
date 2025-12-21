import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { theme } from "@/constants/theme";

const ResponsiveDesignTester = () => {
  const {
    screenWidth,
    screenHeight,
    deviceType,
    orientation,
    isPortrait,
    isLandscape,
    isTinyScreen,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isXLargeScreen,
    isTablet,
    isLargeTablet,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
    getCardWidth,
    getGridColumns,
    getListItemHeight,
  } = useResponsiveLayout();

  const testResponsiveValues = () => {
    const testData = {
      screenWidth,
      screenHeight,
      deviceType,
      orientation,
      isPortrait,
      isLandscape,
      isTinyScreen,
      isSmallScreen,
      isMediumScreen,
      isLargeScreen,
      isXLargeScreen,
      isTablet,
      isLargeTablet,
      deviceScale: deviceScale(100),
      responsiveFont: getResponsiveFontSize(12, 14, 16),
      responsivePadding: getResponsivePadding(8, 12, 16),
      cardWidth: getCardWidth(),
      gridColumns: getGridColumns(),
      listItemHeight: getListItemHeight(),
    };

    Alert.alert(
      "Responsive Design Test Results",
      JSON.stringify(testData, null, 2),
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: fontSize.xl }]}>
          Responsive Design Tester
        </Text>
        <Text style={[styles.subtitle, { fontSize: fontSize.md }]}>
          Verify responsive behavior across devices
        </Text>
      </View>

      {/* Device Information */}
      <View style={[styles.section, { padding: padding.md }]}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.lg }]}>
          Device Information
        </Text>
        <View style={styles.infoGrid}>
          <InfoItem label="Screen Width" value={`${screenWidth}px`} />
          <InfoItem label="Screen Height" value={`${screenHeight}px`} />
          <InfoItem label="Device Type" value={deviceType} />
          <InfoItem label="Orientation" value={orientation} />
        </View>
      </View>

      {/* Screen Size Detection */}
      <View style={[styles.section, { padding: padding.md }]}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.lg }]}>
          Screen Size Detection
        </Text>
        <View style={styles.flagGrid}>
          <FlagItem label="Tiny" active={isTinyScreen} />
          <FlagItem label="Small" active={isSmallScreen} />
          <FlagItem label="Medium" active={isMediumScreen} />
          <FlagItem label="Large" active={isLargeScreen} />
          <FlagItem label="XLarge" active={isXLargeScreen} />
          <FlagItem label="Tablet" active={isTablet} />
          <FlagItem label="Large Tablet" active={isLargeTablet} />
        </View>
      </View>

      {/* Responsive Values */}
      <View style={[styles.section, { padding: padding.md }]}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.lg }]}>
          Responsive Values
        </Text>
        <View style={styles.valueGrid}>
          <ValueItem label="Device Scale (100px)" value={deviceScale(100)} />
          <ValueItem
            label="Responsive Font"
            value={getResponsiveFontSize(12, 14, 16)}
          />
          <ValueItem
            label="Responsive Padding"
            value={getResponsivePadding(8, 12, 16)}
          />
          <ValueItem label="Card Width" value={`${getCardWidth()}px`} />
          <ValueItem label="Grid Columns" value={getGridColumns()} />
          <ValueItem
            label="List Item Height"
            value={`${getListItemHeight()}px`}
          />
        </View>
      </View>

      {/* Predefined Responsive Values */}
      <View style={[styles.section, { padding: padding.md }]}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.lg }]}>
          Predefined Values
        </Text>
        <View style={styles.predefinedGrid}>
          <Text style={[styles.label, { fontSize: fontSize.sm }]}>
            Spacing:
          </Text>
          <Text style={[styles.value, { fontSize: fontSize.sm }]}>
            XS: {spacing.xs} | SM: {spacing.sm} | MD: {spacing.md} | LG:{" "}
            {spacing.lg}
          </Text>

          <Text style={[styles.label, { fontSize: fontSize.sm }]}>
            Font Sizes:
          </Text>
          <Text style={[styles.value, { fontSize: fontSize.sm }]}>
            SM: {fontSize.sm} | MD: {fontSize.md} | LG: {fontSize.lg} | XL:{" "}
            {fontSize.xl}
          </Text>

          <Text style={[styles.label, { fontSize: fontSize.sm }]}>
            Padding:
          </Text>
          <Text style={[styles.value, { fontSize: fontSize.sm }]}>
            SM: {padding.sm} | MD: {padding.md} | LG: {padding.lg} | XL:{" "}
            {padding.xl}
          </Text>
        </View>
      </View>

      {/* Test Button */}
      <View style={[styles.section, { padding: padding.md }]}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.lg }]}>
          Test Responsive Values
        </Text>
        <Text style={[styles.description, { fontSize: fontSize.sm }]}>
          Tap the button below to see all responsive values in an alert
        </Text>
        <View
          style={[
            styles.button,
            {
              padding: padding.md,
              marginTop: spacing.md,
              backgroundColor: theme.colors.primary,
              borderRadius: spacing.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              {
                fontSize: fontSize.md,
                color: "white",
                textAlign: "center",
              },
            ]}
            onPress={testResponsiveValues}
          >
            Test Responsive Values
          </Text>
        </View>
      </View>

      {/* Responsive Layout Examples */}
      <View style={[styles.section, { padding: padding.md }]}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.lg }]}>
          Layout Examples
        </Text>

        {/* Responsive Card */}
        <View
          style={[
            styles.exampleCard,
            {
              width: getCardWidth(),
              height: getListItemHeight(),
              padding: padding.md,
              marginTop: spacing.md,
              backgroundColor: theme.colors.background,
              borderRadius: spacing.sm,
              borderWidth: 1,
              borderColor:
                typeof theme.colors.border === "string"
                  ? theme.colors.border
                  : theme.colors.border?.light ?? "#ccc",
            },
          ]}
        >
          <Text style={[styles.exampleText, { fontSize: fontSize.md }]}>
            This card demonstrates responsive width and height
          </Text>
          <Text
            style={[
              styles.exampleText,
              { fontSize: fontSize.sm, marginTop: spacing.sm },
            ]}
          >
            Width: {getCardWidth()}px | Height: {getListItemHeight()}px
          </Text>
        </View>

        {/* Responsive Grid */}
        <View style={[styles.gridContainer, { marginTop: spacing.lg }]}>
          <Text
            style={[
              styles.gridTitle,
              { fontSize: fontSize.md, marginBottom: spacing.sm },
            ]}
          >
            Grid Layout ({getGridColumns()} columns)
          </Text>
          <View style={styles.grid}>
            {Array.from({ length: getGridColumns() }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.gridItem,
                  {
                    width: `${100 / getGridColumns()}%`,
                    height: deviceScale(60),
                    padding: padding.sm,
                    margin: spacing.xs,
                    backgroundColor: theme.colors.primary,
                    borderRadius: spacing.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.gridItemText,
                    {
                      fontSize: fontSize.sm,
                      color: "white",
                      textAlign: "center",
                    },
                  ]}
                >
                  Item {index + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <View style={styles.infoItem}>
    <Text style={[styles.infoLabel, { fontSize: 12 }]}>{label}:</Text>
    <Text style={[styles.infoValue, { fontSize: 12 }]}>{value}</Text>
  </View>
);

const FlagItem = ({ label, active }: { label: string; active: boolean }) => (
  <View
    style={[
      styles.flagItem,
      {
        backgroundColor: active
          ? typeof theme.colors.success === "string"
            ? theme.colors.success
            : "#28a745"
          : typeof theme.colors.border === "string"
          ? theme.colors.border
          : "#cccccc",
        padding: 8,
        borderRadius: 4,
        margin: 2,
      },
    ]}
  >
    <Text
      style={[
        styles.flagText,
        {
          fontSize: 10,
          color: active ? "white" : theme.colors.textMediumGrey,
        },
      ]}
    >
      {label}
    </Text>
  </View>
);

const ValueItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <View style={styles.valueItem}>
    <Text style={[styles.valueLabel, { fontSize: 12 }]}>{label}:</Text>
    <Text style={[styles.valueValue, { fontSize: 12 }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  title: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "white",
    opacity: 0.8,
  },
  section: {
    marginVertical: 8,
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
    color: theme.colors.textDark,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoItem: {
    width: "48%",
    marginBottom: 8,
  },
  infoLabel: {
    color: theme.colors.textMediumGrey,
    marginBottom: 2,
  },
  infoValue: {
    color: theme.colors.textDark,
    fontWeight: "500",
  },
  flagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  flagItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  flagText: {
    fontWeight: "bold",
  },
  valueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  valueItem: {
    width: "48%",
    marginBottom: 8,
  },
  valueLabel: {
    color: theme.colors.textMediumGrey,
    marginBottom: 2,
  },
  valueValue: {
    color: theme.colors.textDark,
    fontWeight: "500",
  },
  predefinedGrid: {
    gap: 8,
  },
  label: {
    color: theme.colors.textMediumGrey,
    fontWeight: "500",
  },
  value: {
    color: theme.colors.textDark,
  },
  description: {
    color: theme.colors.textMediumGrey,
    marginBottom: 16,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "bold",
  },
  exampleCard: {
    alignItems: "center",
    justifyContent: "center",
  },
  exampleText: {
    textAlign: "center",
    color: theme.colors.textDark,
  },
  gridContainer: {
    alignItems: "center",
  },
  gridTitle: {
    color: theme.colors.textDark,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  gridItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  gridItemText: {
    fontWeight: "bold",
  },
});

export default ResponsiveDesignTester;
