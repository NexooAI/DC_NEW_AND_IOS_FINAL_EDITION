/**
 * Payment Receipt HTML Template
 * Generates HTML content for payment receipts
 */

import { theme } from '../../constants/theme';

export interface PaymentReceiptData {
    transactionId: string;
    paymentId: string;
    amountPaid: number;
    paymentDate: string;
    paymentMode?: string;
    status: string;
    goldRate?: number;
    userName?: string;
    userMobile?: string;
    userEmail?: string;
    rewardAmount?: number;
    rewardGoldGrams?: number;
    inversement?: {
        accountName: string;
        accountNo: string;
        schemeName: string;
        paymentFrequencyName: string;
        joiningDate: string;
        end_date: string;
        paymentStatus: string;
        total_paid: number;
        totalgoldweight: number;
        current_goldrate: number;
    };
}

export const generatePaymentReceiptHTML = (data: PaymentReceiptData): string => {
    const {
        transactionId,
        paymentId,
        amountPaid,
        paymentDate,
        paymentMode,
        status,
        goldRate,
        userName,
        rewardAmount,
        rewardGoldGrams,
        inversement
    } = data;

    return `
   <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt - DigiGold Savings</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            color: #000;
            background: #fff;
            margin: 20px;
            line-height: 1.4;
            font-size: 12px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 10px 15px;
            background: ${theme.colors.primary};
            color: #fff;
        }
        .company-info { font-size: 12px; font-weight: bold; }
        .letter-title {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin: 15px 0;
            text-decoration: underline;
        }
        .details-table {
            width: 100%;
            min-width: 360px;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
            table-layout: fixed;
        }
        .details-table th, .details-table td {
            width: 50%;
            text-align: left;
            padding: 5px 6px;
            border: 1px solid #000;
            word-break: break-word;
        }
        .details-table th {
            background: #eee;
        }
        .details-table .section-heading {
            text-align: center;
            font-weight: bold;
            background: #f4f4f4;
            color: #222;
            padding: 8px 0;
            font-size: 12px;
        }
        .footer {
            margin-top: 20px;
            font-size: 11px;
            border-top: 1px solid #000;
            padding-top: 8px;
        }
        .footer .address {
            text-align: center;
            margin-bottom: 6px;
            line-height: 1.3;
        }
        .footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            font-size: 11px;
        }
        .signature { font-weight: bold; text-align: right; }
        .status-badge { font-weight: bold; text-transform: uppercase; }
        .status-active { color: green; }
        .status-pending { color: orange; }
        .status-failed { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            ${theme.constants.customerName}
        </div>
        <div>
            <img src="https://dcjewellers.org/wp-content/uploads/2025/05/logo_bg_dark.webp" alt="Logo" style="max-width:90px; height:auto;">
        </div>
    </div>

    <div class="letter-title">PAYMENT RECEIPT</div>

    <p>Dear ${userName || "Customer"},</p>
    <p>We acknowledge the receipt of your payment as per the details below:</p>

    <!-- Transaction Details -->
    <table class="details-table">
        <tr>
            <th>Transaction ID</th>
            <td>DCJ-${transactionId}</td>
        </tr>
        <tr>
            <th>Payment ID</th>
            <td>${paymentId}</td>
        </tr>
        <tr>
            <th>Amount Paid</th>
            <td>₹${Number(amountPaid).toLocaleString()}</td>
        </tr>
        <tr>
            <th>Payment Date</th>
            <td>${new Date(paymentDate).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    })}</td>
        </tr>
        <tr>
            <th>Payment Mode</th>
            <td>${(paymentMode || "NB").toUpperCase()}</td>
        </tr>
        ${goldRate ? `<tr><th>Gold Rate</th><td>₹${goldRate}/gram</td></tr>` : ""}
        ${rewardAmount ? `<tr><th>Reward Amount</th><td>₹${Number(rewardAmount).toLocaleString()}</td></tr>` : ""}
        ${rewardGoldGrams ? `<tr><th>Reward Gold</th><td>${Number(rewardGoldGrams).toFixed(4)} grams</td></tr>` : ""}
    </table>

    <!-- Investment Details -->
    ${inversement ? `
    <table class="details-table">
        <tr>
            <td class="section-heading" colspan="2">Investment Details</td>
        </tr>
        <tr><th>Account Name</th><td>${inversement.accountName}</td></tr>
        <tr><th>Account No</th><td>${inversement.accountNo}</td></tr>
        <tr><th>Scheme</th><td>${inversement.schemeName} (${inversement.paymentFrequencyName})</td></tr>
        <tr><th>Joining Date</th><td>${new Date(inversement.joiningDate).toLocaleDateString("en-GB")}</td></tr>
        <tr><th>Payment Status</th><td>${inversement.paymentStatus}</td></tr>
        <tr><th>Maturity Date</th><td>${new Date(inversement.end_date).toLocaleDateString("en-GB")}</td></tr>
        <tr><th>Status</th><td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td></tr>
        <tr><th>Current Gold Rate</th><td>₹${inversement.current_goldrate}/g</td></tr>
    </table>` : ""}

    <p>Thank you for your trust and investment with <strong>${theme.constants.customerName}</strong>. This receipt serves as official proof of payment.</p>

    <!-- Footer -->
    <div class="footer">
        <div class="address">
            <p>${theme.constants.address}</p>
            <p>Mobile: ${theme.constants.mobile} | Email: ${theme.constants.email}</p>
        </div>
        <div class="footer-bottom">
            <p>Date: ${new Date().toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
    })}</p>
            <p class="signature">Authorized Signatory<br/>${theme.constants.customerName}</p>
        </div>
    </div>
</body>
</html>
    `;
};
