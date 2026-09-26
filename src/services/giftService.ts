import api from './api';
import { logger } from '@/utils/logger';

export interface CustomerGift {
  id: number;
  investment_id: number;
  user_id: number;
  scheme_id: number;
  gift_rule_id: number;
  gift_item_id: number;
  joining_amount: number | string;
  status: 'ELIGIBLE' | 'DELIVERED' | 'CANCELLED';
  handover_date?: string | null;
  delivered_by_empid?: string | null;
  delivered_branch_id?: number | null;
  delivered_branch_name?: string | null;
  proof_photo_url?: string | null;
  handover_notes?: string | null;
  created_at: string;
  gift_name: string;
  gift_code: string;
  gift_description?: string | null;
  gift_image_url?: string | null;
  image_url?: string | null;
  estimated_value?: number | string | null;
  scheme_name?: string | null;
  accountNo?: string | null;
  joiningDate?: string | null;
  total_paid?: number | string | null;
}

export interface GiftRule {
  id: number;
  rule_name: string;
  scheme_id?: number | null;
  scheme_name?: string | null;
  gift_item_id: number;
  gift_name: string;
  gift_code: string;
  image_url?: string | null;
  estimated_value?: number | string | null;
  min_joining_amount: number | string;
  max_joining_amount: number | string;
  valid_from: string;
  valid_to: string;
  is_active: string;
}

export interface GiftItem {
  id: number;
  gift_name: string;
  gift_code: string;
  description?: string | null;
  image_url?: string | null;
  estimated_value?: number | string | null;
  total_stock?: number;
  issued_stock?: number;
  is_active: string;
}

export const GiftService = {
  /**
   * Fetch all gifts allocated to the current customer
   */
  async getMyGifts(userId?: string | number): Promise<CustomerGift[]> {
    try {
      const response = await api.get('/gifts/my-gifts', {
        params: userId ? { userId } : undefined
      });
      if (response.data && response.data.success && Array.isArray(response.data.gifts)) {
        return response.data.gifts;
      }
      return [];
    } catch (error: any) {
      if (userId) {
        try {
          const fallbackRes = await api.get(`/gifts/customer/${userId}`);
          if (fallbackRes.data && fallbackRes.data.success && Array.isArray(fallbackRes.data.gifts)) {
            return fallbackRes.data.gifts;
          }
        } catch (fbErr) {
          logger.error('Error fetching customer gifts fallback:', fbErr);
        }
      }
      logger.error('Error in GiftService.getMyGifts:', error);
      return [];
    }
  },

  /**
   * Fetch active scheme gift slabs/rules
   */
  async getGiftRules(schemeId?: string | number): Promise<GiftRule[]> {
    try {
      const response = await api.get('/gifts/rules', {
        params: {
          isActive: 'Y',
          ...(schemeId ? { schemeId } : {})
        }
      });
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      logger.error('Error in GiftService.getGiftRules:', error);
      return [];
    }
  },

  /**
   * Fetch master gift items catalog
   */
  async getGiftItems(): Promise<GiftItem[]> {
    try {
      const response = await api.get('/gifts/items', {
        params: { isActive: 'Y' }
      });
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      logger.error('Error in GiftService.getGiftItems:', error);
      return [];
    }
  }
};

export default GiftService;
