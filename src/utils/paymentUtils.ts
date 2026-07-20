import { Alert } from "react-native";
import { useRouter } from "expo-router";
import apiService from "@/services/api";
import io from "socket.io-client";
import { APP_CONFIG } from "@/constants";

import { logger } from '@/utils/logger';
// Socket initialization function
export const initializeSocket = () => {
  return io(APP_CONFIG.urls.baseUrl, {
    transports: ["websocket"],
  });
};

// Payment function that can be used anywhere
export const initiatePayment = ({
  navigation,
  amount,
  parsedUserDetails,
  socket,
  setIsLoading,
  userId,
}: {
  navigation: any;
  amount: any;
  parsedUserDetails: any;
  socket: any;
  setIsLoading: any;
  userId: any;
}) => {
  if (!navigation) {
    return;
  }

  setIsLoading(true);

  // Notify server that payment was initiated
  logger.log("=== INITIAL SOCKET EMISSION DEBUG ===");
  logger.log("Socket exists:", !!socket);
  if (socket) {
    logger.log("Socket connected:", socket.connected);
    logger.log("Socket ID:", socket.id);
    logger.log("About to emit 'payment_initiated'");
    logger.log("Emission data:", {
      amount: amount,
      userId: userId,
      timestamp: new Date().toISOString(),
    });

    try {
      socket.emit("payment_initiated", {
        amount: amount,
        userId: userId,
        timestamp: new Date().toISOString(),
      });
      logger.log("✅ Initial socket emission successful!");
    } catch (error) {
      logger.error("❌ Initial socket emission failed:", error);
    }
  } else {
    logger.log("❌ Socket is null - cannot emit initial payment_initiated");
  }

  const payload = {
    userId: parsedUserDetails.data?.data?.userId || userId,
    amount: amount,
    investmentId: parsedUserDetails.data?.data?.id,
    schemeId: parsedUserDetails.data?.data?.schemeId,
    userEmail: parsedUserDetails.email,
    userMobile: parsedUserDetails.mobile,
    userName: parsedUserDetails.name,
  };

  // Convert payload to x-www-form-urlencoded format
  const formBody = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value) formBody.append(key, value);
  });

  const router = useRouter();

  return apiService
    .post("/payments/initiate", formBody.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((response) => {
      logger.log("=== PAYMENT INITIATION API RESPONSE ===");
      logger.log("Full response:", JSON.stringify(response, null, 2));
      logger.log("Response data:", JSON.stringify(response.data, null, 2));
      logger.log("Session data:", JSON.stringify(response.data.session, null, 2));

      const paymentUrl = response.data.session.payment_links.web;
      logger.log("Payment URL:", paymentUrl);

      // Emit payment metadata to socket after successful API call
      if (socket) {
        logger.log("=== SOCKET EMISSION DEBUG ===");
        logger.log("Socket exists:", !!socket);
        logger.log("Socket connected:", socket.connected);
        logger.log("Socket ID:", socket.id);

        const orderId = response.data.session.order_id;
        logger.log("Order ID from response:", orderId);

        // Debug parsedUserDetails
        logger.log("=== PARSED USER DETAILS DEBUG ===");
        logger.log("Full parsedUserDetails:", JSON.stringify(parsedUserDetails, null, 2));
        logger.log("parsedUserDetails.data?.data?.id:", parsedUserDetails.data?.data?.id);
        logger.log("parsedUserDetails.investmentId:", parsedUserDetails.investmentId);
        logger.log("parsedUserDetails.data?.data?.userId:", parsedUserDetails.data?.data?.userId);
        logger.log("parsedUserDetails.userId:", parsedUserDetails.userId);
        logger.log("parsedUserDetails.data?.data?.schemeId:", parsedUserDetails.data?.data?.schemeId);
        logger.log("parsedUserDetails.schemeId:", parsedUserDetails.schemeId);
        logger.log("parsedUserDetails.data?.data?.chitId:", parsedUserDetails.data?.data?.chitId);
        logger.log("parsedUserDetails.chitId:", parsedUserDetails.chitId);
        logger.log("parsedUserDetails.data?.data?.accountNo:", parsedUserDetails.data?.data?.accountNo);
        logger.log("parsedUserDetails.accountNo:", parsedUserDetails.accountNo);
        logger.log("parsedUserDetails.accNo:", parsedUserDetails.accNo);
        logger.log("parsedUserDetails.data?.data?.accountName:", parsedUserDetails.data?.data?.accountName);
        logger.log("parsedUserDetails.accountName:", parsedUserDetails.accountName);
        logger.log("parsedUserDetails.name:", parsedUserDetails.name);
        logger.log("Amount:", amount);

        const paymentMetadata = {
          orderId: orderId,
          investmentId: parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
          userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
          schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId,
          chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId,
          amount: amount,
          isManual: "no",
          utr_reference_number: "",
          accountNumber: parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accountNo || parsedUserDetails.accNo,
          accountName: parsedUserDetails.data?.data?.accountName || parsedUserDetails.accountName || parsedUserDetails.name
        };

        logger.log("=== FINAL PAYMENT METADATA TO EMIT ===");
        logger.log("Payment metadata object:", JSON.stringify(paymentMetadata, null, 2));
        logger.log("Individual fields:");
        logger.log("- orderId:", paymentMetadata.orderId);
        logger.log("- investmentId:", paymentMetadata.investmentId);
        logger.log("- userId:", paymentMetadata.userId);
        logger.log("- schemeId:", paymentMetadata.schemeId);
        logger.log("- chitId:", paymentMetadata.chitId);
        logger.log("- amount:", paymentMetadata.amount);
        logger.log("- isManual:", paymentMetadata.isManual);
        logger.log("- utr_reference_number:", paymentMetadata.utr_reference_number);
        logger.log("- accountNumber:", paymentMetadata.accountNumber);
        logger.log("- accountName:", paymentMetadata.accountName);

        logger.log("=== SOCKET EMISSION ===");
        logger.log("About to emit 'store_payment_metadata' with data:", paymentMetadata);

        try {
          socket.emit("store_payment_metadata", paymentMetadata);
          logger.log("✅ Socket emission successful!");
        } catch (error) {
          logger.error("❌ Socket emission failed:", error);
        }
      } else {
        logger.log("❌ Socket is null or undefined - cannot emit payment metadata");
      }

      router.push({
        pathname: "/(tabs)/home/PaymentWebView",
        params: {
          paymentUrl,
          orderId: response.data.session.order_id,
          userDetails: JSON.stringify(parsedUserDetails)
        },
      });
      return response;
    })
    .catch((error) => {
      if (socket) {
        socket.emit("payment_initiation_failed", {
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
      Alert.alert(
        "Payment Error",
        "Failed to initiate payment. Please try again."
      );
      throw error;
    })
    .finally(() => setIsLoading(false));
};

// API call functions that can be reused
export const postTransaction = async (payload: any) => {
  try {
    const response = await apiService.post("/transactions", payload);
    return response.data;
  } catch (error) {
    logger.error("Error posting transaction:", error);
    throw error;
  }
};

export const postPayment = async (payload: any) => {
  try {
    const response = await apiService.post("/payments", payload);
    return response.data;
  } catch (error) {
    logger.error("Error posting payment:", error);
    throw error;
  }
};

export const updateInvestment = async (id: any, payload: any) => {
  try {
    const response = await apiService.put(`/investments/${id}`, payload);
    return response.data;
  } catch (error) {
    logger.error("Error updating investment:", error);
    throw error;
  }
};