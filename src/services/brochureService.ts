import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Alert } from 'react-native';
import api, { ticketsAPI } from './api';
import { ParsedSchemeV2 } from '@/components/schemesV2/types';
import { themeConfig } from '@/constants/theme.config';
import { logger } from '@/utils/logger';
import useGlobalStore from '@/store/global.store';

export interface BrochureRequestResult {
  success: boolean;
  uri?: string;
  source: 'api' | 'ticket_created';
  ticketId?: string | number;
  error?: string;
}

/**
 * Downloads an official remote scheme brochure PDF if available in the backend/API.
 * If no document exists in the backend, it automatically creates a support/inquiry ticket
 * with the customer's phone number and notifies the user that the brochure will be shared via WhatsApp.
 */
export async function downloadAndShareSchemeBrochure(
  scheme: ParsedSchemeV2,
  language: string = 'en'
): Promise<BrochureRequestResult> {
  const isTa = language === 'ta';
  const jewellerName = themeConfig?.customerName || '';

  try {
    // 1. Check if backend API or scheme object has an uploaded brochure PDF
    let remoteBrochureUrl =
      scheme.brochureUrl ||
      scheme.rawScheme?.brochure_url ||
      scheme.rawScheme?.brochureUrl ||
      scheme.rawScheme?.pdf_url ||
      scheme.rawScheme?.brochure;

    if (!remoteBrochureUrl && scheme.id) {
      try {
        const response = await api.get(`/schemes/${scheme.id}/brochure`, { timeout: 3000 });
        if (response?.data?.brochureUrl || response?.data?.data?.brochureUrl) {
          remoteBrochureUrl = response?.data?.brochureUrl || response?.data?.data?.brochureUrl;
        }
      } catch (apiErr) {
        // Backend endpoint might not exist yet; gracefully fallback
        logger.info('Brochure endpoint check completed (no remote PDF URL found).');
      }
    }

    // 2. If remote brochure PDF URL is valid, download and share it
    if (remoteBrochureUrl && typeof remoteBrochureUrl === 'string' && remoteBrochureUrl.startsWith('http')) {
      const cleanSchemeName = (scheme.name || 'Scheme').replace(/[^a-zA-Z0-9_-]/g, '_');
      const prefix = jewellerName ? `${jewellerName.replace(/[^a-zA-Z0-9_-]/g, '_')}_` : '';
      const fileName = `${prefix}${cleanSchemeName}_Brochure.pdf`;
      const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
      const targetUri = `${targetDir}${fileName}`;

      const downloadRes = await FileSystem.downloadAsync(remoteBrochureUrl, targetUri);
      if (downloadRes.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(targetUri, {
            UTI: 'com.adobe.pdf',
            mimeType: 'application/pdf',
            dialogTitle: `${jewellerName ? `${jewellerName} - ` : ''}${scheme.name} Brochure`,
          });
        } else {
          if (Platform.OS === 'ios') {
            await WebBrowser.openBrowserAsync(targetUri);
          } else {
            Alert.alert(
              isTa ? 'விவரக்குறிப்பு சேமிக்கப்பட்டது' : 'Brochure Saved',
              isTa
                ? `விவரக்குறிப்பு பதிவிறக்கம் செய்யப்பட்டது:\n${fileName}`
                : `Your brochure has been downloaded successfully:\n${fileName}`
            );
          }
        }

        return {
          success: true,
          uri: targetUri,
          source: 'api',
        };
      }
    }

    // 3. If NO document exists in the backend:
    // Generate a support inquiry ticket with customer number and confirm delivery via WhatsApp
    const user = useGlobalStore.getState().user;
    const userMobile = user?.mobile || user?.phone || user?.enternumber || '';
    const userName = user?.name || user?.accountname || 'Customer';
    const userEmail = user?.email || '';

    let ticketId: any = null;
    try {
      const ticketRes = await ticketsAPI.createTicket({
        name: userName,
        phone: String(userMobile),
        email: userEmail,
        subject: 'Scheme Inquiry',
        message: `Brochure Request: Customer requested the official brochure for "${scheme.name}" (Scheme ID: ${scheme.id}). Please share via WhatsApp/Call to +91 ${userMobile}.`,
        referenceType: 'scheme',
        referenceId: scheme.id,
      });
      ticketId = ticketRes?.data?.ticketId || ticketRes?.data?.id || ticketRes?.data?.ticketNumber;
      logger.log('Brochure request ticket generated successfully:', ticketId);
    } catch (ticketErr) {
      logger.warn('Error recording brochure ticket via API (proceeding with user confirmation):', ticketErr);
    }

    const contactDisplay = userMobile ? `+91 ${userMobile}` : (isTa ? 'உங்கள் வாட்ஸ்அப்' : 'your registered');

    Alert.alert(
      isTa ? 'விவரக்குறிப்பு கோரிக்கை பதிவு செய்யப்பட்டது' : 'Brochure Requested!',
      isTa
        ? `"${scheme.name}" திட்டத்திற்கான விவரக்குறிப்பு கோரிக்கை பெறப்பட்டது.\n\nஎங்கள் நிர்வாகக் குழு விரைவில் ${contactDisplay} எண்ணிற்கு வாட்ஸ்அப்பில் விவரக்குறிப்பை அனுப்பி வைக்கும்.`
        : `Your request for the "${scheme.name}" brochure has been received.\n\nOur support team will share the brochure with ${contactDisplay} via WhatsApp shortly.`,
      [{ text: isTa ? 'சரி' : 'OK' }]
    );

    return {
      success: true,
      source: 'ticket_created',
      ticketId,
    };
  } catch (err: any) {
    logger.error('Error handling scheme brochure request:', err);
    Alert.alert(
      isTa ? 'பிழை' : 'Notice',
      isTa
        ? 'தற்போது கோரிக்கையை பதிவு செய்ய இயலவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
        : 'Unable to process brochure request at this moment. Please try again.'
    );
    return {
      success: false,
      error: err?.message || 'Request failed',
      source: 'ticket_created',
    };
  }
}
