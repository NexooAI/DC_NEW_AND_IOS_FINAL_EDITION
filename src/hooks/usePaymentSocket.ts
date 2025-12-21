import { useCallback, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { AppState, AppStateStatus } from "react-native";
import { logger } from "@/utils/logger";
import { theme } from "@/constants/theme";

interface PaymentSocketProps {
  onPaymentSuccess?: (data: any) => void;
  onPaymentFailure?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentExpired?: () => void;
  parsedUserDetails: any;
  router: any;
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
  // refs
  const socketRef = useRef<Socket | null>(null);
  const isPaymentCompletedRef = useRef(false);
  const parsedUserDetailsRef = useRef(parsedUserDetails);
  const orderIdRef = useRef(orderId);
  const appStateSubscriptionRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // keep latest callbacks in refs to avoid stale closures
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const onPaymentFailureRef = useRef(onPaymentFailure);
  const onPaymentErrorRef = useRef(onPaymentError);
  const onPaymentExpiredRef = useRef(onPaymentExpired);

  useEffect(() => { parsedUserDetailsRef.current = parsedUserDetails; }, [parsedUserDetails]);
  useEffect(() => { orderIdRef.current = orderId; }, [orderId]);

  useEffect(() => { onPaymentSuccessRef.current = onPaymentSuccess; }, [onPaymentSuccess]);
  useEffect(() => { onPaymentFailureRef.current = onPaymentFailure; }, [onPaymentFailure]);
  useEffect(() => { onPaymentErrorRef.current = onPaymentError; }, [onPaymentError]);
  useEffect(() => { onPaymentExpiredRef.current = onPaymentExpired; }, [onPaymentExpired]);

  // Build metadata safely (defaults to 0 / empty string rather than magic numbers)
  const buildPaymentMetadata = (pd: any, currentOrderId?: string) => {
    const d = pd || {};
    const inner = d?.data?.data || {};
    return {
      orderId: currentOrderId || d?.orderId || "",
      investmentId: inner?.id || d?.id || d?.investmentId || 0,
      userId: inner?.userId || d?.userId || 0,
      schemeId: inner?.schemeId || d?.schemeId || 0,
      chitId: inner?.chitId || d?.chitId || 0,
      amount: inner?.amount || d?.amount || 0,
      isManual: "no",
      utr_reference_number: "",
      accountNumber: inner?.accountNo || d?.accountNo || d?.accNo || "",
      accountName: inner?.accountName || d?.accountName || d?.accountname || "",
      userMobile: inner?.mobile || d?.mobile || d?.userMobile || "",
    };
  };

  // Join room and send metadata (reads latest refs)
  const joinRoomAndStoreMetadata = (socket: Socket) => {
    // Safety check - ensure socket is valid
    if (!socket) {
      logger.error("🔌 [Socket] CRITICAL: joinRoomAndStoreMetadata called with null socket", {
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const currentOrderId = orderIdRef.current || parsedUserDetailsRef.current?.orderId;

    logger.log("🔌 [Socket] joinRoomAndStoreMetadata called", {
      timestamp: new Date().toISOString(),
      hasOrderId: !!currentOrderId,
      orderId: currentOrderId,
      socketConnected: socket.connected,
      socketId: socket.id || "none",
    });

    if (!currentOrderId) {
      logger.error("🔌 [Socket] ERROR: No orderId available to join room", {
        orderIdRef: orderIdRef.current,
        parsedUserDetailsOrderId: parsedUserDetailsRef.current?.orderId,
        parsedUserDetails: parsedUserDetailsRef.current,
      });
      return;
    }

    // Safety check - ensure socket is connected before emitting
    if (!socket.connected) {
      logger.warn("🔌 [Socket] WARNING: Socket not connected, cannot join room", {
        socketId: socket.id || "none",
        connected: socket.connected,
        orderId: currentOrderId,
      });
      return;
    }

    try {
      logger.log("🔌 [Socket] Joining order room...", {
        orderId: currentOrderId,
        socketId: socket.id || "none",
        connected: socket.connected,
      });

      // Safety check before emit
      if (typeof socket.emit !== 'function') {
        logger.error("🔌 [Socket] CRITICAL: socket.emit is not a function", {
          socketType: typeof socket,
          socketId: socket.id,
        });
        return;
      }

      socket.emit("joinOrderRoom", currentOrderId);
      logger.log("🔌 [Socket] joinOrderRoom event emitted", {
        orderId: currentOrderId,
        timestamp: new Date().toISOString(),
      });

      const metadata = buildPaymentMetadata(parsedUserDetailsRef.current, currentOrderId);
      logger.log("🔌 [Socket] Sending payment metadata...", {
        metadata: metadata,
        orderId: currentOrderId,
      });

      socket.emit("store_payment_metadata", metadata);
      logger.log("🔌 [Socket] store_payment_metadata event emitted", {
        metadata: metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error("🔌 [Socket] CRITICAL ERROR in join/store metadata:", {
        error: err,
        errorMessage: (err as Error)?.message,
        stack: (err as Error)?.stack,
        orderId: currentOrderId,
        socketConnected: socket.connected,
        socketId: socket.id || "none",
      });
    }
  };

  // Payment event handler — tolerant parsing of status
  const handlePaymentStatusPayload = (payload: any) => {
    logger.log("📨 [Socket] handlePaymentStatusPayload called", {
      timestamp: new Date().toISOString(),
      hasPayload: !!payload,
      payloadKeys: payload ? Object.keys(payload) : [],
      orderId: orderIdRef.current,
    });

    try {
      const rawStatus =
        (payload?.status ?? payload?.payment_status ?? (payload?.success ? "success" : undefined) ?? "")
          .toString()
          .toLowerCase();

      logger.log("📨 [Socket] Payment status parsed", {
        rawStatus: rawStatus,
        status: payload?.status,
        payment_status: payload?.payment_status,
        success: payload?.success,
      });

      if (rawStatus === "success" || rawStatus === "paid") {
        logger.log("✅ [Socket] Payment SUCCESS detected", {
          timestamp: new Date().toISOString(),
          status: rawStatus,
          orderId: payload?.paymentResponse?.order_id,
          trackingId: payload?.paymentResponse?.tracking_id,
        });
        isPaymentCompletedRef.current = true;
        onPaymentSuccessRef.current?.(payload);
      } else if (rawStatus === "failure" || rawStatus === "failed") {
        logger.log("❌ [Socket] Payment FAILURE detected", {
          timestamp: new Date().toISOString(),
          status: rawStatus,
          orderId: payload?.paymentResponse?.order_id,
          trackingId: payload?.paymentResponse?.tracking_id,
        });
        isPaymentCompletedRef.current = true;
        onPaymentFailureRef.current?.(payload);
      } else {
        // Unknown status — forward to error handler for visibility
        logger.warn("⚠️ [Socket] payment_status_update (unknown status):", {
          status: rawStatus,
          payload: payload,
          orderId: orderIdRef.current,
        });
      }
    } catch (err) {
      logger.error("❌ [Socket] CRITICAL ERROR in handlePaymentStatusPayload:", {
        error: err,
        errorMessage: (err as Error)?.message,
        stack: (err as Error)?.stack,
        payload: payload,
        orderId: orderIdRef.current,
      });
    }
  };

  // Initialize socket (safe: removes previous socket listeners before creating new one)
  const initSocketConnection = useCallback(() => {
    logger.log("🔌 [Socket] Initializing socket connection...", {
      timestamp: new Date().toISOString(),
      baseUrl: theme.baseUrl,
      orderId: orderIdRef.current,
      hasExistingSocket: !!socketRef.current,
    });

    // Clean old socket if exists
    if (socketRef.current) {
      try {
        logger.log("🔌 [Socket] Cleaning up existing socket...", {
          socketId: socketRef.current.id,
          connected: socketRef.current.connected,
        });
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        logger.log("🔌 [Socket] Old socket cleaned up successfully");
      } catch (e) {
        logger.error("🔌 [Socket] Error cleaning old socket:", e);
      }
      socketRef.current = null;
    }

    try {
      logger.log("🔌 [Socket] Creating new socket instance...", {
        baseUrl: theme.baseUrl,
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      const socket = io(theme.baseUrl, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;
      logger.log("🔌 [Socket] Socket instance created", {
        socketId: socket.id || "pending",
        connected: socket.connected,
      });
    } catch (error) {
      logger.error("🔌 [Socket] CRITICAL: Failed to create socket instance:", error);
      onPaymentErrorRef.current?.({
        error: "Socket Creation Error",
        message: "Failed to initialize socket connection",
        details: error,
      });
      return null;
    }

    const socket = socketRef.current;

    // Safety check - ensure socket was created
    if (!socket) {
      logger.error("🔌 [Socket] CRITICAL: Socket is null after creation", {
        timestamp: new Date().toISOString(),
        baseUrl: theme.baseUrl,
      });
      onPaymentErrorRef.current?.({
        error: "Socket Creation Failed",
        message: "Failed to create socket instance",
      });
      return null;
    }

    // named handlers (so they can be removed if needed)
    const onConnect = () => {
      // Safety check - ensure socket still exists
      if (!socket || !socketRef.current) {
        logger.error("🔌 [Socket] CRITICAL: Socket is null in onConnect handler", {
          timestamp: new Date().toISOString(),
        });
        return;
      }

      logger.log("✅ [Socket] CONNECTED successfully", {
        timestamp: new Date().toISOString(),
        socketId: socket.id || "none",
        connected: socket.connected,
        orderId: orderIdRef.current,
      });
      try {
        joinRoomAndStoreMetadata(socket);
      } catch (error) {
        logger.error("🔌 [Socket] Error in joinRoomAndStoreMetadata after connect:", {
          error: error,
          errorMessage: (error as Error)?.message,
          stack: (error as Error)?.stack,
        });
      }
    };

    const onConnectError = (err: any) => {
      logger.error("❌ [Socket] CONNECTION ERROR", {
        timestamp: new Date().toISOString(),
        error: err,
        errorType: err?.type || "unknown",
        errorMessage: err?.message || String(err),
        socketId: socket.id || "none",
        connected: socket.connected,
        orderId: orderIdRef.current,
        baseUrl: theme.baseUrl,
        stack: err?.stack,
      });
      onPaymentErrorRef.current?.({
        error: "Connection Error",
        message: "Failed to connect to payment server",
        details: err,
      });
    };

    const onDisconnect = (reason: any) => {
      logger.log("🔌 [Socket] DISCONNECTED", {
        timestamp: new Date().toISOString(),
        reason: reason,
        reasonType: typeof reason,
        socketId: socket.id || "none",
        wasConnected: socket.connected,
        orderId: orderIdRef.current,
        paymentCompleted: isPaymentCompletedRef.current,
      });

      if (!isPaymentCompletedRef.current) {
        // Check if it's a transport error (common with UPI URL interception)
        const isTransportError = reason === "transport error" || reason === "transport close";

        logger.log("🔌 [Socket] Disconnect details", {
          isTransportError,
          reason,
          willReload: isTransportError,
        });

        onPaymentErrorRef.current?.({
          error: "Disconnected",
          message: isTransportError
            ? "Connection lost during payment process - webview will reload automatically"
            : "Lost connection to payment server",
          reason,
          isTransportError,
        });
      } else {
        logger.log("🔌 [Socket] Disconnect ignored - payment already completed");
      }
    };

    const onPaymentStatus = (data: any) => {
      // Safety check - ensure socket still exists and component is mounted
      if (!socket || !socketRef.current || !mountedRef.current) {
        logger.warn("🔌 [Socket] Ignoring payment_status_update - socket null or component unmounted", {
          hasSocket: !!socket,
          hasSocketRef: !!socketRef.current,
          isMounted: mountedRef.current,
        });
        return;
      }

      logger.log("📨 [Socket] payment_status_update received", {
        timestamp: new Date().toISOString(),
        hasData: !!data,
        status: data?.status || data?.payment_status,
        orderId: data?.paymentResponse?.order_id,
        trackingId: data?.paymentResponse?.tracking_id,
        amount: data?.paymentResponse?.amount,
      });
      try {
        handlePaymentStatusPayload(data);
      } catch (error) {
        logger.error("🔌 [Socket] Error handling payment status:", {
          error: error,
          errorMessage: (error as Error)?.message,
          stack: (error as Error)?.stack,
        });
      }
    };

    const onPaymentErrorEvent = (err: any) => {
      logger.error("❌ [Socket] Server emitted payment_error", {
        timestamp: new Date().toISOString(),
        error: err,
        errorType: err?.type || typeof err,
        errorMessage: err?.message || String(err),
        orderId: orderIdRef.current,
        fullError: JSON.stringify(err, null, 2),
      });
      onPaymentErrorRef.current?.(err);
    };

    const onPaymentExpired = (data?: any) => {
      logger.log("⏰ [Socket] payment_expired event received", {
        timestamp: new Date().toISOString(),
        data: data,
        orderId: orderIdRef.current,
      });
      isPaymentCompletedRef.current = true;
      onPaymentExpiredRef.current?.();
    };

    // Add reconnection event handlers
    const onReconnect = (attemptNumber: number) => {
      logger.log("🔄 [Socket] RECONNECTING", {
        timestamp: new Date().toISOString(),
        attemptNumber: attemptNumber,
        socketId: socket.id || "none",
        orderId: orderIdRef.current,
      });
    };

    const onReconnectAttempt = (attemptNumber: number) => {
      logger.log("🔄 [Socket] Reconnection attempt", {
        timestamp: new Date().toISOString(),
        attemptNumber: attemptNumber,
        maxAttempts: 5,
        orderId: orderIdRef.current,
      });
    };

    const onReconnectError = (error: any) => {
      logger.error("❌ [Socket] RECONNECTION ERROR", {
        timestamp: new Date().toISOString(),
        error: error,
        errorMessage: error?.message || String(error),
        orderId: orderIdRef.current,
      });
    };

    const onReconnectFailed = () => {
      logger.error("❌ [Socket] RECONNECTION FAILED - Max attempts reached", {
        timestamp: new Date().toISOString(),
        maxAttempts: 5,
        orderId: orderIdRef.current,
      });
      onPaymentErrorRef.current?.({
        error: "Reconnection Failed",
        message: "Failed to reconnect to payment server after multiple attempts",
      });
    };

    // attach event listeners with logging
    logger.log("🔌 [Socket] Attaching event listeners...");

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("payment_status_update", onPaymentStatus);
    socket.on("payment_error", onPaymentErrorEvent);
    socket.on("payment_expired", onPaymentExpired);
    socket.on("reconnect", onReconnect);
    socket.on("reconnect_attempt", onReconnectAttempt);
    socket.on("reconnect_error", onReconnectError);
    socket.on("reconnect_failed", onReconnectFailed);

    logger.log("🔌 [Socket] Event listeners attached", {
      listenersCount: 9,
      socketId: socket.id || "pending",
    });

    // Log initial connection state
    logger.log("🔌 [Socket] Initial connection state", {
      connected: socket.connected,
      disconnected: socket.disconnected,
      socketId: socket.id || "none",
    });

    return socket;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // uses refs for dynamic values, so no deps needed

  // AppState handling (use current refs inside)
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    logger.log("📱 [Socket] AppState changed", {
      timestamp: new Date().toISOString(),
      nextAppState: nextAppState,
      isActive: nextAppState === "active",
    });

    if (nextAppState !== "active") {
      logger.log("📱 [Socket] AppState not active, skipping socket check");
      return;
    }

    const s = socketRef.current;
    const currentOrderId = orderIdRef.current || parsedUserDetailsRef.current?.orderId;

    logger.log("📱 [Socket] AppState active - Checking socket...", {
      hasSocket: !!s,
      socketConnected: s?.connected,
      socketId: s?.id || "none",
      orderId: currentOrderId,
    });

    if (!s) {
      logger.log("📱 [Socket] No socket found - initializing new connection");
      try {
        initSocketConnection();
      } catch (error) {
        logger.error("📱 [Socket] Error initializing socket from AppState:", error);
      }
      return;
    }

    if (!s.connected) {
      logger.log("📱 [Socket] Socket not connected - attempting to connect...", {
        socketId: s.id || "none",
        disconnected: s.disconnected,
      });
      try {
        s.connect();
        logger.log("📱 [Socket] Socket.connect() called");
      } catch (error) {
        logger.error("📱 [Socket] Error calling socket.connect():", error);
      }
      return;
    }

    // socket is connected; re-join room and resend metadata (ensures server has latest context)
    if (s.connected && currentOrderId) {
      logger.log("📱 [Socket] Socket connected - rejoining room and resending metadata");
      try {
        joinRoomAndStoreMetadata(s);
      } catch (error) {
        logger.error("📱 [Socket] Error in joinRoomAndStoreMetadata from AppState:", error);
      }
    } else {
      logger.warn("📱 [Socket] Socket connected but missing orderId", {
        connected: s.connected,
        hasOrderId: !!currentOrderId,
      });
    }
  }, [initSocketConnection]);

  // Start connection + subscribe AppState once
  useEffect(() => {
    logger.log("🔌 [Socket] useEffect - Initializing socket connection", {
      timestamp: new Date().toISOString(),
      orderId: orderIdRef.current,
    });

    mountedRef.current = true;

    let socket: Socket | null = null;
    try {
      socket = initSocketConnection();
      if (!socket) {
        logger.error("🔌 [Socket] CRITICAL: initSocketConnection returned null");
      }
    } catch (error) {
      logger.error("🔌 [Socket] CRITICAL ERROR in initSocketConnection:", {
        error: error,
        errorMessage: (error as Error)?.message,
        stack: (error as Error)?.stack,
      });
    }

    // AppState subscription
    try {
      logger.log("📱 [Socket] Subscribing to AppState changes...");
      const subscription = AppState.addEventListener("change", handleAppStateChange);
      appStateSubscriptionRef.current = subscription;
      logger.log("📱 [Socket] AppState subscription created successfully");
    } catch (e) {
      logger.error("📱 [Socket] Error creating AppState subscription:", e);
      // older RN fallback
      try {
        // @ts-ignore legacy
        AppState.removeEventListener && AppState.removeEventListener; // noop to satisfy lint
      } catch { /* ignore */ }
    }

    return () => {
      logger.log("🔌 [Socket] Cleanup - Component unmounting", {
        timestamp: new Date().toISOString(),
        hasSocket: !!socketRef.current,
        socketConnected: socketRef.current?.connected,
      });

      mountedRef.current = false;

      // cleanup socket
      if (socketRef.current) {
        try {
          logger.log("🔌 [Socket] Cleaning up socket...", {
            socketId: socketRef.current.id || "none",
            connected: socketRef.current.connected,
          });
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          logger.log("🔌 [Socket] Socket cleaned up successfully");
        } catch (err) {
          logger.error("🔌 [Socket] Error during socket cleanup:", err);
        }
        socketRef.current = null;
      }

      // cleanup AppState listener
      if (appStateSubscriptionRef.current && typeof appStateSubscriptionRef.current.remove === "function") {
        try {
          appStateSubscriptionRef.current.remove();
          logger.log("📱 [Socket] AppState subscription removed");
        } catch (e) {
          logger.error("📱 [Socket] Error removing AppState subscription:", e);
        }
      }
    };
    // initSocketConnection and handleAppStateChange are stable (init uses refs)
  }, [initSocketConnection, handleAppStateChange]);

  // Manual reconnect helper
  const reconnectSocket = useCallback(() => {
    logger.log("🔄 [Socket] Manual reconnect requested", {
      timestamp: new Date().toISOString(),
      hasExistingSocket: !!socketRef.current,
      orderId: orderIdRef.current,
    });

    try {
      if (socketRef.current) {
        logger.log("🔄 [Socket] Cleaning up existing socket for reconnect...", {
          socketId: socketRef.current.id || "none",
          connected: socketRef.current.connected,
        });
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        logger.log("🔄 [Socket] Existing socket cleaned up");
      }
    } catch (e) {
      logger.error("🔄 [Socket] Error during reconnect cleanup:", e);
    }

    logger.log("🔄 [Socket] Initiating new socket connection...");
    try {
      // create new socket immediately
      const newSocket = initSocketConnection();
      if (!newSocket) {
        logger.error("🔄 [Socket] CRITICAL: reconnectSocket - initSocketConnection returned null");
      } else {
        logger.log("🔄 [Socket] New socket connection initiated", {
          socketId: newSocket.id || "pending",
        });
      }
    } catch (error) {
      logger.error("🔄 [Socket] CRITICAL ERROR in reconnectSocket:", {
        error: error,
        errorMessage: (error as Error)?.message,
        stack: (error as Error)?.stack,
      });
    }
  }, [initSocketConnection]);

  // Cancel handler (disconnect + navigate to failure page)
  const handleCancel = useCallback(() => {
    logger.log("🚫 [Socket] handleCancel called", {
      timestamp: new Date().toISOString(),
      hasSocket: !!socketRef.current,
      socketConnected: socketRef.current?.connected,
      orderId: orderIdRef.current,
    });

    try {
      if (socketRef.current && socketRef.current.connected) {
        logger.log("🚫 [Socket] Disconnecting socket for cancel...", {
          socketId: socketRef.current.id || "none",
        });
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        logger.log("🚫 [Socket] Socket disconnected for cancel");
      } else {
        logger.log("🚫 [Socket] No socket or socket not connected, skipping disconnect");
      }
    } catch (e) {
      logger.error("🚫 [Socket] Error during cancel disconnect:", e);
    }

    // navigate to failure page (keep simple replace)
    try {
      logger.log("🚫 [Socket] Navigating to payment-failure page...");
      router.replace("/(tabs)/home/payment-failure");
      logger.log("🚫 [Socket] Navigation to payment-failure initiated");
    } catch (e) {
      logger.error("🚫 [Socket] Error navigating to payment-failure:", e);
    }
  }, [router]);

  // Expose both the ref and the current socket (for compatibility)
  return {
    socketRef, // preferred: use socketRef.current to access live socket
    socket: socketRef.current,
    handleCancel,
    reconnectSocket,
  };
};
