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
    paymentModeType?: string;
    orderId?: string;
    utrReference?: string;
    status?: string;
    goldRate?: number;
    goldWeight?: number;
    userName?: string;
    userMobile?: string;
    userEmail?: string;
    rewardAmount?: number;
    rewardGoldGrams?: number;
    maturityDate?: string;
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
    logoBase64?: string;
}

export const generatePaymentReceiptHTML = (data: PaymentReceiptData): string => {
    const {
        transactionId,
        paymentId,
        amountPaid,
        paymentDate,
        paymentMode,
        paymentModeType,
        status,
        goldRate,
        goldWeight,
        userName,
        userMobile,
        userEmail,
        rewardAmount,
        rewardGoldGrams,
        inversement,
        logoBase64
    } = data;

    const statusText = status || "Success";

    // Get weight directly or fall back to 0
    let weight = Number(goldWeight || 0);

    // Get gold rate directly
    let rate = Number(goldRate || (inversement ? inversement.current_goldrate : 0));

    // Fallbacks if one is missing but the other exists
    if (rate === 0 && weight > 0 && amountPaid > 0) {
        rate = Math.round(amountPaid / weight);
    } else if (weight === 0 && rate > 0 && amountPaid > 0) {
        weight = Number((amountPaid / rate).toFixed(3));
    }

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
    <title>Payment Receipt - Kanisaa Jewellery</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1a1a2e;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.5;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
            border: 2px solid #a3203a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #7A143C 0%, #a3203a 50%, #5B0E2D 100%);
            color: #ffffff;
            padding: 20px;
            text-align: center;
            border-bottom: 3px solid #D4AF37;
        }
        .logo-container {
            margin-bottom: 10px;
        }
        .brand-name {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: #FFD700;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .brand-tagline {
            font-size: 11px;
            letter-spacing: 2px;
            color: #ffffff;
            opacity: 0.9;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .company-address {
            font-size: 11px;
            color: rgba(255,255,255,0.9);
            line-height: 1.4;
            max-width: 480px;
            margin: 0 auto;
        }
        .receipt-body {
            padding: 20px 24px;
        }
        .title-badge {
            text-align: center;
            margin-bottom: 20px;
        }
        .receipt-title {
            display: inline-block;
            background: #FAF5E8;
            color: #a3203a;
            border: 1px solid #D4AF37;
            padding: 6px 20px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .greeting {
            font-size: 13px;
            color: #333;
            margin-bottom: 15px;
        }
        .table-section-heading {
            font-size: 12px;
            font-weight: bold;
            color: #a3203a;
            background-color: #F8F9FA;
            padding: 8px 12px;
            border-left: 4px solid #D4AF37;
            margin-top: 15px;
            margin-bottom: 8px;
            border-radius: 4px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        .details-table th, .details-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #EAEAEA;
            font-size: 11.5px;
            text-align: left;
        }
        .details-table th {
            width: 42%;
            color: #555;
            font-weight: 600;
            background-color: #FAFAFA;
        }
        .details-table td {
            color: #111;
            font-weight: 500;
            word-break: break-word;
        }
        .highlight-amount {
            font-size: 15px;
            font-weight: bold;
            color: #a3203a;
        }
        .gold-badge {
            display: inline-block;
            background-color: #FFF9E6;
            color: #B8860B;
            border: 1px solid #FFE082;
            padding: 2px 8px;
            border-radius: 10px;
            font-weight: bold;
        }
        .footer {
            background-color: #FDFBF7;
            border-top: 1px dashed #D4AF37;
            padding: 16px 24px;
            font-size: 11px;
            color: #555;
        }
        .footer-thankyou {
            text-align: center;
            font-size: 12px;
            color: #333;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        .footer-flex {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 12px;
        }
        .signature-box {
            text-align: right;
        }
        .signature-title {
            font-weight: bold;
            color: #a3203a;
            margin-top: 25px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Brand Header -->
        <div class="header">
            <div class="logo-container">
                ${logoBase64
            ? `<img src="${logoBase64}" alt="Kanisaa Logo" style="max-height: 60px; width: auto;" />`
            : `<div class="brand-name">${theme.constants.customerName}</div>
                       <div class="brand-tagline">Gold & Diamonds</div>`
        }
            </div>
            <div class="company-address">
                ${theme.constants.address}<br/>
                <strong>Mobile:</strong> ${theme.constants.mobile} | <strong>Email:</strong> ${theme.constants.email}
            </div>
        </div>

        <div class="receipt-body">
            <!-- Title -->
            <div class="title-badge">
                <span class="receipt-title">Official Payment Receipt</span>
            </div>

            <!-- Greeting -->
            <div class="greeting">
                Dear <strong>${userName || "Valued Customer"}</strong>,
                <br/>
                We acknowledge with thanks the receipt of your payment as detailed below:
            </div>

            <!-- Transaction Details Table -->
            <div class="table-section-heading">Payment & Transaction Summary</div>
            <table class="details-table">
                <tr>
                    <th>Transaction ID</th>
                    <td><strong>${transactionId}</strong></td>
                </tr>
                ${data.orderId ? `<tr><th>Order ID</th><td>${data.orderId}</td></tr>` : ""}
                <tr>
                    <th>Payment Reference ID</th>
                    <td>${paymentId}</td>
                </tr>
                <tr>
                    <th>Amount Paid</th>
                    <td><span class="highlight-amount">₹${Number(amountPaid).toLocaleString('en-IN')}</span></td>
                </tr>
                <tr>
                    <th>Payment Date & Time</th>
                    <td>${formattedDate(paymentDate)}</td>
                </tr>
                <tr>
                    <th>Payment Method</th>
                    <td>${(paymentMode || "UPI / NetBanking").toUpperCase()}${paymentModeType ? ` (${paymentModeType.toUpperCase()})` : ""}</td>
                </tr>
                ${data.utrReference ? `<tr><th>Bank UTR Ref No</th><td>${data.utrReference}</td></tr>` : ""}
                ${userMobile ? `<tr><th>Registered Mobile</th><td>${userMobile}</td></tr>` : ""}
                ${userEmail ? `<tr><th>Registered Email</th><td>${userEmail}</td></tr>` : ""}
                ${rewardAmount ? `<tr><th>Reward Amount Credited</th><td>₹${Number(rewardAmount).toLocaleString('en-IN')}</td></tr>` : ""}
                ${rewardGoldGrams ? `<tr><th>Reward Gold Weight</th><td><span class="gold-badge">+${Number(rewardGoldGrams).toFixed(3)} grams</span></td></tr>` : ""}
            </table>

            <!-- Investment Details Table -->
            ${inversement ? `
            <div class="table-section-heading">Savings Scheme & Account Details</div>
            <table class="details-table">
                <tr><th>Account Holder Name</th><td>${inversement.accountName}</td></tr>
                <tr><th>Account Number</th><td><strong>${inversement.accountNo}</strong></td></tr>
                <tr><th>Savings Scheme</th><td>${inversement.schemeName}</td></tr>
                <tr><th>Payment Frequency</th><td>${inversement.paymentFrequencyName || "Monthly"}</td></tr>
                <tr><th>Joining Date</th><td>${formattedDate(inversement.joiningDate)}</td></tr>
                <tr><th>Payment Status</th><td><span style="color: #2e7d32; font-weight: bold;">${(inversement.paymentStatus && inversement.paymentStatus.toLowerCase() === 'charged') ? 'Paid' : (inversement.paymentStatus || 'Paid')}</span></td></tr>
                <tr><th>Maturity Date</th><td>${data.maturityDate || (inversement.end_date ? formattedDate(inversement.end_date) : 'N/A')}</td></tr>
                ${rate > 0 ? `<tr><th>Live Gold Rate</th><td>₹${rate.toLocaleString('en-IN')}/gram</td></tr>` : ""}
                ${weight > 0 ? `<tr><th>Gold Weight Credited</th><td><span class="gold-badge">${weight.toFixed(3)} grams</span></td></tr>` : ""}
            </table>` : ""}
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-thankyou">
                Thank you for choosing <strong>${theme.constants.customerName}</strong> for your gold savings journey.
                <br/>
                This receipt serves as official electronic proof of your transaction.
            </div>
            <div class="footer-flex">
                <div>
                    <strong>Issued On:</strong> ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}<br/>
                    <strong>Website:</strong> ${theme.constants.website}
                </div>
                <div class="signature-box">
                    <div class="signature-title">For ${theme.constants.customerName}</div>
                    <div style="font-size: 10px; color: #888; margin-top: 4px;">(Authorized Signatory)</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

