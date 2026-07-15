/**
 * Booking Receipt HTML Template
 * Generates HTML content for advance gold bookings
 */

import { theme } from '../../constants/theme';

export interface BookingReceiptData {
    bookingId: string | number;
    goldWeight: number | string;
    ratePerGram: number | string;
    totalAmount: number | string;
    bookingAmount: number | string;
    remainingAmount: number | string;
    status: string;
    expiryDate: string;
    createdAt: string;
    userName?: string;
    userMobile?: string;
    userEmail?: string;
    convertedBillId?: number | string;
}

export const generateBookingReceiptHTML = (data: BookingReceiptData): string => {
    const {
        bookingId,
        goldWeight,
        ratePerGram,
        totalAmount,
        bookingAmount,
        remainingAmount,
        status,
        expiryDate,
        createdAt,
        userName,
        userMobile,
        userEmail,
        convertedBillId
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
        <title>Booking Receipt - Advance Gold Booking</title>
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
            .status-completed { color: green; }
            .status-active { color: #DAA520; }
            .status-expired { color: red; }
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

        <div class="letter-title">ADVANCE GOLD BOOKING RECEIPT</div>

        <p>Dear ${userName || "Customer"},</p>
        <p>We acknowledge your advance booking for gold as per the contract details below:</p>

        <!-- Booking Details -->
        <table class="details-table">
            <tr>
                <th>Booking ID</th>
                <td># ${bookingId}</td>
            </tr>
            <tr>
                <th>Gold Weight</th>
                <td>${Number(goldWeight).toFixed(3)} g</td>
            </tr>
            <tr>
                <th>Locked Gold Rate</th>
                <td>₹${Number(ratePerGram).toLocaleString()}/g</td>
            </tr>
            <tr>
                <th>Contract Value</th>
                <td>₹${Number(totalAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <th>Advance Paid Amount</th>
                <td>₹${Number(bookingAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <th>Remaining Balance Amount</th>
                <td>₹${Number(remainingAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <th>Booking Status</th>
                <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
            </tr>
            <tr>
                <th>Booking Date</th>
                <td>${formattedDate(createdAt)}</td>
            </tr>
            <tr>
                <th>Expiry Date</th>
                <td>${formattedDate(expiryDate)}</td>
            </tr>
            ${convertedBillId ? `<tr><th>Converted to Bill ID</th><td>#${convertedBillId}</td></tr>` : ""}
            ${userMobile ? `<tr><th>Customer Mobile</th><td>${userMobile}</td></tr>` : ""}
            ${userEmail ? `<tr><th>Customer Email</th><td>${userEmail}</td></tr>` : ""}
        </table>

        <p>Thank you for choosing <strong>${theme.constants.customerName}</strong>. This receipt serves as official proof of your advance gold booking contract.</p>

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
