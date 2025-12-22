import api from './api';

import { logger } from '@/utils/logger';
export interface FAQQuestion {
    id: string;
    question: string;
    answer: string;
    category?: string;
    priority?: number;
    isActive?: boolean;
}

export interface TicketPayload {
    userId: string;
    question: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    userInfo?: {
        name?: string;
        email?: string;
        phone?: string;
    };
}

export interface TicketResponse {
    success: boolean;
    ticketId: string;
    message?: string;
    data?: {
        ticketId: string;
        status: string;
        createdAt: string;
    };
}

class FAQService {
    // Fetch FAQ questions from API
    async getFAQQuestions(): Promise<FAQQuestion[]> {
        try {
            const response = await api.get('/faq/questions');
            return response.data.data || response.data;
        } catch (error) {
            logger.error('Error fetching FAQ questions:', error);
            // Return fallback questions if API fails
            return this.getFallbackQuestions();
        }
    }

    // Create support ticket
    async createTicket(payload: TicketPayload): Promise<TicketResponse> {
        try {
            const response = await api.post('/tickets', payload);
            return response.data;
        } catch (error) {
            logger.error('Error creating ticket:', error);
            throw error;
        }
    }

    // Get ticket status
    async getTicketStatus(ticketId: string): Promise<any> {
        try {
            const response = await api.get(`/tickets/${ticketId}`);
            return response.data;
        } catch (error) {
            logger.error('Error fetching ticket status:', error);
            throw error;
        }
    }

    // Fallback questions if API is not available
    private getFallbackQuestions(): FAQQuestion[] {
        return [
            {
                id: "1",
                question: "How to reset my password?",
                answer: "To reset your password, go to the Profile tab, tap on 'Change Password', enter your current password, then set your new password. Make sure to use a strong password with at least 8 characters.",
                category: "Account",
                priority: 1,
                isActive: true,
            },
            {
                id: "2",
                question: "How to update my profile?",
                answer: "You can update your profile by going to the Profile tab and tapping on 'Edit Profile'. You can change your name, email, phone number, and profile picture.",
                category: "Account",
                priority: 1,
                isActive: true,
            },
            {
                id: "3",
                question: "How to check my savings balance?",
                answer: "Your savings balance is displayed on the home screen. You can also go to the Savings tab to see detailed information about your savings schemes and transactions.",
                category: "Savings",
                priority: 1,
                isActive: true,
            },
            {
                id: "4",
                question: "How to make a payment?",
                answer: "To make a payment, go to the home screen and tap on 'Make Payment'. Select your payment method, enter the amount, and follow the on-screen instructions.",
                category: "Payment",
                priority: 1,
                isActive: true,
            },
            {
                id: "5",
                question: "How to contact customer support?",
                answer: "You can contact our customer support by calling +91-1234567890 or emailing dcjewellerstcr@gmail.com. Our support team is available 24/7 to help you.",
                category: "Support",
                priority: 1,
                isActive: true,
            },
            {
                id: "6",
                question: "How to track my transactions?",
                answer: "All your transactions are visible in the Transactions tab. You can filter by date, type, or amount to find specific transactions.",
                category: "Transactions",
                priority: 1,
                isActive: true,
            },
        ];
    }
}

export default new FAQService();
