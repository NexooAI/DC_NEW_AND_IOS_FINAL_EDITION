const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const files = ['en.json', 'ta.json', 'hi.json', 'te.json', 'mal.json'];

// These are all translation keys used in rewards.tsx and rewards_history.tsx
const requiredKeys = [
  "rewardPoints",
  "conversionText",
  "stepsToRedeem",
  "chooseHowToRedeem",
  "chooseHowToRedeemDesc",
  "submitYourRequest",
  "submitYourRequestDesc",
  "visitStoreRedeem",
  "visitStoreRedeemDesc",
  "redeemPoints",
  "rewardHistory",
  "investFirst",
  "noInvestmentDesc",
  "clickToJoinScheme",
  "close",
  "pointsAvailable",
  "pleaseEnterValidPoints",
  "pleaseEnterPaymentDetails",
  "purchaseRedeemSuccess",
  "cashRedeemSuccess",
  "purchaseRedemptionHelp",
  "cashRedemptionHelp",
  "enterPointsToRedeem",
  "enterPaymentDetails",
  "confirmRedemption",
  "rewardDetails",
  "customerName",
  "mobileNumberLabel",
  "joinedDate",
  "pointsEarned",
  "referenceId",
  "noTransactions",
  "purchaseDiscount",
  "readyCashPayout"
];

console.log("Checking translation keys in locales folder...\n");

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`[ERROR] File not found: ${file}`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const missing = [];
    requiredKeys.forEach(key => {
      if (!data[key]) {
        missing.push(key);
      }
    });

    console.log(`${file}:`);
    console.log(`  Total keys: ${Object.keys(data).length}`);
    console.log(`  Missing keys: ${missing.length}`);
    if (missing.length > 0) {
      console.log(`  Missing details: ${JSON.stringify(missing, null, 2)}`);
    }
    console.log("-----------------------------------------");
  } catch (err) {
    console.error(`[ERROR] Parsing ${file}:`, err.message);
  }
});
