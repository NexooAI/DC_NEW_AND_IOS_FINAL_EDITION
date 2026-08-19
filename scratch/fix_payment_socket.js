const fs = require('fs');
const babel = require('@babel/parser');

const filePath = 'c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/hooks/usePaymentSocket.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
code = code.replace(/\r\n/g, '\n');

const searchBlock = `      // Check both the top-level status and the payment response status
      const isSuccess = data?.status === "success" ||
        data?.paymentResponse?.status === "CHARGED" ||
        data?.paymentResponse?.txn_detail?.status === "CHARGED";

      const isPending = data?.status === "pending" ||
        data?.paymentResponse?.status === "PENDING" ||
        data?.paymentResponse?.status === "PENDING_VBV" ||
        data?.paymentResponse?.txn_detail?.status === "PENDING" ||
        data?.paymentResponse?.txn_detail?.status === "PENDING_VBV" ||
        data?.paymentResponse?.status?.startsWith("PENDING") ||
        data?.paymentResponse?.txn_detail?.status?.startsWith("PENDING");`;

const replaceBlock = `      // Check both the top-level status and the payment response status using normalized lowercase values
      const rawStatus = String(data?.status || "").toLowerCase();
      const rawPaymentStatus = String(data?.paymentResponse?.status || "").toLowerCase();
      const rawTxnStatus = String(data?.paymentResponse?.txn_detail?.status || "").toLowerCase();

      const isSuccess = rawStatus === "success" || rawStatus === "paid" ||
        rawPaymentStatus === "charged" || rawPaymentStatus === "success" ||
        rawTxnStatus === "charged" || rawTxnStatus === "success";

      const isPending = rawStatus === "pending" || rawStatus === "processing" ||
        rawPaymentStatus.startsWith("pending") || rawPaymentStatus === "processing" ||
        rawTxnStatus.startsWith("pending") || rawTxnStatus === "processing";`;

if (code.includes(searchBlock)) {
  code = code.replace(searchBlock, replaceBlock);
  console.log('✔ Updated socket event handler status checks');
} else {
  console.error('❌ Could not find socket event handler status check block');
  process.exit(1);
}

// Convert line endings back to original format (CRLF)
const finalCode = code.replace(/\n/g, '\r\n');

try {
  babel.parse(finalCode, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });
  fs.writeFileSync(filePath, finalCode, 'utf8');
  console.log('🎉 SUCCESS! Programmatically fixed usePaymentSocket.ts!');
} catch (err) {
  console.error('❌ Syntax Validation Error in usePaymentSocket.ts:', err.message);
  process.exit(1);
}
