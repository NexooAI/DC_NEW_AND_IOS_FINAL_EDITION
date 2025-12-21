import React from "react";
import { View, Text, StyleSheet, Image, ImageSourcePropType, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "@/hooks/useTranslation";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { theme } from "@/constants";

interface RateData {
    goldRate: string | number;
    silverRate: string | number;
    updatedAt?: string;
}

interface GoldSilverRateCardProps {
    data: RateData;
    goldImage?: ImageSourcePropType;
    silverImage?: ImageSourcePropType;
    onPress?: () => void;
}

const GoldSilverRateCard: React.FC<GoldSilverRateCardProps> = ({
    data,
    goldImage,
    silverImage,
    onPress,
}) => {
    const { t } = useTranslation();
    const {
        screenWidth,
        deviceScale,
        getResponsiveFontSize,
    } = useResponsiveLayout();

    // Default images if not provided
    const defaultGoldImage = require("../../assets/images/gold.png");
    const defaultSilverImage = require("../../assets/images/silver.png");

    const formatRate = (rate: string | number): string => {
        let formattedRate: string;
        if (typeof rate === "number") {
            formattedRate = rate.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        } else {
            formattedRate = rate || "0";
            // Convert string to number to check decimals
            const numValue = parseFloat(formattedRate);
            if (!isNaN(numValue)) {
                formattedRate = numValue.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
            }
        }
        // Trim .00 if present
        if (formattedRate.endsWith(".00")) {
            formattedRate = formattedRate.slice(0, -3);
        }
        return formattedRate;
    };

    const formatDateToIndian = (isoString: string | undefined): string => {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            return date.toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return "";
        }
    };

    const dynamicStyles = StyleSheet.create({
        container: {
            width: screenWidth * 0.9,
            maxWidth: 400,
            alignSelf: "center",
            marginVertical: deviceScale(10),
        },
        card: {
            borderRadius: 20,
            paddingVertical: deviceScale(12),
            paddingHorizontal: deviceScale(16),
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            overflow: "hidden",
        },
        ratesRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: deviceScale(0),
        },
        rateSection: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
        },
        iconContainer: {
            width: deviceScale(45),
            height: deviceScale(45),
            borderRadius: deviceScale(22.5),
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            justifyContent: "center",
            alignItems: "center",
            marginRight: deviceScale(10),
        },
        icon: {
            width: deviceScale(30),
            height: deviceScale(30),
            resizeMode: "contain",
        },
        rateInfo: {
            flex: 1,
        },
        rateLabel: {
            fontSize: getResponsiveFontSize(11, 13, 15),
            fontWeight: "500",
            color: "#ffffff",
            marginBottom: deviceScale(2),
        },
        rateValue: {
            fontSize: getResponsiveFontSize(17, 19, 21),
            fontWeight: "600",
            color: "#ffffff",
        },
        purityText: {
            fontSize: getResponsiveFontSize(9, 10, 11),
            fontWeight: "400",
            color: "rgba(255, 255, 255, 0.8)",
            marginLeft: deviceScale(4),
        },
        divider: {
            width: 1,
            height: deviceScale(50),
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            marginHorizontal: deviceScale(10),
        },
        updatedAtContainer: {
            marginTop: deviceScale(6),
            alignItems: "center",
            justifyContent: "center",
            paddingTop: deviceScale(6),
            borderTopWidth: 1,
            borderTopColor: "rgba(255, 255, 255, 0.2)",
        },
        updatedAtText: {
            fontSize: getResponsiveFontSize(9, 10, 11),
            color: "rgba(255, 255, 255, 0.9)",
            fontStyle: "italic",
            textAlign: "center",
        },
    });

    const CardContent = () => (
        <>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary, theme.colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={dynamicStyles.card}
            >
                {/* Rates Row */}
                <View style={dynamicStyles.ratesRow}>
                    {/* Gold Rate Section */}
                    <View style={dynamicStyles.rateSection}>
                        <View style={dynamicStyles.iconContainer}>
                            <Image
                                source={goldImage || defaultGoldImage}
                                style={dynamicStyles.icon}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={dynamicStyles.rateInfo}>
                            <Text style={dynamicStyles.rateLabel}>{t("goldRate")}
                            <Text style={dynamicStyles.purityText}>-22k</Text>
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                                <Text style={dynamicStyles.rateValue}>
                                    ₹{formatRate(data.goldRate)}
                                </Text>
                                
                            </View>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={dynamicStyles.divider} />

                    {/* Silver Rate Section */}
                    <View style={dynamicStyles.rateSection}>
                        <View style={dynamicStyles.rateInfo}>
                            <Text style={dynamicStyles.rateLabel}>{t("silverRate")}</Text>
                            <Text style={dynamicStyles.rateValue}>
                                ₹{formatRate(data.silverRate)}
                            </Text>
                        </View>
                        <View style={dynamicStyles.iconContainer}>
                            <Image
                                source={silverImage || defaultSilverImage}
                                style={dynamicStyles.icon}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                </View>

                {/* Updated At Date/Time - Inside card at bottom, center aligned */}
                {data.updatedAt && (
                    <View style={dynamicStyles.updatedAtContainer}>
                        <Text style={dynamicStyles.updatedAtText}>
                            Updated: {formatDateToIndian(data.updatedAt)}
                        </Text>
                    </View>
                )}
            </LinearGradient>
        </>
    );

    return (
        <View style={dynamicStyles.container}>
            {onPress ? (
                <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
                    <CardContent />
                </TouchableOpacity>
            ) : (
                <CardContent />
            )}
        </View>
    );
};

export default GoldSilverRateCard;

