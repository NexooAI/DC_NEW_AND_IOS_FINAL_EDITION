// components/MaintenanceTestButton.tsx - Test Button for Maintenance Mode
import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import MaintenanceService from "@/services/maintenanceService";
import { logger } from "@/utils/logger";

interface MaintenanceTestButtonProps {
  style?: any;
}

export default function MaintenanceTestButton({
  style,
}: MaintenanceTestButtonProps) {
  const simulateMaintenanceMode = () => {
    const maintenanceData = {
      maintenanceStatus: true,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 25 * 1000).toISOString(), // 25 seconds from now for testing
      reason: "Server upgrade and database optimization",
      message:
        "We're performing scheduled maintenance. Please try again after the mentioned time.",
    };

    logger.log("🔧 Simulating maintenance mode:", maintenanceData);
    MaintenanceService.getInstance().setMaintenanceMode(maintenanceData);
  };

  const clearMaintenanceMode = () => {
    logger.log("✅ Clearing maintenance mode");
    MaintenanceService.getInstance().clearMaintenanceMode();
  };

  const showMaintenanceInfo = () => {
    const state = MaintenanceService.getInstance().getState();
    Alert.alert(
      "Maintenance Status",
      `Is Maintenance Active: ${state.isMaintenanceMode}\nTime Remaining: ${
        state.timeRemaining
      }ms\nMessage: ${state.maintenanceData?.message || "N/A"}`,
      [{ text: "OK" }]
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={simulateMaintenanceMode}
      >
        <Text style={styles.buttonText}>Test Maintenance Mode</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clearButton, style]}
        onPress={clearMaintenanceMode}
      >
        <Text style={styles.buttonText}>Clear Maintenance</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.infoButton, style]}
        onPress={showMaintenanceInfo}
      >
        <Text style={styles.buttonText}>Show Status</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#667eea",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  clearButton: {
    backgroundColor: "#e74c3c",
  },
  infoButton: {
    backgroundColor: "#27ae60",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
