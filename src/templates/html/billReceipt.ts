/**
 * Bill Receipt HTML Template
 * Generates HTML content for customer bills (Single Page A4 Layout with Brand Logo)
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
                font-size: 10.5px;
            }
            .header {
                margin-bottom: 10px;
                padding: 10px 14px;
                background-color: ${theme.colors.primary} !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color: #fff;
                page-break-inside: avoid;
            }
            .header-flex {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .brand-name {
                font-size: 17px;
                font-weight: bold;
                color: #FFD700;
                letter-spacing: 1px;
                text-transform: uppercase;
                margin-bottom: 1px;
            }
            .brand-tagline {
                font-size: 9.5px;
                color: #ffffff;
                opacity: 0.9;
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-bottom: 2px;
            }
            .company-address {
                font-size: 9.5px;
                color: rgba(255,255,255,0.95);
                line-height: 1.25;
            }
            .letter-title {
                text-align: center;
                font-weight: bold;
                font-size: 13px;
                margin: 8px 0;
                text-decoration: underline;
            }
            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin: 8px 0;
                font-size: 10px;
                table-layout: fixed;
                page-break-inside: avoid;
            }
            .details-table th, .details-table td {
                width: 50%;
                text-align: left;
                padding: 3.5px 6px;
                border: 1px solid #000;
                word-break: break-word;
            }
            .details-table th {
                background: #eee;
            }
            .footer {
                margin-top: 10px;
                font-size: 10px;
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
                font-size: 10px;
            }
            .signature { font-weight: bold; text-align: right; }
            .status-badge { font-weight: bold; text-transform: uppercase; }
            .status-completed { color: green; }
            .status-pending { color: orange; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="header-flex">
                <div style="flex: 0 0 auto;">
                    ${logoBase64 ? `<img src="${logoBase64}" alt="Kanisaa Logo" style="max-height: 52px; width: auto; max-width: 140px; object-fit: contain;" />` : ''}
                </div>
                <div style="flex: 1; text-align: right;">
                    <div class="brand-name">${theme.constants.customerName}</div>
                    <div class="brand-tagline">Gold & Diamonds</div>
                    <div class="company-address">
                        ${theme.constants.address}<br/>
                        <strong>Mobile:</strong> ${theme.constants.mobile} | <strong>Email:</strong> ${theme.constants.email}
                    </div>
                </div>
            </div>
        </div>

        <div class="letter-title">BILL PAYMENT RECEIPT</div>

        <p style="margin: 3px 0;">Dear ${userName || "Customer"},</p>
        <p style="margin: 3px 0;">We acknowledge with thanks the receipt of your bill payment as detailed below:</p>

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

        <p style="margin: 3px 0;">Thank you for your business with <strong>${theme.constants.customerName}</strong>. This receipt serves as official proof of payment.</p>

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
