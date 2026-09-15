/**
 * Bill Receipt HTML Template
 * Generates HTML content for customer bills (Single Page A4 Layout)
 */

import { theme } from '../../constants/theme';

export interface BillReceiptData {
    billId: string | number;
    billNumber: string;
    description?: string;
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
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
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
            @page {
                size: A4 portrait;
                margin: 6mm 8mm;
            }
            html, body {
                margin: 0;
                padding: 0;
                font-family: 'Times New Roman', serif;
                color: #000;
                background: #fff;
                line-height: 1.3;
                font-size: 11px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding: 8px 12px;
                background-color: ${theme.colors.primary} !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color: #fff;
                page-break-inside: avoid;
            }
            .letter-title {
                text-align: center;
                font-weight: bold;
                font-size: 13px;
                margin: 10px 0;
                text-decoration: underline;
            }
            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                font-size: 10.5px;
                table-layout: fixed;
                page-break-inside: avoid;
            }
            .details-table th, .details-table td {
                width: 50%;
                text-align: left;
                padding: 4px 6px;
                border: 1px solid #000;
                word-break: break-word;
            }
            .details-table th {
                background: #eee;
            }
            .footer {
                margin-top: 12px;
                font-size: 10.5px;
                border-top: 1px solid #000;
                padding-top: 6px;
                page-break-inside: avoid;
            }
            .footer .address {
                text-align: center;
                margin-bottom: 4px;
                line-height: 1.2;
            }
            .footer-bottom {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                font-size: 10.5px;
            }
            .signature { font-weight: bold; text-align: right; }
            .status-badge { font-weight: bold; text-transform: uppercase; }
            .status-completed { color: green; }
            .status-pending { color: orange; }
        </style>
    </head>
    <body>
        <div class="header" style="justify-content: center; text-align: center;">
            <div class="logo-container">
                ${logoBase64
            ? `<img src="${logoBase64}" alt="Kanisaa Logo" style="max-height: 50px; width: auto;" />`
            : `<div class="brand-name" style="font-size: 18px; font-weight: bold; color: #FFD700; letter-spacing: 1px;">${theme.constants.customerName}</div>
                       <div class="brand-tagline" style="font-size: 10px; color: #fff; letter-spacing: 2px;">GOLD & DIAMONDS</div>`
        }
            </div>
            <div class="company-address" style="font-size: 10px; opacity: 0.9; margin-top: 3px;">
                ${theme.constants.address}<br/>
                <strong>Mobile:</strong> ${theme.constants.mobile} | <strong>Email:</strong> ${theme.constants.email}
            </div>
        </div>

        <div class="letter-title">BILL PAYMENT RECEIPT</div>

        <p style="margin: 4px 0;">Dear ${userName || "Customer"},</p>
        <p style="margin: 4px 0;">We acknowledge with thanks the receipt of your bill payment as detailed below:</p>

        <!-- Bill Details -->
        <table class="details-table">
            <tr>
                <th>Bill Number</th>
                <td># ${billNumber}</td>
            </tr>
            ${description ? `<tr><th>Description</th><td>${description}</td></tr>` : ""}
            <tr>
                <th>Total Amount</th>
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

        <p style="margin: 4px 0;">Thank you for your business with <strong>${theme.constants.customerName}</strong>. This receipt serves as official proof of payment.</p>

        <!-- Footer -->
        <div class="footer">
            <div class="address">
                <p style="margin: 2px 0;">${theme.constants.address}</p>
                <p style="margin: 2px 0;">Mobile: ${theme.constants.mobile} | Email: ${theme.constants.email}</p>
            </div>
            <div class="footer-bottom">
                <p style="margin: 2px 0;">Date: ${new Date().toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        })}</p>
                <p class="signature" style="margin: 2px 0;">Authorized Signatory<br/>${theme.constants.customerName}</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
