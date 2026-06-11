# API Integration and Localization Audit Report

This report catalogs all active screens within the mobile application routes, evaluating their data sources, API calls, localization mechanisms, and mapping potential gaps or opportunities for further synchronization.

---

## Screen Comparison Matrix

| Screen Name | File Path | API Status | Endpoints Called / Actions | Localization Method | Hardcoded Gaps / Static Details | Sync & Improvement Recommendations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Intro / Splash Slider** | [intro.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/intro.tsx) | **Fully Synced** | `GET /intro-screens/active` | `useTranslation` (`t("next")`, `t("get_started")`) | Default slider images are hardcoded as fallbacks if the API fails or is disabled. | Maintain current local fallback setup to preserve offline splash capability. |
| **Login Screen** | [login.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(auth)/login.tsx) | **Fully Synced** | `POST /auth/check-mobile`<br>`POST /auth/verify-otp` | `useTranslation` (Form labels and placeholders) | None (Mobile inputs, error prompts, and network checks are dynamic). | Fully production-ready. SMS auto-retriever is mapped for Android. |
| **Register Screen** | [register.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(auth)/register.tsx) | **Fully Synced** | `POST /auth/register` | `useTranslation` (Fields & validation alerts) | None. | Fully integrated. |
| **MPIN Setup / Verify** | [setmpin.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(auth)/setmpin.tsx)<br>[mpin_verify.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(auth)/mpin_verify.tsx) | **Fully Synced** | `POST /register/complete`<br>`POST /auth/verify-mpin` | `useTranslation` (Titles and error views) | None. | Mapped to global state store (`useGlobalStore`) securely via SecureStore. |
| **Home Screen (Dashboard)** | [index.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/index.tsx) | **Fully Synced** | `GET /home?userId=${userId}` (Banners, slides)<br>`GET /branches`<br>`GET /amount-limits/scheme/${schemeId}`<br>`GET /kyc/status/${userId}`<br>`GET /investments/user_investments/${userId}` | **Dynamic 5-Language** (`getTranslatedText` for slides/schemes) | Static fallback banners if backend yields empty listings. | Fully synced. Uses API logging utilities (`logApiSummary`, `checkForContinuousCalls`) for performance tracking. |
| **Schemes Screen** | [schemes.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/schemes.tsx) | **Fully Synced** | `GET /schemes/active`<br>`GET /amount-limits/scheme/${schemeId}` | **Dynamic 5-Language** (`getTranslatedText` for names, descriptions, slogans, and benefits) | None. | Fully synced with the newly integrated Malayalam Tamil-fallback mechanism. |
| **Join Savings Form** | [join_savings.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/join_savings.tsx) | **Fully Synced** | `GET /branches`<br>`GET /kyc/status/${userId}`<br>`POST /investments` | `useTranslation` (Form placeholders and labels) | Default branch set to `1` as client-side fallback if branches fetch fails. | Account Holder name is pre-populated from user profile store dynamically. Branch picker is fully interactive. |
| **Payment Overview (EMI)** | [paymentNewOverView.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/paymentNewOverView.tsx) | **Fully Synced** | `GET /schemes/${schemeId}`<br>`GET /amount-limits/scheme/${schemeId}`<br>`POST /payments/initiate` | **Dynamic 5-Language** (Fetches localized terms dynamically via `terms_conditions_${language}`) | Fallback terms content "Terms and conditions not available" if fields are empty. | Integrated 5-language terms check with legacy Malayalam fallback to Tamil columns. |
| **My Savings Listing** | [MySchemesContent.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/savings/MySchemesContent.tsx) | **Fully Synced** | `GET investments/user_investments/${userId}`<br>`POST /payments/rewards-list?userId=${userId}` | **Dynamic 5-Language** (`getLocalizedText` in `EnhancedSchemeCard.tsx`) | Empty state placeholder texts. | Audited and updated translation helpers to support 5-language dynamic resolution. |
| **Savings / Chit Details** | [SavingsDetail.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/savings/SavingsDetail.tsx) | **Fully Synced** | `GET investments/${investmentId}`<br>`POST investments/check-payment` | `useTranslation` (History list headers) | Status checks and transaction list labels. | Verified dynamic binding. |
| **Gold Advance Booking** | [gold_advance.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/gold_advance.tsx) | **Fully Synced** | `GET /advance-booking-config?status=ACTIVE`<br>`POST /tickets` | `useTranslation` (Form fields and validations) | Ticket issue status text. | Integrated with booking configs endpoint. |
| **Booking History** | [BookingHistory.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/BookingHistory.tsx) | **Fully Synced** | `GET /gold-bookings/user/${userId}` | `useTranslation` (Active vs Closed tabs) | Status badges colors/texts are formatted client-side. | Fully integrated. Logs screen view event using `logAppEvent('VIEW_BOOKING_HISTORY')`. |
| **KYC Upload Screen** | [kyc.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/kyc.tsx) | **Fully Synced** | `GET /kyc/status/${userId}`<br>`GET /pincode/${pincode}`<br>`POST /kyc` | `useTranslation` (ID upload instructions) | ID proof options list is static (e.g. Aadhaar, PAN, Voter ID). | Static ID proof list is typical for mobile apps, but could be fetched from configuration APIs in the future. |
| **App Visibility Flags** | [app_visibility.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/app_visibility.tsx) | **Fully Synced** | `GET /app-visible` | i18n variables | None. | Controls dynamic showing/hiding of pages based on feature flags. |
| **Store Info & Contact** | [about_us.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/(storeInfo)/about_us.tsx)<br>[contact_us.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/(storeInfo)/contact_us.tsx) | **Fully Synced** | `GET /about-page/latest` | `useTranslation` | Address details are fetched from API; fallback icons are static. | Fully integrated. |
| **Policies Screens** | [ourPolicies.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/policies/ourPolicies.tsx)<br>[privacyPolicy.tsx](file:///c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/policies/privacyPolicy.tsx) | **Fully Synced** | `GET /policies/type/our_policy`<br>`GET /policies/type/privacy_policy` | `useTranslation` | Policies text fallbacks. | Fetched dynamically from policies configuration endpoints. |

---

## Screen-by-Screen Detailed Audit Notes

### 1. Welcome / Intro Splash Slider (`src/app/intro.tsx`)
* **API Details:** Fetches active slides dynamically via `/intro-screens/active`. The image paths are handled using `getImageSource` which maps them to server-side URLs.
* **Fallbacks:** Uses local default illustrations if the server is offline.
* **Localization:** Mapped to user i18n context so labels automatically update if language settings change.

### 2. Login, Registration & MPIN Screens (`src/app/(auth)/...`)
* **API Details:** Complete auth pipeline runs through checking mobile numbers via `/auth/check-mobile`, verifying OTPs via `/auth/verify-otp`, and validating MPINs via `/auth/verify-mpin`.
* **State Management:** Secure tokens (`accessToken`, `refreshToken`, `authToken`) are managed via `SecureStore` (Expo) while basic user details are kept in AsyncStorage and global store (`useGlobalStore`).

### 3. Dashboard / Home (`src/app/(app)/(tabs)/home/index.tsx`)
* **API Details:** Combines home metrics (`/home?userId=${userId}`), latest gold rate charts, active scheme configurations, user KYC statuses, and active branches in a single dashboard dashboard feed.
* **Localization:** All retrieved schemes and promotional slides are localized in English, Tamil, Telugu, Hindi, or Malayalam using the updated 5-language `getTranslatedText` helper.

### 4. Savings Schemes Listing & Details (`src/app/(app)/(tabs)/home/schemes.tsx`)
* **API Details:** Retrieves schemes from `/schemes/active`. Benefits grids, monthly chit increments, durations, and dynamic details tables (`table_meta`) are loaded directly from the database columns.
* **Localization:** Supports multi-language translation mapping for benefits lists, descriptions, and headings with Tamil and English fallbacks.

### 5. Join Savings Form (`src/app/(app)/(tabs)/home/join_savings.tsx`)
* **API Details:** Dynamically loads the list of active branches (`/branches`) and current KYC verification status (`/kyc/status/${userId}`).
* **Form Logic:** Pre-populates the logged-in user name automatically. Enables manual select branches.

### 6. Payment Overview (`src/app/(app)/(tabs)/home/paymentNewOverView.tsx`)
* **API Details:** Queries the active scheme details (`/schemes/${schemeId}`) and amount constraints (`/amount-limits/scheme/${schemeId}`) before initiating payment.
* **T&C Integration:** Renders dynamic terms and conditions based on `terms_conditions_${language}` with legacy Tamil fallbacks for Malayalam.

### 7. My Subscribed Schemes (`MySchemesContent.tsx` & `EnhancedSchemeCard.tsx`)
* **API Details:** Fetches active investments for the user from `/investments/user_investments/${userId}` and rewards lists from `/payments/rewards-list`.
* **Localization:** Mapped via the 5-language `getLocalizedText` helper in `EnhancedSchemeCard.tsx`.

### 8. Gold Advance Booking (`gold_advance.tsx` & `BookingHistory.tsx`)
* **API Details:** Checks booking configurations `/advance-booking-config?status=ACTIVE` and lists user bookings `/gold-bookings/user/${userId}`.
* **Actions:** Submits new ticket requests to `/tickets`.

---

## Optimization Recommendations
* **Configurations Sync:** Static dropdown lists like ID proofs in `kyc.tsx` can be migrated to configuration endpoints (e.g. `/config/kyc-doc-types`) to make adding/removing supported docs fully dynamic without app store releases.
* **Caching Strategy:** Large config pages (e.g. `about_us.tsx`, `policies`) can leverage local AsyncStorage caching to improve initial screen loading times when transitioning between tabs.
