import { Socket } from 'socket.io-client';

export interface PaymentInitPayload {
  userId: string | number;
  amount: number;
  investmentId: string | number;
  schemeId: string | number | any;
  userEmail: string;
  userMobile: string;
  userName: string;
  chitId: string | number;
  
}

export interface PaymentResponse {
  success: boolean;
  session: {
    status: string;
    id: string;
    order_id: string;
    payment_links: {
      web: string;
      expiry: string;
    };
    sdk_payload: {
      requestId: string;
      service: string;
      payload: {
        resellerId: string;
        customerName: string;
        clientId: string;
        customerId: string;
        metadata: {
          investment_id: string;
          schemeId: string;
        };
        displayBusinessAs: string;
        orderId: string;
        returnUrl: string;
        currency: string;
        customerEmail: string;
        customerPhone: string;
        service: string;
        environment: string;
        merchantId: string;
        amount: string;
        clientAuthTokenExpiry: string;
        signature: string;
        clientAuthToken: string;
        action: string;
        collectAvsInfo: boolean;
      };
      expiry: string;
    };
    order_expiry: string;
  };
}

export interface PaymentStatusUpdate {
  paymentResponse: {
    txn_id: string;
    amount: number;
    order_id: string;
    txn_detail: {
      status: 'CHARGED' | 'FAILED';
    };
    payment_gateway_response?: {
      resp_message: string;
    };
  };
}

export interface TransactionPayload {
  userId: number;
  investmentId: number;
  schemeId: number;
  chitId: number;
  accountNumber: string;
  paymentId: number;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  signature: string;
  paymentStatus: string;
  paymentDate: string;
  status: string;
  gatewayTransactionId: string;
}

export interface PaymentPayload extends TransactionPayload {
  paymentType: string;
  paymentMode: string;
  paymentGateway: string;
  paymentReference: string;
  paymentDescription: string;
  paymentMetadata: {
    schemeName: string;
    installmentNumber: number;
    totalInstallments: number;
    paymentFrequency: string;
    goldWeight: number;
    currentGoldPrice: number;
  };
}

export interface PaymentDetails {
  amount: number;
  goldWeight: number;
  schemeName: string;
  installmentNumber: number;
  totalInstallments: number;
  investmentType: string;
  maturityDate?: string;
  currentGoldPrice: number;
  paymentFrequency: string;
}

export interface UserDetails {
  name?: string;
  accountname?: string;
  accNo?: string;
  accountNo?: string;
  mobile?: string;
  email?: string;
  userId?: string;
  investmentId?: string;
  schemeId?: string;
  chitId?: string;
  paymentFrequency?: string;
  schemeName?: string;
  isRetryAttempt?: boolean;
  retryData?: {
    paymentData: {
      userId: string;
      investmentId: string;
      schemeId: string;
      chitId: string;
      amount: number;
    };
    investmentData: {
      accountName: string;
      accountNo: string;
    };
  };
  userEmail?: string;
  userMobile?: string;
  data?: {
    data?: {
      userId?: string;
      id?: string;
      schemeId?: string;
      chitId?: string;
    };
  };
}

export interface PaymentRetryData {
  paymentData: {
    amount: number;
    userId: string;
    investmentId: string;
    schemeId: string;
    chitId: string;
  };
  displayData: {
    schemeName: string;
    accountHolder: string;
    accNo: string;
    totalPaid: string;
    monthsPaid: string;
    noOfIns: string;
    goldWeight: string;
    maturityDate: string;
    paymentFrequency: string;
  };
}

export interface PaymentMetadata {
  orderId: string;
  investmentId: number;
  userId: number;
  schemeId: number;
  chitId: number;
  amount: number;
  isManual: string;
  utr_reference_number: string;
  accountNumber: string;
  accountName: string;
}

export type PaymentSocket = Socket; 