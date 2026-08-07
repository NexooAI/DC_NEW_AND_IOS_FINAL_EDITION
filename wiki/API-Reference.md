# API Reference Guide

This guide lists all the REST and WebSocket endpoints consumed by the DC Jewellers Mobile Application.

---

## 🛠️ Service Clients

The application utilizes two primary service modules for REST API calls:
1.  **`src/services/api.ts`**: The default client for asynchronous background requests.
2.  **`src/services/apiWithLoader.ts`**: A blocking client wrapper that displays a global loading screen during execution.

---

## 📖 Endpoint Registry

### 1. Authentication & Session Management
*   **Check Mobile:** `POST /auth/check-mobile`
    *   *Payload:* `{ "mobile_number": "string" }`
    *   *Handler:* `api.ts (authAPI.checkMobile)`
*   **Verify OTP:** `POST /auth/verify-otp`
    *   *Payload:* `{ "mobile_number": "string", "otp": "string" }`
    *   *Handler:* `api.ts (authAPI.verifyOtp)`
*   **Verify MPIN:** `POST /auth/verify-mpin`
    *   *Payload:* `{ "mpin": "string" }`
    *   *Handler:* `apiWithLoader.ts (apiWithLoader.auth.verifyMpin)`
*   **Login User:** `POST /auth/login`
    *   *Handler:* `apiWithLoader.ts (apiWithLoader.auth.login)`
*   **Register User:** `POST /auth/register`
    *   *Handler:* `apiWithLoader.ts (apiWithLoader.auth.register)`
*   **Logout Session:** `POST /auth/logout`
    *   *Handler:* `api.ts (authAPI.logout)`

---

### 2. User Profiles & Accounts
*   **Get Profile details:** `GET /user/profile` or `/users/profile`
    *   *Handlers:* `api.ts (userAPI.getProfile)` / `apiWithLoader.ts`
*   **Update Profile:** `PUT /user/profile` or `/users/:userId`
    *   *Handlers:* `api.ts (userAPI.updateProfile)` / `apiWithLoader.ts`
*   **Deactivate Account:** `POST /deactivateUser/:userId`
    *   *Handler:* `api.ts (userAPI.deactivateUser)`
*   **Upload Profile Image:** `POST /upload` (Multipart Form Data)
    *   *Handler:* `api.ts (userAPI.uploadProfileImage)`

---

### 3. Investment Schemes Tracker
*   **Get Schemes Active List:** `GET /schemes/active` (Cached offline)
    *   *Handler:* `apiWithLoader.ts`
*   **Get Scheme details:** `GET /schemes/:schemeId`
    *   *Handler:* `apiWithLoader.ts`
*   **Get User Subscriptions:** `GET /investments/user_investments/:userId`
    *   *Handler:* `api.ts (investmentAPI.getInvestmentsByUser)`
*   **Subscribe / Create Investment:** `POST /investments`
    *   *Handler:* `apiWithLoader.ts`
*   **Check Investment Status:** `POST /investments/check-payment`
    *   *Handler:* `apiWithLoader.ts (apiWithLoader.investments.checkPayment)`

---

### 4. Payments, Bills & Transactions
*   **Outstanding Bills List:** `GET /bills/my-bills?userId={userId}`
    *   *Handler:* `api.ts (billsAPI.getBills)`
*   **Initiate Gateway Payment:** `POST /payments/initiate` (urlencoded payload)
    *   *Handler:* `payment.service.ts` / `paymentUtils.ts`
*   **Check Payment Status:** `GET /payments/status/:paymentId`
    *   *Handler:* `api.ts (paymentAPI.getPaymentStatus)`
*   **Generate PDF Invoice:** `POST /payments/generate-invoice`
    *   *Payload:* `{ "paymentId": "string" }`
    *   *Handler:* `api.ts (paymentAPI.generateInvoice)`
*   **Get Transactions List:** `GET /transactions/user/:userId`
    *   *Handler:* `apiWithLoader.ts`

---

### 5. Advance Gold Booking
*   **Create Booking:** `POST /advancebookings`
    *   *Handler:* `api.ts (advanceBookingAPI.createBooking)`
*   **Get Booking History:** `GET /advancebookings?userId={userId}`
    *   *Handler:* `api.ts`

---

### 6. Metal Rates
*   **Get Real-Time Live Metal Rates:** `GET /rates/live`
    *   *Handler:* `payment.service.ts` / `apiWithLoader.ts`
*   **Get Rate History (Charts):** `GET /rates/history?period={daily|weekly|monthly}`
    *   *Handler:* `apiWithLoader.ts`

---

### 7. Support & Customer Tickets
*   **Get Category FAQs:** `GET /faq/questions`
    *   *Handler:* `faqService.ts (getFAQQuestions)`
*   **File Support Ticket:** `POST /tickets`
    *   *Handler:* `faqService.ts` / `api.ts`
*   **List Customer Tickets:** `GET /tickets?userId={userId}`
    *   *Handler:* `faqService.ts`
*   **Get Ticket Details:** `GET /tickets/:ticketId`
    *   *Handler:* `faqService.ts (getTicketStatus)`

---

### 8. Push Notifications
*   **Update Push Token:** `POST /notifications/token`
    *   *Payload:* `{ "userId": "string", "token": "string", "platform": "android|ios" }`
    *   *Handler:* `api.ts` / `NotificationService.ts`
*   **Get User Notifications:** `GET /notifications/:userId`
    *   *Handler:* `api.ts (userAPI.getNotifications)`
*   **Mark Read status:** `PUT /notifications/:notificationId`
    *   *Handler:* `api.ts (userAPI.markNotificationAsRead)`
*   **Dismiss Notification:** `DELETE /notifications/:notificationId`
    *   *Handler:* `api.ts (userAPI.deleteNotification)`

---

### 9. Rewards, Referrals & Lucky Draw
*   **Rewards Wallet Balance:** `GET /rewards/wallet?userId={userId}`
    *   *Handler:* `api.ts`
*   **Submit Points Redemption:** `POST /rewards/redeem`
    *   *Handler:* `api.ts (rewardsAPI.redeemPoints)`
*   **Referrals List:** `GET /rewards/my-referrals?userId={userId}`
    *   *Handler:* `api.ts`
*   **Active Lucky Draws:** `GET /lucky-draw?status=ACTIVE`
    *   *Handler:* `api.ts`

---

### 10. System Version & Status
*   **Verify Client Version:** `GET /version/verify-version`
    *   *Handler:* `api.ts` / `forceUpdateService.ts`
*   **Check Maintenance:** `GET /maintenance/status`
    *   *Handler:* `api.ts` / `maintenanceAPI.checkMaintenanceStatus`
*   **Physical Branches coordinates:** `GET /branches`
    *   *Handler:* `api.ts`
