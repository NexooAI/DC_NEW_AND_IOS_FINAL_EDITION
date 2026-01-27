import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "expo-router";
import { AppState, AppStateStatus } from "react-native";
import { theme } from "@/constants/theme";
import { paymentAPI } from "@/services/api";

interface PaymentSocketProps {
  onPaymentSuccess?: (data: any) => void;
  onPaymentFailure?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentExpired?: () => void;
  parsedUserDetails: any;
  router: ReturnType<typeof useRouter>;
  orderId?: string;
}

export const usePaymentSocket = ({
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentError,
  onPaymentExpired,
  parsedUserDetails,
  router,
  orderId,
}: PaymentSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const isPaymentCompleted = useRef(false);
  const parsedUserDetailsRef = useRef(parsedUserDetails);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckAttemptsRef = useRef(0);
  const MAX_STATUS_CHECK_ATTEMPTS = 12; // 12 attempts * 5 seconds = 60 seconds max

  // Keep parsedUserDetailsRef updated
  useEffect(() => {
    parsedUserDetailsRef.current = parsedUserDetails;
  }, [parsedUserDetails]);

  const buildPaymentMetadata = (pd: any, currentOrderId?: string) => {
    const d = pd || {};
    const inner = d?.data?.data || {};
    return {
      orderId: currentOrderId || d?.orderId || "",
      investmentId: inner?.id || d?.id || d?.investmentId || 0,
      userId: inner?.userId || d?.userId || 0,
      schemeId: inner?.schemeId || d?.schemeId || 0,
      chitId: inner?.chitId || d?.chitId || 0,
      paymentAmount: inner?.amount || d?.amount || 0,
      amount: inner?.amount || d?.amount || 0,
      utr_reference_number: "",
      receipt: "receipt",
      currency: "INR",
      paymentStatus: "PENDING",
      isManual: "No",
      userEmail: inner?.email || d?.email || "",
      userPhone: inner?.mobile || d?.mobile || "",
    };
  };

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(theme.baseUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    const emitMetadata = (currentOrderId: string) => {
      if (!currentOrderId) {
        console.warn("⚠️ Cannot emit metadata: orderId is missing");
        return;
      }

      if (!socketInstance.connected) {
        console.warn("⚠️ Cannot emit metadata: socket not connected");
        return;
      }

      console.log("🎯 Emitting createOrder/store_payment_metadata for:", currentOrderId);
      console.log("🎯 Socket connected:", socketInstance.connected);
      console.log("🎯 Socket ID:", socketInstance.id);

      // 1. Emit createOrder
      const metadata = buildPaymentMetadata(parsedUserDetailsRef.current, currentOrderId);
      console.log("📤 Emitting createOrder with data:", JSON.stringify(metadata, null, 2));
      console.log("📤 Socket ID when emitting:", socketInstance.id);
      console.log("📤 Socket connected state:", socketInstance.connected);

      try {
        // Include socket ID in metadata (some servers need this to know where to emit back)
        const metadataWithSocket = {
          ...metadata,
          socketId: socketInstance.id,
          clientId: socketInstance.id
        };

        console.log("📤 Emitting createOrder with socket ID:", socketInstance.id);

        socketInstance.emit("createOrder", metadataWithSocket, (ack: any) => {
          if (ack) {
            console.log("✅ createOrder acknowledged:", JSON.stringify(ack, null, 2));
          } else {
            console.log("⚠️ createOrder emitted (no acknowledgment)");
          }
        });
      } catch (error) {
        console.error("❌ Error emitting createOrder:", error);
        onPaymentError?.({
          error: "Emission Error",
          message: "Failed to emit createOrder"
        });
      }

      // 2. Emit store_payment_metadata
      // Use a consistent structure for store_payment_metadata
      const userDetails = parsedUserDetailsRef.current || {};
      const inner = userDetails.data?.data || {};

      // This object structure seems to be what the backend expects based on previous code
      const storeMetadata = {
        investmentId: metadata.investmentId,
        userId: metadata.userId,
        schemeId: metadata.schemeId,
        chitId: metadata.chitId,
        paymentAmount: metadata.paymentAmount,
        amount: metadata.amount,
        isManual: metadata.isManual,
        orderId: metadata.orderId,
        utr_reference_number: metadata.utr_reference_number,
        accountNumber: inner.accountNo || userDetails.accountNo || userDetails.accNo || "",
        accountName: inner.accountName || userDetails.accountName || userDetails.accountname || "",
        userMobile: inner.mobile || userDetails.mobile || userDetails.userMobile || ""
      };

      console.log("📤 Emitting store_payment_metadata with data:", JSON.stringify(storeMetadata, null, 2));

      try {
        // Include socket ID in metadata (some servers need this to know where to emit back)
        const storeMetadataWithSocket = {
          ...storeMetadata,
          socketId: socketInstance.id,
          clientId: socketInstance.id
        };

        console.log("📤 Emitting store_payment_metadata with socket ID:", socketInstance.id);

        socketInstance.emit("store_payment_metadata", storeMetadataWithSocket, (ack: any) => {
          if (ack) {
            console.log("✅ store_payment_metadata acknowledged:", JSON.stringify(ack, null, 2));
          } else {
            console.log("⚠️ store_payment_metadata emitted (no acknowledgment)");
          }
        });
      } catch (error) {
        console.error("❌ Error emitting store_payment_metadata:", error);
        onPaymentError?.({
          error: "Emission Error",
          message: "Failed to emit store_payment_metadata"
        });
      }
    };

    // Handle connection events
    socketInstance.on("connect", () => {
      setIsSocketConnected(true);
      console.log("✅ Socket connected. ID:", socketInstance.id);
      console.log("✅ Socket listeners count:", {
        payment_status_update: socketInstance.listeners("payment_status_update").length,
        connect: socketInstance.listeners("connect").length,
        disconnect: socketInstance.listeners("disconnect").length
      });

      const currentOrderId = orderId || parsedUserDetailsRef.current?.orderId;
      if (currentOrderId) {
        console.log("🔗 Joining order room for orderId:", currentOrderId);
        // Try joining order room (some servers require this to receive events)
        socketInstance.emit("join_order", { orderId: currentOrderId });
        socketInstance.emit("join_room", { orderId: currentOrderId });
        socketInstance.emit("subscribe", { orderId: currentOrderId });

        // Small delay to ensure listener is fully set up
        setTimeout(() => {
          emitMetadata(currentOrderId);
        }, 100);
      } else {
        console.warn("⚠️ No orderId found on connect");
      }
    });

    socketInstance.on("connect_error", (error) => {
      setIsSocketConnected(false);
      console.error("❌ Socket connection error:", error.message);
      onPaymentError?.({
        error: "Connection Error",
        message: "Failed to connect to payment server",
      });
    });

    socketInstance.on("disconnect", (reason) => {
      // Only update state if payment is NOT completed
      // This prevents the UI from showing "reconnecting" or "loading" state 
      // while we are navigating to the success screen
      if (!isPaymentCompleted.current) {
        setIsSocketConnected(false);
      }

      console.log("⚠️ Socket disconnected:", reason);

      if (!isPaymentCompleted.current) {
        // Only report error if we weren't expecting a disconnect (i.e., payment not done)
        // And also maybe check if it's io client disconnect (manual)
        if (reason !== "io client disconnect") {
          onPaymentError?.({
            error: "Disconnected",
            message: "Lost connection to payment server",
          });
        }
      }
    });

    // Listen for payment status updates
    const handlePaymentStatusUpdate = async (data: any) => {
      console.log("📩 Payment Update Received:", JSON.stringify(data, null, 2));
      console.log("📩 Payment Update Data Type:", typeof data);
      console.log("📩 Payment Update Has Data:", !!data);
      console.log("📩 Payment Update Keys:", data ? Object.keys(data) : "No data");

      // Verify data exists
      if (!data) {
        console.error("❌ payment_status_update received but data is null/undefined");
        onPaymentError?.({
          error: "Invalid Data",
          message: "Received payment update but data is missing"
        });
        return;
      }

      // Check success status
      // Handle various response formats:
      // 1. { status: "Success" } - capital S
      // 2. { status: "success" } - lowercase
      // 3. { paymentResponse: { status: "captured" } } - Razorpay format
      // 4. { paymentResponse: { status: "CHARGED" } } - other gateways
      const statusLower = data?.status?.toLowerCase() || "";
      const paymentStatus = data?.paymentResponse?.status?.toLowerCase() || "";
      const messageLower = data?.message?.toLowerCase() || "";

      const isSuccess =
        statusLower === "success" ||
        statusLower === "completed" ||
        paymentStatus === "captured" ||
        paymentStatus === "charged" ||
        data?.paymentResponse?.status === "CHARGED" ||
        data?.paymentResponse?.txn_detail?.status === "CHARGED" ||
        messageLower.includes("success") ||
        messageLower.includes("successful");

      const isFailed =
        statusLower === "failed" ||
        statusLower === "failure" ||
        paymentStatus === "failed" ||
        data?.paymentResponse?.status === "FAILED" ||
        data?.paymentResponse?.txn_detail?.status === "FAILED" ||
        messageLower.includes("failed") ||
        messageLower.includes("failure");

      try {
        if (isSuccess) {
          console.log("✅ Payment Success Detected");
          isPaymentCompleted.current = true;

          // Stop status checking interval
          if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
            statusCheckIntervalRef.current = null;
            console.log("🛑 Stopped status checking interval");
          }

          // Clean up socket
          if (socketInstance.connected) socketInstance.disconnect();

          // Trigger callback or default navigation
          if (onPaymentSuccess) {
            onPaymentSuccess(data);
          } else {
            // Default handling if no callback provided (though PaymentWebView provides one)
            const response = data?.paymentResponse || {};
            // Handle different response formats:
            // Razorpay: response.id (payment ID), response.order_id
            // Other gateways: response.txn_id, response.order_id
            const txnId = response.id || response.txn_id || response.gatewayTransactionId || "";
            const orderId = response.order_id || data?.orderId || "";

            // Amount handling: Gateway usually returns amount in paise (1/100 INR)
            // If response has an ID starting with 'pay_', it's likely a Razorpay object with amount in paise
            let amount = response.amount || data?.amount || 0;
            if (response.id && response.id.startsWith('pay_') && response.currency === 'INR') {
              // Convert paise to rupees
              amount = amount / 100;
            }

            const message = data?.message || response.payment_gateway_response?.resp_message || 'Payment Successful';

            console.log("✅ Navigating to success page with:", { txnId, orderId, amount, message });

            router.replace({
              pathname: '/(tabs)/home/payment-success',
              params: {
                amount: amount.toString(),
                txnId: txnId,
                orderId: orderId,
                message: message
              }
            });
          }

        } else if (isFailed) {
          console.log("❌ Payment Failure Detected");
          isPaymentCompleted.current = true;

          // Stop status checking interval
          if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
            statusCheckIntervalRef.current = null;
            console.log("🛑 Stopped status checking interval");
          }

          if (socketInstance.connected) socketInstance.disconnect();

          if (onPaymentFailure) {
            onPaymentFailure(data);
          } else {
            const response = data?.paymentResponse || {};
            // Handle different response formats
            const txnId = response.id || response.txn_id || response.gatewayTransactionId || "";
            const orderId = response.order_id || data?.orderId || "";
            // Amount handling: Gateway usually returns amount in paise (1/100 INR)
            let amount = response.amount || data?.amount || 0;
            if (response.id && response.id.startsWith('pay_') && response.currency === 'INR') {
              // Convert paise to rupees
              amount = amount / 100;
            }

            const message = data?.message ||
              response.payment_gateway_response?.resp_message ||
              response.txn_detail?.error_message ||
              response.error_description ||
              'Payment Failed';
            const status = response.status || data?.status || "FAILED";

            console.log("❌ Navigating to failure page with:", { txnId, orderId, amount, message, status });

            router.replace({
              pathname: '/(tabs)/home/payment-failure',
              params: {
                message: message,
                orderId: orderId,
                txnId: txnId,
                amount: amount.toString(),
                status: status
              }
            });
          }
        } else if (data?.status === "expired") {
          console.log("⚠️ Payment Expired");
          if (socketInstance.connected) socketInstance.disconnect();
          onPaymentExpired?.();
        } else {
          // Unknown status - log for debugging
          console.warn("⚠️ Unknown payment status received:", data?.status, data);
        }
      } catch (error) {
        console.error("❌ Error processing socket event:", error);
        onPaymentError?.({
          error: "Processing Error",
          message: "Failed to process payment update"
        });
      }
    };

    // Set up event listener BEFORE connection to ensure it's ready
    console.log("🔌 Setting up payment_status_update listener...");
    socketInstance.on("payment_status_update", handlePaymentStatusUpdate);

    // Listen to ALL socket events for debugging
    socketInstance.onAny((eventName, ...args) => {
      console.log("🔔 Socket event received:", eventName);
      if (args.length > 0) {
        console.log("   Data:", JSON.stringify(args[0], null, 2));
      }
    });

    // Verify listener is attached
    const listenerCount = socketInstance.listeners("payment_status_update").length;
    console.log("✅ payment_status_update listener attached. Active listeners:", listenerCount);

    if (listenerCount === 0) {
      console.error("❌ WARNING: payment_status_update listener was NOT attached!");
    }


    // App State handling for reconnection
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        const currentOrderId = orderId || parsedUserDetailsRef.current?.orderId;
        console.log("📱 App active. Socket connected:", socketRef.current?.connected);

        if (socketRef.current && !socketRef.current.connected) {
          console.log("🔄 Reconnecting socket...");
          socketRef.current.connect();
        } else if (socketRef.current?.connected && currentOrderId) {
          // Re-emit metadata just in case server lost context, but be careful of duplication if server isn't idempotent
          // For now, let's assume we should refresh the order context
          // emitMetadata(currentOrderId); 
          // Commented out to avoid double-emit if logic doesn't require it, 
          // but original code had it. Let's keep it safe:
          console.log("🔄 active state: check order status or re-emit if needed");
        }
      }
    };

    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

    // Listen for status response events (in case server responds to status requests)
    socketInstance.on("payment_status_response", (data: any) => {
      console.log("📥 Payment status response received:", data);
      if (data && (data.status === "success" || data.status === "Success" || data.paymentResponse?.status === "captured")) {
        handlePaymentStatusUpdate(data);
      }
    });

    socketInstance.on("get_payment_status_response", (data: any) => {
      console.log("📥 get_payment_status response received:", data);
      if (data && (data.status === "success" || data.status === "Success" || data.paymentResponse?.status === "captured")) {
        handlePaymentStatusUpdate(data);
      }
    });

    // Set up periodic status check as fallback (if socket doesn't emit)
    // Check every 5 seconds if payment is completed, max 12 attempts (60 seconds)
    const currentOrderId = orderId || parsedUserDetailsRef.current?.orderId;
    if (currentOrderId && !isPaymentCompleted.current) {
      statusCheckAttemptsRef.current = 0;

      statusCheckIntervalRef.current = setInterval(async () => {
        if (isPaymentCompleted.current) {
          if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
            statusCheckIntervalRef.current = null;
          }
          return;
        }

        statusCheckAttemptsRef.current += 1;
        const attempts = statusCheckAttemptsRef.current;

        console.log(`⏰ Periodic check (${attempts}/${MAX_STATUS_CHECK_ATTEMPTS}): Requesting payment status for orderId:`, currentOrderId);

        // Try socket events first
        if (socketInstance.connected) {
          socketInstance.emit("get_payment_status", { orderId: currentOrderId }, (response: any) => {
            if (response) {
              console.log("✅ get_payment_status response:", response);
              if (response.status === "success" || response.status === "Success" || response.paymentResponse?.status === "captured") {
                handlePaymentStatusUpdate(response);
              }
            }
          });

          socketInstance.emit("check_payment_status", { orderId: currentOrderId }, (response: any) => {
            if (response) {
              console.log("✅ check_payment_status response:", response);
              if (response.status === "success" || response.status === "Success" || response.paymentResponse?.status === "captured") {
                handlePaymentStatusUpdate(response);
              }
            }
          });
        }

        // HTTP API fallback - try every 3rd attempt (every 15 seconds)
        if (attempts % 3 === 0) {
          try {
            console.log("🌐 Trying HTTP API to check payment status...");
            const response = await paymentAPI.getPaymentStatus(currentOrderId);
            console.log("🌐 HTTP API response:", response.data);

            if (response?.data) {
              const apiData = response.data;
              // Check if payment is successful
              if (apiData.status === "success" ||
                apiData.status === "Success" ||
                apiData.paymentResponse?.status === "captured" ||
                apiData.payment?.status === "captured") {
                console.log("✅ Payment success detected via HTTP API!");
                // Format response to match socket event structure
                const formattedData = {
                  orderId: currentOrderId,
                  status: apiData.status || "Success",
                  message: apiData.message || "Payment Successful",
                  paymentResponse: apiData.paymentResponse || apiData.payment || {}
                };
                handlePaymentStatusUpdate(formattedData);
              }
            }
          } catch (error: any) {
            console.log("⚠️ HTTP API status check failed:", error?.message || error);
            // Don't stop on API errors, continue trying
          }
        }

        // Stop after max attempts
        if (attempts >= MAX_STATUS_CHECK_ATTEMPTS) {
          console.warn(`⚠️ Stopped status checking after ${MAX_STATUS_CHECK_ATTEMPTS} attempts (60 seconds)`);
          console.warn("   Payment status was not received. User may need to check manually.");
          if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
            statusCheckIntervalRef.current = null;
          }
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      // Cleanup
      console.log("🧹 Cleaning up socket connection...");

      // Clear status check interval
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }

      if (socketRef.current) {
        // Remove all listeners before disconnecting
        socketRef.current.off("payment_status_update");
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.disconnect();
      }
      appStateSubscription.remove();
    };
  }, [router, orderId]); // Removed parsedUserDetails from dep array to avoid reconnects on minor updates, using Ref instead

  const handleCancel = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
    router.replace({ pathname: '/(tabs)/home/payment-failure', params: { message: "Payment Cancelled" } });
  };

  return {
    socket: socketRef.current,
    isSocketConnected,
    handleCancel,
  };
};
