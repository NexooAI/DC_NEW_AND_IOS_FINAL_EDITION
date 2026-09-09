# 🚀 Google Play Store Release & Build Guide
## Sri Ganapathy Jewel City (ஸ்ரீ கணபதி ஜுவல் சிட்டி - Pollachi)

---

## 🟢 1. Pre-Build Health & Verification Status

| Check | Command | Status | Result |
| :--- | :--- | :--- | :--- |
| **Expo Doctor** | `npx expo-doctor` | 🟢 PASSED | **18/18 checks passed (0 issues)** |
| **TypeScript Check** | `npx tsc --noEmit --skipLibCheck` | 🟢 PASSED | **0 type errors (Code 0)** |
| **App Version** | In `theme.config.js` | 🟢 READY | **Version `1.0.0`** (Reset cleanly) |
| **Version Code** | In `theme.config.js` | 🟢 READY | **`versionCode: 1`** (First Store Release) |
| **Package Name** | In `app.config.ts` | 🟢 READY | **`com.nexooai.sriganapathyjewelcity`** |
| **EAS Slug** | In `app.config.ts` | 🟢 READY | **`sriganapathyjewelcity`** |
| **EAS Project ID** | In `app.config.ts` | 🟢 READY | **`dd876f0b-7798-48b3-b282-ea486ad8bfd4`** |
| **EAS Owner** | In `app.config.ts` | 🟢 READY | **`nexooai`** |
| **Google Services** | `google-services.json` | 🟢 READY | Validated with `com.nexooai.sriganapathyjewelcity` block |

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

## 🎨 3. Play Store Graphic Assets (அனைத்தும் தயார்!)

அனைத்து கிராஃபிக் பைல்களும் `assets/playstore/` ஃபோல்டரில் சரியான அளவுகளில் உருவாக்கப்பட்டுள்ளன:

### Files Directory: `assets/playstore/`
1. **App Icon:** `app_icon_512.png` (`512 x 512 px`, PNG 32-bit, < 1MB)
2. **Feature Graphic Banner:** `feature_graphic.png` (`1024 x 500 px`, RGB, No transparency)
3. **Screenshot 1:** `screenshot_1_rates.png` (`1080 x 1920 px` - Live 22K/24K Rates & Quick Buy)
4. **Screenshot 2:** `screenshot_2_schemes.png` (`1080 x 1920 px` - Monthly Gold Schemes & Bonus)
5. **Screenshot 3:** `screenshot_3_locker.png` (`1080 x 1920 px` - Digital Gold Passbook & Pollachi Showroom Redemption)

---

## 📝 4. Google Play Console Listing Content (Copy & Paste)

### 📌 App Title (பெயர்)
```text
Sri Ganapathy Jewel City
```
*(24 / 30 எழுத்துக்கள்)*

---

### 📌 Short Description (குறு விபரம்)
```text
Save in 100% BIS Hallmarked DigiGold & Monthly Chit Schemes easily in Pollachi.
```
*(78 / 80 எழுத்துக்கள்)*

---

### 📌 Full Description (முழு விபரம்)
```text
Welcome to the official mobile application of Sri Ganapathy Jewel City (ஸ்ரீ கணபதி ஜுவல் சிட்டி), Pollachi – Your trusted destination for exquisite gold, diamond, and silver jewellery.

Our DigiGold and Monthly Gold Savings application empowers you to save and accumulate 100% BIS Hallmarked certified 22K & 24K gold conveniently from anywhere. Whether you want to invest small amounts regularly or join our exclusive monthly gold schemes, Sri Ganapathy Jewel City provides a transparent, secure, and rewarding gold savings experience.

✨ Key Features of Sri Ganapathy Jewel City App:

• Real-Time Market Gold Rates: Instant daily updates for 22K gold, 24K pure gold, and fine silver rates in Pollachi.
• Flexible Gold Chit Schemes: Join monthly gold savings plans with ease. Accumulate gold weight month after month with special bonus benefits upon completion.
• Digital Gold Passbook & Locker: Access your complete payment history, past transactions, weight accumulation, and live gold portfolio value anytime.
• 100% Certified & Insured: Your savings are backed by certified physical 24K hallmarked gold stored safely in high-security insured vault lockers.
• Seamless Online Payments: Pay your monthly scheme dues in seconds using UPI, Google Pay, PhonePe, Paytm, Debit/Credit Cards, or Net Banking.
• Easy In-Store Redemption: Redeem your saved gold weight against breathtaking gold jewellery, bridal ornaments, coins, or diamond articles directly at our Pollachi showroom.
• Festival & Auspicious Offers: Stay notified of special Akshaya Tritiya, Diwali, and festive gold booking offers with zero making charge benefits.

Begin your smart gold savings journey with Sri Ganapathy Jewel City today!

Showroom Address & Customer Support:
Sri Ganapathy Jewel City,
M245+HGH, Kadai Veethi, Puliampatti, Pollachi, Tamil Nadu 642001.
Phone / WhatsApp: +91 98422 30015
Email: info@ganapathijewelcity.com
Website: https://ganapathijewelcity.com
```

---

### 📌 Store Categorization & Setup Details
* **Application Category:** Shopping / Finance
* **Tags:** Jewellery, Gold Scheme, DigiGold, Savings, Gold Rate, Pollachi
* **Content Rating:** Everyone (3+)
* **Target Audience:** Age 18 and above
* **App Access:** All functionality is available without special access (Login via Mobile OTP)
* **Privacy Policy URL:** `https://sriganapathijewelcity.com/policies/#privacy`

---

## 📢 5. Google Play Console Release Notes (பதிப்பு குறிப்புகள்)

Google Play Console-ல் பில்டை வெளியிடும் போது **"Release Notes"** (அதிகபட்சம் 500 எழுத்துக்கள்) கேட்கப்படும். அதற்கான உரை கீழே:

### 🇺🇸 English (`en-IN` / `en-US` - Default)
```text
Welcome to Sri Ganapathy Jewel City!

What's New in Version 1.0.0:
• Live Gold & Silver Rates: Real-time 22K & 24K market rate updates.
• Monthly Gold Savings Schemes: Flexible chit schemes with special maturity bonus.
• Digital Gold Passbook: Track your accumulated gold weight and payments.
• 100% BIS Hallmarked: Pure gold savings backed by certified physical gold.
• Instant & Secure Payments: Pay installments via UPI, GPay, PhonePe & Cards.
• Showroom Redemption: Redeem gold weight easily at our Pollachi showroom.
```

---

### 🇮🇳 Tamil (`ta-IN`)
```text
ஸ்ரீ கணபதி ஜுவல் சிட்டி ஆப்பிற்கு உங்களை அன்போடு வரவேற்கிறோம்!

பதிப்பு 1.0.0 சிறப்பம்சங்கள்:
• நேரலை தங்கம் & வெள்ளி விலை நிலவரம் (Live 22K/24K Rates).
• மாதாந்திர தங்க சேமிப்பு திட்டங்கள் & முதிர்வு போனஸ் சலுகைகள்.
• டிஜிட்டல் தங்க பாஸ்புக் & சேமிப்பு விவரங்கள்.
• 100% BIS ஹால்மார்க் சான்றளிக்கப்பட்ட தங்க சேமிப்பு.
• UPI, GPay, PhonePe மூலம் பாதுகாப்பான ஆன்லைன் பேமெண்ட்.
• சேமித்த தங்கத்தை பொள்ளாச்சி ஷோரூமில் நகைகளாக மாற்றும் வசதி.
```

