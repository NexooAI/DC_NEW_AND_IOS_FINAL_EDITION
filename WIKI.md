# DC Jewellers Mobile App - Project Wiki

This repository contains the mobile application for **DC Jewellers**, built using **Expo (SDK 54)** and **React Native**. 

To explore the detailed design patterns, features, API integrations, and native build details, refer to the individual Wiki chapters below:

---

## 📚 Wiki Chapters

1.  ### 🌟 [Features & Modules](./wiki/Features-and-Modules.md)
    *   Authentication (OTP & MPIN logic, Biometric hooks).
    *   Savings Schemes (Horizontal sliding cards, chit balance trackers).
    *   Advance Gold Booking (Locked gold rate purchases, history telemetry).
    *   Bill Payments (WebViews, sockets status sync, success/failure torn-ticket cards).
    *   Rewards & Referrals (Redeem flow, grouped referrals, Lucky Draw contests).
    *   Customer Support & FAQs (Interactive bot chat, helpdesk tickets).

2.  ### 🛠️ [Technical Architecture](./wiki/Technical-Architecture.md)
    *   Directory hierarchy layout.
    *   State Management (Zustand store variables and SecureStore token persistence).
    *   Resilient API Clients (Network interceptors, cached storage helpers, duplications prevention).
    *   Responsive Layout & Scaling Rules (`wp`, `hp`, `rf` scale properties).
    *   5-Language Translation Engine (EN, TA, TE, HI, ML translation strings and fallbacks).

3.  ### 🔗 [API Reference Guide](./wiki/API-Reference.md)
    *   Module-by-module listing of all active endpoint parameters.
    *   Descriptions, request formats, response properties, and file service handlers.

4.  ### 🚀 [Deployment, Build & Maintenance](./wiki/Deployment-and-Maintenance.md)
    *   EAS compiler profiles and environment variable mapping (Google Maps API keys).
    *   Custom Expo build plugins (Modular CocoaPods headers for iOS, Android R8/Proguard rules injection).
    *   Startup services (Force update verifications, Maintenance outage blockers).

---

## 🏁 Quick Start: Running the App Locally

### Prerequisites:
*   [NodeJS](https://nodejs.org) (v18 or v20 recommended)
*   [Expo CLI](https://docs.expo.dev/) installed globally or run via `npx`
*   CocoaPods (for iOS native builds on macOS)

### Installation:
1.  Clone the repository and install project dependencies:
    ```bash
    npm install
    ```
2.  Start the Expo development server:
    ```bash
    npm run dev
    ```
3.  Choose your testing target:
    *   Press `a` for Android Emulator (requires Android Studio).
    *   Press `i` for iOS Simulator (requires macOS Xcode).
    *   Scan the QR code with the **Expo Go** app on your physical mobile device.
