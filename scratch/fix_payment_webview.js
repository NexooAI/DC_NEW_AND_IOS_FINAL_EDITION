const fs = require('fs');
const babel = require('@babel/parser');

const filePath = 'c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/PaymentWebView.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
code = code.replace(/\r\n/g, '\n');

// 1. Update startStatusPolling to check normalized status values (success, charged, paid, failed, cancelled, expired, failure)
const pollingSearch = `        if (data?.success) {
          const status = data.status;
          
          if (status === "Success" || status === "success") {
            console.log("[Polling Fallback] Payment succeeded. Stopping poll and routing to success.");
            stopStatusPolling();
            
            if (!isTransitioningRef.current) {
              isTransitioningRef.current = true;
              disconnect();
              router.replace(successTarget);
            }
          } else if (status === "failed" || status === "cancelled" || status === "Expired") {
            console.log("[Polling Fallback] Payment unsuccessful. Stopping poll and routing to failure.");
            stopStatusPolling();
            
            if (!isTransitioningRef.current) {
              isTransitioningRef.current = true;
              disconnect();
              router.replace(failureTarget);
            }
          }
        }`;

const pollingReplace = `        if (data?.success) {
          const status = String(data.status || "").toLowerCase();
          
          if (status === "success" || status === "charged" || status === "paid") {
            console.log("[Polling Fallback] Payment succeeded. Stopping poll and routing to success.");
            stopStatusPolling();
            
            if (!isTransitioningRef.current) {
              isTransitioningRef.current = true;
              disconnect();
              router.replace(successTarget);
            }
          } else if (status === "failed" || status === "cancelled" || status === "expired" || status === "failure") {
            console.log("[Polling Fallback] Payment unsuccessful. Stopping poll and routing to failure.");
            stopStatusPolling();
            
            if (!isTransitioningRef.current) {
              isTransitioningRef.current = true;
              disconnect();
              router.replace(failureTarget);
            }
          }
        }`;

if (code.includes(pollingSearch)) {
  code = code.replace(pollingSearch, pollingReplace);
  console.log('✔ Updated polling status logic with normalized lowercase values');
} else {
  console.error('❌ Could not find startStatusPolling logic');
  process.exit(1);
}

// 2. Update onNavigationStateChange to check for explicit success URL before loading status polling
const navSearch = `                  const currentUrl = navState.url.toLowerCase();
                  
                  // Check for explicit cancel/failed status in the URL first
                  const isExplicitCancel = currentUrl.includes("status=cancelled") || currentUrl.includes("/cancel");
                  const isExplicitFailure = currentUrl.includes("status=failed") || currentUrl.includes("status=failure") || currentUrl.includes("/failed") || currentUrl.includes("/error");
                  
                  if (isExplicitCancel || isExplicitFailure) {`;

const navReplace = `                  const currentUrl = navState.url.toLowerCase();
                  
                  // Check for explicit success status in the URL first (failsafe for socket / polling latency)
                  const isExplicitSuccess = currentUrl.includes("status=success") || currentUrl.includes("payment=success") || currentUrl.includes("/success");
                  const isExplicitCancel = currentUrl.includes("status=cancelled") || currentUrl.includes("/cancel");
                  const isExplicitFailure = currentUrl.includes("status=failed") || currentUrl.includes("status=failure") || currentUrl.includes("/failed") || currentUrl.includes("/error");
                  
                  if (isExplicitSuccess) {
                    console.log("[DEBUG Payment Flow] WebView reached explicit success page. Routing to success screen...");
                    stopStatusPolling();
                    disconnect();
                    
                    if (!isTransitioningRef.current) {
                      isTransitioningRef.current = true;
                      const userDetails = safeParseJSON(params.userDetails);
                      router.replace({
                        pathname: "/(tabs)/home/payment-success",
                        params: {
                          txnId: "",
                          orderId: params.orderId as string || "",
                          amount: params.amount as string || amount || "",
                          investmentId: userDetails?.investmentId || "",
                          schemeType: userDetails?.schemeType || "",
                          paymentFrequency: userDetails?.paymentFrequency || "",
                          schemeName: schemeName,
                          goldRate: goldRate,
                          joiningDate: joiningDate || userDetails?.joiningDate || "",
                          maturityDate: maturityDate || userDetails?.maturityDate || "",
                          type: type,
                          userId: params.userId as string || user?.id || "",
                        },
                      });
                    }
                    return;
                  }
                  
                  if (isExplicitCancel || isExplicitFailure) {`;

if (code.includes(navSearch)) {
  code = code.replace(navSearch, navReplace);
  console.log('✔ Updated WebView navigation state change with explicit success checks');
} else {
  console.error('❌ Could not find WebView navigation logic');
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
  console.log('🎉 SUCCESS! Programmatically fixed PaymentWebView.tsx!');
} catch (err) {
  console.error('❌ JSX Validation Error in PaymentWebView.tsx:', err.message);
  process.exit(1);
}
