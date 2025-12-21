// components/MaintenanceWrapper.tsx - Maintenance Wrapper Component
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import MaintenanceService, {
  MaintenanceState,
} from "@/services/maintenanceService";
import MaintenanceScreen from "./MaintenanceScreen";
import { logger } from "@/utils/logger";

interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

export default function MaintenanceWrapper({
  children,
}: MaintenanceWrapperProps) {
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>(
    MaintenanceService.getInstance().getState()
  );

  useEffect(() => {
    // Subscribe to maintenance state changes
    const unsubscribe =
      MaintenanceService.getInstance().subscribe(setMaintenanceState);

    // Load any stored maintenance data on mount
    MaintenanceService.getInstance().loadStoredMaintenanceData();

    return () => {
      unsubscribe();
    };
  }, []);

  // If maintenance is active, show maintenance screen
  if (
    maintenanceState.isMaintenanceMode &&
    maintenanceState.timeRemaining > 0
  ) {
    logger.log("🔧 Showing maintenance screen");
    return (
      <MaintenanceScreen
        onRetry={() => {
          logger.log("🔄 User retried during maintenance");
          // Clear maintenance mode and let user continue
          MaintenanceService.getInstance().clearMaintenanceMode();
        }}
      />
    );
  }

  // If not in maintenance mode, show normal app content
  return <View style={{ flex: 1 }}>{children}</View>;
}
