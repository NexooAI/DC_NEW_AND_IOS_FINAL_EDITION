# 🚀 Google Play Store Release & Build Guide
## Kanisaa Jewellery (கனிசா ஜூவல்லரி - Thrissur)

---

## 🟢 1. Pre-Build Health & Verification Status

| Check | Command | Status | Result |
| :--- | :--- | :--- | :--- |
| **Expo Doctor** | `npx expo-doctor` | 🟢 PASSED | **18/18 checks passed (0 issues)** |
| **TypeScript Check** | `npx tsc --noEmit --skipLibCheck` | 🟢 PASSED | **0 type errors (Code 0)** |
| **App Version** | In `theme.config.js` | 🟢 READY | **Version `1.0.0`** |
| **Version Code** | In `theme.config.js` | 🟢 READY | **`versionCode: 1`** |
| **Package Name** | In `app.config.ts` | 🟢 READY | **`com.nexooai.kanisaajewellerydigigoldsavings`** |
| **EAS Slug** | In `app.config.ts` | 🟢 READY | **`kanisaajewellerydigigold`** |
| **EAS Project ID** | In `app.config.ts` | 🟢 READY | **`aeef6800-eac4-4ba3-b14d-a09d7342f537`** |
| **EAS Owner** | In `app.config.ts` | 🟢 READY | **`mnvgroups07`** |
| **Google Services** | `google-services.json` | 🟢 READY | Validated with `com.nexooai.kanisaajewellerydigigoldsavings` client |

---

## 💻 2. EAS Build Commands (பில்ட் எடுக்கும் கமாண்டுகள்)

### A. Google Play Store Release Build (AAB Format - Recommended)
கூகுள் ப்ளே ஸ்டோரில் அப்லோட் செய்வதற்கு தேவையான **Android App Bundle (.aab)** பைலை உருவாக்க இந்த கமாண்டை ரன் செய்யவும்:

```powershell
eas build --platform android --profile production
```
> [!NOTE]
> இந்த கமாண்ட் EAS Cloud-ல் பில்டை இயக்கி, நிறைவடைந்ததும் கூகுள் ப்ளே கன்சோலில் அப்லோட் செய்யக்கூடிய `.aab` பைலுக்கான டவுன்லோடு லிங்க் தரும்.

---

### B. Direct Test APK Build (மொபைலில் இன்ஸ்டால் செய்து பார்க்க)
ப்ளே ஸ்டோருக்கு அனுப்பும் முன் உங்கள் மொபைலில் நேரடியாக இன்ஸ்டால் செய்து பார்க்க:

```powershell
eas build --platform android --profile preview
```

---

## 🎨 3. Play Store Graphic Assets

அனைத்து கிராஃபிக் பைல்களும் `playstore_assets/` மற்றும் `assets/playstore/` ஃபோல்டரில் சரியான அளவுகளில் உள்ளன:

### Files Directory: `assets/playstore/` & `playstore_assets/`
1. **App Icon:** `app_icon.png` / `app_icon_512.png` (`512 x 512 px`, PNG 32-bit, < 1MB)
2. **Feature Graphic Banner:** `feature_graphic.png` (`1024 x 500 px`, RGB, No transparency)
3. **Screenshots:**
   - `screenshot_1_welcome.png`
   - `screenshot_2_dashboard.png`
   - `screenshot_3_schemes.png`

---

## 📝 4. Google Play Console Listing Content (Copy & Paste)

### 📌 App Title (பெயர்)
```text
Kanisaa Jewellery Digi Gold
```
*(27 / 30 எழுத்துக்கள்)*

---

### 📌 Short Description (குறு விபரம்)
```text
Save in Digital Gold, pay scheme installments, and book gold advance securely.
```
*(79 / 80 எழுத்துக்கள்)*

---

### 📌 Full Description (முழு விபரம்)
```text
Secure your future with gold! The Kanisaa Jewellery Digital Gold Savings app is your premium companion for smart, flexible, and transparent gold accumulation. Brought to you by Kanisaa Jewellery, Thrissur, Kerala, this app enables you to save, track, and build your gold savings from the comfort of your home.

Key Features:

✨ Digital Gold Savings Schemes
Start accumulating pure gold in small fractions or monthly installments. Choose the plan that fits your financial goals:
• Save Gold: Save in terms of gold weight (grams).
• Save as Money: Save in terms of monetary value.

🔒 Gold Advance Booking
Plan for your wedding or special occasions by booking gold in advance. Lock in gold prices to shield yourself from market fluctuations and redeem at the best rate.

💳 Quick & Secure Online Payments
Pay your monthly scheme installments instantly. The app supports secure, seamless integrations with:
• UPI (Google Pay, PhonePe, Paytm, BHIM)
• Credit and Debit Cards (Visa, Mastercard, RuPay)
• Netbanking and Secure Bank Gateways

📈 Real-Time Gold Rate & Weight Tracker
Keep track of daily live gold rates. Monitor your accumulated gold weight, payment history, and scheme status with absolute transparency.

🎁 Lucky Draw & Rewards
Participate in exciting customer lucky draws, earn rewards, and track your contest tickets directly in the app.

🔄 Old Gold Exchange Setup
Easily register or inquire about exchanging your old gold jewellery for new schemes and stunning designs at Kanisaa Jewellery.

🛡️ Industry-Standard Security
Your account is fully protected. Securely login using your personalized MPIN or Biometrics (Face ID/Touch ID).

📞 24/7 Customer Support
Need assistance? Raise support tickets or contact us directly via WhatsApp/Call in just a tap.

Download the Kanisaa Jewellery app today and start your journey towards smart gold savings!

Showroom Address & Customer Support:
Kanisaa Jewellery,
Road Fathima Nagar, Mission Quarters, Anchery, Thrissur, Kerala 680005.
Phone / WhatsApp: +91 90618 03999
Email: dcjewellerstcr@gmail.com
Website: https://www.dcjewellers.org
```

---

### 📌 Store Categorization & Setup Details
* **Application Category:** Shopping / Finance
* **Tags:** Jewellery, Gold Scheme, DigiGold, Savings, Gold Rate, Thrissur
* **Content Rating:** Everyone (3+)
* **Target Audience:** Age 18 and above
* **App Access:** All functionality is available without special access (Login via Mobile OTP)
* **Privacy Policy URL:** `https://api.prod.kanisaajewellery.com/policies/#privacy`

---

## 📢 5. Google Play Console Release Notes (பதிப்பு குறிப்புகள்)

### 🇺🇸 English (`en-IN` / `en-US` - Default)
```text
Welcome to Kanisaa Jewellery Digi Gold!

What's New in Version 1.0.0:
• Live Gold & Silver Rates: Real-time 22K & 24K market rate updates.
• Monthly Gold Savings Schemes: Flexible chit schemes with special bonus benefits.
• Digital Gold Passbook: Track your accumulated gold weight and payments.
• Gold Advance Booking: Lock in gold prices for future purchases.
• Instant & Secure Payments: Pay installments via UPI, GPay, PhonePe & Cards.
• Showroom Redemption: Redeem gold weight easily at our Thrissur showroom.
```

---

### 🇮🇳 Tamil (`ta-IN`)
```text
கனிசா ஜூவல்லரி டிஜிட்டல் கோல்ட் ஆப்பிற்கு உங்களை அன்போடு வரவேற்கிறோம்!

பதிப்பு 1.0.0 சிறப்பம்சங்கள்:
• நேரலை தங்கம் & வெள்ளி விலை நிலவரம் (Live 22K/24K Rates).
• மாதாந்திர தங்க சேமிப்பு திட்டங்கள் & போனஸ் சலுகைகள்.
• டிஜிட்டல் தங்க பாஸ்புக் & சேமிப்பு விவரங்கள்.
• தங்கம் முன்பதிவு (Gold Advance Booking) வசதி.
• UPI, GPay, PhonePe மூலம் பாதுகாப்பான ஆன்லைன் பேமெண்ட்.
• சேமித்த தங்கத்தை திருச்சூர் ஷோரூமில் நகைகளாக மாற்றும் வசதி.
```
