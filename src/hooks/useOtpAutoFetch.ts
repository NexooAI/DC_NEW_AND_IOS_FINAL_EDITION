import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { logger } from '@/utils/logger';

import Constants from 'expo-constants';

// Import SMS Retriever for Android - with safety checks
// Dynamically required to avoid Expo Go crashes
const getOtpVerify = () => {
  // Prevent require in Expo Go which causes "Cannot read property 'requestPhoneNumber' of null"
  if (Constants.executionEnvironment === 'storeClient') return null;

  if (Platform.OS !== 'android') return null;
  try {
    return require('@pushpendersingh/react-native-otp-verify');
  } catch (e) {
    return null;
  }
};

let SmsRetrieverAvailable = false;

if (Platform.OS === 'android') {
  const OtpVerify = getOtpVerify();
  if (OtpVerify && typeof OtpVerify.startSmsRetriever === 'function') {
    SmsRetrieverAvailable = true;
  }
}

interface UseOtpAutoFetchProps {
  onOtpReceived: (otp: string) => void;
  isActive: boolean;
  senderName?: string;
}

export const useOtpAutoFetch = ({
  onOtpReceived,
  isActive,
  senderName = 'Sri Thanga Thamarai'
}: UseOtpAutoFetchProps) => {
  const smsListenerRef = useRef<any>(null);

  // Extract OTP from message based on your SMS format
  const extractOtpFromMessage = (message: string): string | null => {
    //logger.log('Received SMS message:', message);

    // Multiple patterns to match different OTP formats
    const patterns = [
      // Pattern for "Your OTP for Sri Thanga Thamarai DigitalApp registration is 5799"
      /Your OTP for.*?is\s+(\d{4,6})/i,
      // Generic 4-6 digit OTP patterns
      /OTP.*?(\d{4,6})/i,
      /(\d{4,6}).*?OTP/i,
      /verification.*?(\d{4,6})/i,
      /code.*?(\d{4,6})/i,
      // Match any 4-6 digit number (fallback)
      /\b(\d{4,6})\b/
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const otp = match[1];
        //logger.log('Extracted OTP:', otp);
        return otp;
      }
    }

    //logger.log('No OTP pattern matched');
    return null;
  };

  // Start SMS listening for Android using SMS Retriever API
  const startSmsListener = async () => {
    const OtpVerify = getOtpVerify();

    if (Platform.OS !== 'android' || !OtpVerify) {
      // SMS Retriever not available - silently skip
      return;
    }

    try {
      // Get the App Hash (Signature) for debugging/setup (optional)
      // You need to add this hash to your SMS message for auto-retrieval to work
      // Format: "<#> Your OTP is 1234 [HASH]"
      if (typeof OtpVerify.getAppSignature === 'function') {
        try {
          const hash = await OtpVerify.getAppSignature();
          console.log('App Hash for SMS Retriever:', hash);
        } catch (hashError) {
          // getAppSignature might not be available on all devices
          console.log('Could not get app signature:', hashError);
        }
      }

      // Start SMS listener - this does NOT require READ_SMS permission
      if (typeof OtpVerify.startSmsRetriever !== 'function') {
        console.log('OTP Verify not properly linked. Run "npx expo run:android" to rebuild.');
        return;
      }

      await OtpVerify.startSmsRetriever();

      smsListenerRef.current = OtpVerify.addSmsListener((message: string) => {
        if (message) {
          const otp = extractOtpFromMessage(message);
          if (otp) {
            onOtpReceived(otp);
            stopSmsListener(); // Stop listening after successful OTP extraction
          }
        }
      });
    } catch (error) {
      // Silently fail - SMS auto-read is a convenience feature
      console.log('OTP Verify error (rebuild may be needed):', error);
    }
  };

  // Stop SMS listener
  const stopSmsListener = () => {
    if (smsListenerRef.current) {
      try {
        const OtpVerify = getOtpVerify();
        if (Platform.OS === 'android' && OtpVerify) {
          if (typeof OtpVerify.removeSmsListener === 'function') {
            OtpVerify.removeSmsListener();
          }
        }
        smsListenerRef.current = null;
      } catch (error) {
        // Silently fail
      }
    }
  };

  // Effect to manage SMS listener lifecycle
  useEffect(() => {
    if (isActive && Platform.OS === 'android') {
      startSmsListener();
    }

    return () => {
      stopSmsListener();
    };
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSmsListener();
    };
  }, []);

  return {
    startSmsListener,
    stopSmsListener,
    extractOtpFromMessage,
  };
};