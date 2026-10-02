# 🚀 Google Play Store Release & Build Guide
## Theni Anantham (தேனி ★ ஆனந்தம் - Dindigul)

---

## 🟢 1. Pre-Build Health & Verification Status

| Check | Command | Status | Result |
| :--- | :--- | :--- | :--- |
| **Expo Doctor** | `npx expo-doctor` | 🟢 PASSED | **21/21 checks passed (0 issues)** |
| **TypeScript Check** | `npx tsc --noEmit --skipLibCheck` | 🟢 PASSED | **0 type errors (Code 0)** |
| **App Version** | In `theme.config.js` | 🟢 READY | **Version `1.0.0`** |
| **Version Code** | In `theme.config.js` | 🟢 READY | **`versionCode: 1`** |
| **Package Name** | In `app.config.ts` | 🟢 READY | **`com.nexooai.thenianantham`** |
| **EAS Slug** | In `app.config.ts` | 🟢 READY | **`theniananthamdinidigul`** |
| **EAS Project ID** | In `app.config.ts` | 🟢 READY | **`4dc9d969-4bf5-43e8-b3da-1d31c3e95755`** |
| **EAS Owner** | In `app.config.ts` | 🟢 READY | **`nexooainew`** |
| **Google Services** | `google-services.json` | 🟢 READY | Validated with `com.nexooai.thenianantham` client |

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
Theni Anantham Chits
```
*(20 / 30 எழுத்துக்கள்)*

---

### 📌 Short Description (குறு விபரம்)
```text
Official Deepavali Chit Scheme & textile savings app from Theni Anantham Dindigul.
```
*(79 / 80 எழுத்துக்கள்)*

---

### 📌 Full Description (முழு விபரம்)
```text
Welcome to the official Theni Anantham mobile app – your trusted digital gateway to the Deepavali Annual Chit Scheme (தீபாவளி வருடாந்திர சீட்டு) and exclusive textile collections from Dindigul's premier showroom!

With decades of trust, heritage, and excellence in Dindigul, Tamil Nadu, Theni Anantham brings you a seamless mobile experience to join, save, and manage your annual festival textile chits.

✨ Key Features:

🎉 Deepavali Annual Chit Scheme (தீபாவளி வருடாந்திர சீட்டு)
• Choose between ₹500 and ₹1,000 monthly denominations.
• Pay 11 continuous monthly installments (1st to 5th of each month).
• 12th Month Incentive Bonus: Theni Anantham rewards your regular savings by paying the 12th month installment into your account!
• 100% Textile Redemption: Redeem accumulated savings exclusively for the finest bridal silks, sarees, dhotis, kidswear, and family garments at our Dindigul showroom.

💳 Quick & Secure Online Payments
Pay your monthly scheme installments instantly. The app supports secure integrations with:
• UPI (Google Pay, PhonePe, Paytm, BHIM)
• Credit and Debit Cards (Visa, Mastercard, RuPay)
• Netbanking and Secure Bank Gateways

📖 Digital Chit Passbook & Receipts
Monitor your installment history, due dates, paid receipts, and scheme status with absolute transparency.

🛡️ Industry-Standard Security
Your account is fully protected. Securely login using your personalized MPIN or Mobile OTP.

📞 Dedicated Customer Support
Need assistance? Contact our showroom team directly via WhatsApp or Phone call in just a tap.

Showroom Address & Customer Support:
Theni Anantham,
11, Main Road, Varadaraj Shopping Complex,
Dindigul, Tamil Nadu - 624001, India.
Phone / WhatsApp: +91 73393 66531
Email: contact@thenianantham.com
Website: https://www.thenianantham.com
Instagram: @THENIANANTHAMDINIDIGUL
```

---

### 📌 Store Categorization & Setup Details
* **Application Category:** Shopping
* **Tags:** Textiles, Shopping, Savings, Chit Fund, Sarees, Silk, Dindigul
* **Content Rating:** Everyone (3+)
* **Target Audience:** Age 18 and above
* **App Access:** All functionality is available without special access (Login via Mobile OTP)
* **Privacy Policy URL:** `https://www.thenianantham.com/privacy-policy`

---

## 📢 5. Google Play Console Release Notes (பதிப்பு குறிப்புகள்)

### 🇺🇸 English (`en-IN` / `en-US` - Default)
```text
Welcome to Theni Anantham!

What's New in Version 1.0.0:
• Official launch of the Theni Anantham Deepavali Annual Chit Scheme app.
• Enroll in ₹500 & ₹1000 monthly chit schemes.
• Pay 11 months and receive the 12th month incentive bonus paid by Theni Anantham.
• Instant UPI, Card, and Netbanking payments with digital receipts.
• Live digital passbook and installment tracking.
• Exclusive textile redemption at our Dindigul showroom.
```

---

### 🇮🇳 Tamil (`ta-IN`)
```text
தேனி ஆனந்தம் அதிகாரப்பூர்வ செயலிக்கு நல்வரவு!

பதிப்பு 1.0.0 சிறப்பம்சங்கள்:
• தேனி ஆனந்தம் தீபாவளி வருடாந்திர சீட்டு செயலியின் அதிகாரப்பூர்வ வெளியீடு.
• ₹500 மற்றும் ₹1000 மாத சீட்டுத் திட்டங்களில் சுலபமாக இணையலாம்.
• 11 மாதங்கள் தவணை செலுத்தி, 12-வது மாத தவணையை ஊக்கத்தொகையாக தேனி ஆனந்தத்திடம் பெறுங்கள்.
• UPI மற்றும் கார்டு மூலம் பாதுகாப்பான ஆன்லைன் கட்டண வசதி.
• டிஜிட்டல் பாஸ்புக் மற்றும் உடனடி கட்டண ரசீதுகள்.
• திண்டுக்கல் ஷோரூமில் சிறந்த ஜவுளி ரகங்களாக பெற்று மகிழுங்கள்.
```
