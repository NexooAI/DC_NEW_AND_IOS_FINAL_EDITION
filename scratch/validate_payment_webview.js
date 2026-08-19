const fs = require('fs');
const babel = require('@babel/parser');

const path = 'c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/PaymentWebView.tsx';
let code = fs.readFileSync(path, 'utf8');

try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });
  console.log('SUCCESS! PaymentWebView.tsx is 100% valid JSX syntax!');
} catch (err) {
  console.error('JSX Validation Error in PaymentWebView.tsx:', err.message);
  process.exit(1);
}
