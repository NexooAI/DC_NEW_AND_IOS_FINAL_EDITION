import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { logger } from '@/utils/logger';

import Constants from 'expo-constants';

// Import SMS Retriever for Android - with safety checks
// Dynamically required to avoid Expo Go crashes
const getSmsRetriever = () => {
  // Prevent require in Expo Go which causes "Cannot read property 'requestPhoneNumber' of null"
  if (Constants.executionEnvironment === 'storeClient') return null;

  if (Platform.OS !== 'android') return null;
  try {
    return require('react-native-sms-retriever').default;
  } catch (e) {
    return null;
  }
};

let SmsRetrieverAvailable = false;

if (Platform.OS === 'android') {
  const SmsRetriever = getSmsRetriever();
  if (SmsRetriever && typeof (SmsRetriever as any).startSmsRetriever === 'function') {
    SmsRetrieverAvailable = true;
  } else {
    // SMS Retriever not available - likely needs native rebuild
    // console.log('SMS Retriever not available. Run "npx expo run:android" to rebuild.');
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
  senderName = 'Sri murugan gold house'
}: UseOtpAutoFetchProps) => {
  const smsListenerRef = useRef<any>(null);

  // Extract OTP from message based on your SMS format
  const extractOtpFromMessage = (message: string): string | null => {
    //logger.log('Received SMS message:', message);

    // Multiple patterns to match different OTP formats
    const patterns = [
      // Pattern for "Your OTP for Sri murugan gold house DigitalApp registration is 5799"
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
    const SmsRetriever = getSmsRetriever();

    if (Platform.OS !== 'android' || !SmsRetriever) {
      // SMS Retriever not available - silently skip
      return;
    }

    try {
      // Get the App Hash (Signature) for debugging/setup (optional)
      // You need to add this hash to your SMS message for auto-retrieval to work
      // Format: "<#> Your OTP is 1234 [HASH]"
      if (typeof (SmsRetriever as any).getAppSignature === 'function') {
        try {
          const hash = await (SmsRetriever as any).getAppSignature();
          console.log('App Hash for SMS Retriever:', hash);
        } catch (hashError) {
          // getAppSignature might not be available on all devices
          console.log('Could not get app signature:', hashError);
        }
      }

      // Start SMS listener - this does NOT require READ_SMS permission
      if (typeof (SmsRetriever as any).startSmsRetriever !== 'function') {
        console.log('SMS Retriever not properly linked. Run "npx expo run:android" to rebuild.');
        return;
      }

      const registered = await (SmsRetriever as any).startSmsRetriever();

      if (registered) {
        smsListenerRef.current = (SmsRetriever as any).addSmsListener((event: any) => {
          if (event && event.message) {
            const otp = extractOtpFromMessage(event.message);
            if (otp) {
              onOtpReceived(otp);
              stopSmsListener(); // Stop listening after successful OTP extraction
            }
          } else if (event && event.timeout) {
            // Timeout happens after 5 minutes
          }
        });
      }
    } catch (error) {
      // Silently fail - SMS auto-read is a convenience feature
      console.log('SMS Retriever error (rebuild may be needed):', error);
    }
  };

  // Stop SMS listener
  const stopSmsListener = () => {
    if (smsListenerRef.current) {
      try {
        const SmsRetriever = getSmsRetriever();
        if (Platform.OS === 'android' && SmsRetriever) {
          if (typeof (SmsRetriever as any).removeSmsListener === 'function') {
            (SmsRetriever as any).removeSmsListener();
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