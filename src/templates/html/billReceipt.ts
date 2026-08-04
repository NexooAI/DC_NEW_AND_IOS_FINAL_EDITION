/**
 * Bill Receipt HTML Template
 * Generates HTML content for bill payments
 */

import { theme } from '../../constants/theme';

export interface BillReceiptData {
    billId: string | number;
    billNumber: string;
    description: string;
    totalAmount: number | string;
    paidAmount: number | string;
    pendingAmount: number | string;
    status: string;
    billDate: string;
    userName?: string;
    userMobile?: string;
    userEmail?: string;
    logoBase64?: string;
}

export const generateBillReceiptHTML = (data: BillReceiptData): string => {
    const {
        billId,
        billNumber,
        description,
        totalAmount,
        paidAmount,
        pendingAmount,
        status,
        billDate,
        userName,
        userMobile,
        userEmail,
        logoBase64
    } = data;

    const formattedDate = (val: string) => {
        const parsed = new Date(val);
        if (Number.isNaN(parsed.getTime())) return val;
        return parsed.toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        });
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bill Receipt - Kanisaa Jewellers</title>
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
                background-color: ${theme.colors.primary} !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
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
            .status-paid { color: green; }
            .status-partial { color: #DAA520; }
            .status-expired { color: red; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-info">
                ${theme.constants.customerName}
            </div>
            <div>
                <img src="${logoBase64 || 'https://dcjewellers.org/wp-content/uploads/2025/05/logo_bg_dark.webp'}" alt="Logo" style="max-width:90px; height:auto;">
            </div>
        </div>

        <div class="letter-title">BILL PAYMENT RECEIPT</div>

        <p>Dear ${userName || "Customer"},</p>
        <p>We acknowledge your payment receipt details for the following invoice:</p>

        <!-- Bill Details -->
        <table class="details-table">
            <tr>
                <th>Bill Reference ID</th>
                <td># ${billId}</td>
            </tr>
            <tr>
                <th>Bill Number</th>
                <td>${billNumber}</td>
            </tr>
            <tr>
                <th>Description</th>
                <td>${description}</td>
            </tr>
            <tr>
                <th>Total Bill Amount</th>
                <td>₹${Number(totalAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <th>Paid Amount</th>
                <td>₹${Number(paidAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <th>Pending Amount</th>
                <td>₹${Number(pendingAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <th>Payment Status</th>
                <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
            </tr>
            <tr>
                <th>Bill Date</th>
                <td>${formattedDate(billDate)}</td>
            </tr>
            ${userMobile ? `<tr><th>Customer Mobile</th><td>${userMobile}</td></tr>` : ""}
            ${userEmail ? `<tr><th>Customer Email</th><td>${userEmail}</td></tr>` : ""}
        </table>

        <p>Thank you for choosing <strong>${theme.constants.customerName}</strong>. This receipt serves as official proof of payment details.</p>

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
