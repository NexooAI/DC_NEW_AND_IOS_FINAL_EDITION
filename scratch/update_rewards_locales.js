const fs = require('fs');
const path = require('path');

const localesPath = 'c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/locales';
const languages = ['en', 'ta', 'te', 'mal', 'hi'];

const newKeys = {
  en: {
    "pleaseEnterValidPoints": "Please enter a valid amount of points",
    "pleaseEnterPaymentDetails": "Please enter payment details (UPI / Bank)",
    "purchaseRedeemSuccess": "Purchase discount request submitted. You can redeem this when you purchase jewelry once your investments mature.",
    "cashRedeemSuccess": "Cash payout request submitted. Admin will process it shortly.",
    "purchaseRedemptionHelp": "Points will be converted to a jewelry purchase discount. Redeemable at the store when your investment matures.",
    "cashRedemptionHelp": "Points will be converted to a direct cash payout. Enter your UPI ID or bank account details below.",
    "enterPointsToRedeem": "Points to redeem",
    "enterPaymentDetails": "Enter UPI ID or Bank Account details",
    "confirmRedemption": "Confirm Redemption",
    "rewardDetails": "Reward Details",
    "customerName": "Customer Name",
    "joinedDate": "Joined Date",
    "pointsEarned": "Points Earned",
    "referenceId": "Reference ID",
    "purchaseDiscount": "Purchase\nDiscount",
    "readyCashPayout": "Direct Cash\nPayout"
  },
  ta: {
    "pleaseEnterValidPoints": "தயவுசெய்து சரியான புள்ளிகளை உள்ளிடவும்",
    "pleaseEnterPaymentDetails": "தயவுசெய்து கட்டண விவரங்களை உள்ளிடவும் (UPI / வங்கி)",
    "purchaseRedeemSuccess": "கொள்முதல் தள்ளுபடி கோரிக்கை சமர்ப்பிக்கப்பட்டது. உங்கள் முதலீடு முதிர்ச்சியடைந்ததும் நகைகளை வாங்கும்போது இதை மீட்டெடுக்கலாம்.",
    "cashRedeemSuccess": "பணப் பட்டுவாடா கோரிக்கை சமர்ப்பிக்கப்பட்டது. நிர்வாகி விரைவில் இதைச் செயல்படுத்துவார்.",
    "purchaseRedemptionHelp": "புள்ளிகள் நகை வாங்குவதற்கான தள்ளுபடியாக மாற்றப்படும். உங்கள் முதலீடு முதிர்ச்சியடையும் போது கடையில் மீட்டெடுக்கலாம்.",
    "cashRedemptionHelp": "புள்ளிகள் நேரடியாக பணப் பட்டுவாடாவாக மாற்றப்படும். கீழே உள்ள உங்கள் UPI ஐடி அல்லது வங்கி கணக்கு விவரங்களை உள்ளிடவும்.",
    "enterPointsToRedeem": "மீட்டெடுக்க வேண்டிய புள்ளிகள்",
    "enterPaymentDetails": "UPI ஐடி அல்லது வங்கி கணக்கு விவரங்களை உள்ளிடவும்",
    "confirmRedemption": "மீட்டெடுப்பை உறுதிப்படுத்துக",
    "rewardDetails": "ரிவார்டு விவரங்கள்",
    "customerName": "வாடிக்கையாளர் பெயர்",
    "joinedDate": "இணைந்த தேதி",
    "pointsEarned": "பெற்ற புள்ளிகள்",
    "referenceId": "குறிப்பு ஐடி",
    "purchaseDiscount": "கொள்முதல்\nதள்ளுபடி",
    "readyCashPayout": "நேரடி ரொக்கப்\nபட்டுவாடா"
  },
  hi: {
    "pleaseEnterValidPoints": "कृपया वैध अंक दर्ज करें",
    "pleaseEnterPaymentDetails": "कृपया भुगतान विवरण दर्ज करें (UPI / बैंक)",
    "purchaseRedeemSuccess": "खरीद छूट अनुरोध सबमिट कर दिया गया है। जब आपके निवेश परिपक्व हो जाएंगे, तो आप आभूषण खरीदते समय इसे भुना सकते हैं।",
    "cashRedeemSuccess": "नकद भुगतान अनुरोध सबमिट कर दिया गया है। व्यवस्थापक शीघ्र ही इस पर कार्रवाई करेंगे।",
    "purchaseRedemptionHelp": "अंकों को आभूषण खरीद छूट में बदल दिया जाएगा। आपका निवेश परिपक्व होने पर इसे स्टोर पर भुनाया जा सकता है।",
    "cashRedemptionHelp": "अंकों को सीधे नकद भुगतान में बदल दिया जाएगा। नीचे अपनी UPI आईडी या बैंक खाते का विवरण दर्ज करें।",
    "enterPointsToRedeem": "भुनाने के लिए अंक",
    "enterPaymentDetails": "UPI आईडी या बैंक खाता विवरण दर्ज करें",
    "confirmRedemption": "भुगतान की पुष्टि करें",
    "rewardDetails": "पुरस्कार विवरण",
    "customerName": "ग्राहक का नाम",
    "joinedDate": "शामिल होने की तिथि",
    "pointsEarned": "अर्जित अंक",
    "referenceId": "संदर्भ आईडी",
    "purchaseDiscount": "खरीद\nछूट",
    "readyCashPayout": "सीधा नकद\nभुगतान"
  },
  te: {
    "pleaseEnterValidPoints": "దయచేసి చెల్లుబాటు అయ్యే పాయింట్లను నమోదు చేయండి",
    "pleaseEnterPaymentDetails": "దయచేసి చెల్లింపు వివరాలను నమోదు చేయండి (UPI / బ్యాంక్)",
    "purchaseRedeemSuccess": "కొనుగోలు డిస్కౌంట్ అభ్యర్థన సమర్పించబడింది. మీ పెట్టుబడి మెచ్యూర్ అయిన తర్వాత మీరు నగలు కొనుగోలు చేసేటప్పుడు దీనిని రీడీమ్ చేసుకోవచ్చు.",
    "cashRedeemSuccess": "నగదు చెల్లింపు అభ్యర్థన సమర్పించబడింది. అడ్మిన్ త్వరలోనే దీనిని ప్రాసెస్ చేస్తారు.",
    "purchaseRedemptionHelp": "పాయింట్లు నగల కొనుగోలు డిస్కౌంట్‌గా మార్చబడతాయి. మీ పెట్టుబడి మెచ్యూర్ అయినప్పుడు స్టోర్‌లో రీడీమ్ చేసుకోవచ్చు.",
    "cashRedemptionHelp": "పాయింట్లు నేరుగా నగదు చెల్లింపుగా మార్చబడతాయి. దిగువ మీ UPI ఐడి లేదా బ్యాంక్ ఖాతా వివరాలను నమోదు చేయండి.",
    "enterPointsToRedeem": "రీడీమ్ చేయవలసిన పాయింట్లు",
    "enterPaymentDetails": "UPI ఐడి లేదా బ్యాంక్ ఖాతా వివరాలను నమోదు చేయండి",
    "confirmRedemption": "రీడెంప్షన్‌ను ధృవీకరించండి",
    "rewardDetails": "రివార్డ్ వివరాలు",
    "customerName": "కస్టమర్ పేరు",
    "joinedDate": "చేరిన తేదీ",
    "pointsEarned": "పొందిన పాయింట్లు",
    "referenceId": "రెఫరెన్స్ ఐడి",
    "purchaseDiscount": "కొనుగోలు\nడిస్కౌంట్",
    "readyCashPayout": "ప్రత్యక్ష నగదు\nచెల్లింపు"
  },
  mal: {
    "pleaseEnterValidPoints": "ദയവായി സാധുവായ പോയിന്റുകൾ നൽകുക",
    "pleaseEnterPaymentDetails": "ദയവായി പേയ്‌മെന്റ് വിവരങ്ങൾ നൽകുക (UPI / ബാങ്ക്)",
    "purchaseRedeemSuccess": "പർച്ചേസ് ഡിസ്കൗണ്ട് അഭ്യർത്ഥന സമർപ്പിച്ചു. നിങ്ങളുടെ നിക്ഷേപം പൂർത്തിയാകുമ്പോൾ സ്വർണ്ണം വാങ്ങുമ്പോൾ നിങ്ങൾക്ക് ഇത് ക്ലെയിം ചെയ്യാം.",
    "cashRedeemSuccess": "ക്യാഷ് പേഔട്ട് അഭ്യർത്ഥന സമർപ്പിച്ചു. അഡ്മിൻ ഇത് ഉടൻ തന്നെ പ്രൊസസ്സ് ചെയ്യുന്നതാണ്.",
    "purchaseRedemptionHelp": "പോയിന്റുകൾ ആഭരണം വാങ്ങുന്നതിനുള്ള ഡിസ്കൗണ്ടായി മാറ്റുന്നതാണ്. നിങ്ങളുടെ നിക്ഷേപം പൂർത്തിയാകുമ്പോൾ സ്റ്റോറിൽ നിന്ന് ക്ലെയിം ചെയ്യാം.",
    "cashRedemptionHelp": "പോയിന്റുകൾ നേരിട്ടുള്ള ക്യാഷ് പേഔട്ടായി മാറ്റുന്നതാണ്. നിങ്ങളുടെ UPI ഐഡിയോ ബാങ്ക് അക്കൗണ്ട് വിവരങ്ങളോ താഴെ നൽകുക.",
    "enterPointsToRedeem": "ക്ലെയിം ചെയ്യേണ്ട പോയിന്റുകൾ",
    "enterPaymentDetails": "UPI ഐഡി അല്ലെങ്കിൽ ബാങ്ക് അക്കൗണ്ട് വിവരങ്ങൾ നൽകുക",
    "confirmRedemption": "റെഡംപ്ഷൻ സ്ഥിരീകരിക്കുക",
    "rewardDetails": "റിവാർഡ് വിവരങ്ങൾ",
    "customerName": "ഉപഭോക്താവിന്റെ പേര്",
    "joinedDate": "ചേർന്ന തീയതി",
    "pointsEarned": "നേടിയ പോയിന്റുകൾ",
    "referenceId": "റഫറൻസ് ഐഡി",
    "purchaseDiscount": "പർച്ചേസ്\nഡിസ്കൗണ്ട്",
    "readyCashPayout": "നേരിട്ടുള്ള ക്യാഷ്\nപേഔട്ട്"
  }
};

languages.forEach(lang => {
  const filePath = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let json = JSON.parse(fileContent);

    let keysToAdd = newKeys[lang];
    let count = 0;
    for (const [key, value] of Object.entries(keysToAdd)) {
      json[key] = value;
      count++;
    }

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Successfully merged ${count} keys into ${lang}.json`);
  } else {
    console.error(`File not found: ${filePath}`);
  }
});

console.log('Rewards locale updates finished.');
