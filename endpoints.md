# DC Jeweller Mobile Application API Endpoints

This document lists all the API endpoints utilized in the application, categorized by their modules/features, along with their HTTP methods, descriptions, request structures, and service implementations.

---

## 1. Authentication (`auth`)

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **POST** | `/auth/check-mobile` | Check if a mobile number is registered. | `src/services/api.ts` (authAPI.checkMobile) |
| **POST** | `/auth/verify-otp` | Verify the OTP sent to the user's mobile number. | `src/services/api.ts` (authAPI.verifyOtp) |
| **POST** | `/auth/login` | Log in the user. | `src/services/apiWithLoader.ts` (apiWithLoader.auth.login) |
| **POST** | `/auth/register` | Register a new user account. | `src/services/apiWithLoader.ts` (apiWithLoader.auth.register) |
| **POST** | `/auth/verify-mpin` | Verify user's MPIN. | `src/services/apiWithLoader.ts` (apiWithLoader.auth.verifyMpin) |
| **POST** | `/auth/refresh-token` | Refresh expired JWT authentication tokens. | `src/services/api.ts` (authAPI.refreshToken) |
| **POST** | `/auth/logout` | Log out the user and clean up user sessions. | `src/services/api.ts` (authAPI.logout) / `apiWithLoader.ts` |

### Auth Payloads
*   **Check Mobile:** `POST /auth/check-mobile`
    ```json
    { "mobile_number": "string" }
    ```
*   **Verify OTP:** `POST /auth/verify-otp`
    ```json
    { "mobile_number": "string", "otp": "string" }
    ```
*   **Verify MPIN:** `POST /auth/verify-mpin`
    ```json
    { "mpin": "string" }
    ```

---

## 2. User & Profile

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **GET** | `/user/profile` | Retrieve profile information for the authenticated user. | `src/services/api.ts` (userAPI.getProfile) |
| **GET** | `/users/profile` | Alternative endpoint to fetch user profile. | `src/services/apiWithLoader.ts` (apiWithLoader.user.getProfile) |
| **PUT** | `/user/profile` | Update the current authenticated user's profile. | `src/services/api.ts` (userAPI.updateProfile) |
| **PUT** | `/users/:userId` | Update profile information for a specific user. | `src/services/apiWithLoader.ts` (apiWithLoader.user.updateProfile) |
| **POST** | `/deactivateUser/:userId` | Deactivate a user's account. | `src/services/api.ts` (userAPI.deactivateUser) |
| **POST** | `/upload` | Upload profile image. (Uses Multipart Form Data). | `src/services/api.ts` (userAPI.uploadProfileImage) |

---

## 3. Investments

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **GET** | `/investments/user/:userId` | Get general investments list by user ID. | `src/services/api.ts` (investmentAPI.getInvestmentsByUser) |
| **GET** | `/investments/user_investments/:userId` | Get detailed savings investments for the user. | `src/services/api.ts` / `src/services/apiWithLoader.ts` |
| **GET** | `/investments/:investmentId` | Get details of a specific investment scheme/entry. | `src/services/api.ts` / `src/services/apiWithLoader.ts` |
| **POST** | `/investments` | Create a new investment scheme entry. | `src/services/api.ts` / `src/services/apiWithLoader.ts` |
| **PUT** | `/investments/:id` | Update status/amount for a specific investment. | `src/utils/paymentUtils.ts` (updateInvestment) |
| **POST** | `/investments/check-payment` | Verify the status of an investment payment. | `src/services/apiWithLoader.ts` (apiWithLoader.investments.checkPayment) |

---

## 4. Payments & Transactions

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **POST** | `/payments/initiate` | Initiate payment gateway session (content-type: urlencoded). | `src/services/payment.service.ts` / `src/utils/paymentUtils.ts` |
| **POST** | `/payments` | Record a payment in the database. | `src/services/payment.service.ts` / `src/utils/paymentUtils.ts` |
| **GET** | `/payments/history` | Retrieve overall payments history. | `src/services/api.ts` (paymentAPI.getPaymentHistory) |
| **GET** | `/payments/history/:userId` | Retrieve payment history for a specific user. | `src/services/apiWithLoader.ts` (apiWithLoader.payments.getPaymentHistory) |
| **GET** | `/payments/status/:paymentId` | Check status of a specific payment transaction. | `src/services/api.ts` (paymentAPI.getPaymentStatus) |
| **POST** | `/payments/generate-invoice` | Generate an invoice PDF for a completed payment. | `src/services/api.ts` (paymentAPI.generateInvoice) |
| **POST** | `/transactions` | Record payment gateway callback/transaction logs. | `src/services/payment.service.ts` / `src/utils/paymentUtils.ts` |
| **GET** | `/transactions/user/:userId` | Retrieve all transactions recorded for a user. | `src/services/apiWithLoader.ts` (apiWithLoader.transactions.getUserTransactions) |

---

## 5. Savings Schemes

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **GET** | `/schemes/active` | Retrieve list of active savings schemes (cached). | `src/services/apiWithLoader.ts` / `src/utils/apiCache.ts` |
| **GET** | `/schemes/:schemeId` | Retrieve details of a specific scheme. | `src/services/apiWithLoader.ts` |

---

## 6. Gold Rates

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **GET** | `/rates/live` | Retrieve current live gold rates. | `src/services/payment.service.ts` / `src/services/apiWithLoader.ts` |
| **GET** | `/rates/current` | Retrieve cached current rates. | `src/utils/apiCache.ts` |
| **GET** | `/rates/history` | Fetch historical rate chart data (e.g. daily, weekly, monthly). | `src/services/apiWithLoader.ts` (params: `?period=...`) |

---

## 7. Support & Tickets

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **GET** | `/faq/questions` | Retrieve FAQ questions database. | `src/services/faqService.ts` (getFAQQuestions) |
| **POST** | `/tickets` | File a new customer support ticket. | `src/services/api.ts` / `src/services/faqService.ts` |
| **GET** | `/tickets` | Retrieve all customer support tickets (filter by `userId`). | `src/services/faqService.ts` (params: `?userId=...`) |
| **GET** | `/tickets/:ticketId` | Get the details and status of a specific support ticket. | `src/services/faqService.ts` (getTicketStatus) |

---

## 8. Notifications

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **POST** | `/notifications/token` | Register or update the FCM Push Notification token. | `src/services/api.ts` / `src/services/NotificationService.ts` |
| **GET** | `/notifications/:userId` | Fetch push notifications logs history for a user. | `src/services/api.ts` (userAPI.getNotifications) |
| **PUT** | `/notifications/:notificationId` | Mark a specific notification as read. | `src/services/api.ts` (userAPI.markNotificationAsRead) |
| **DELETE** | `/notifications/:notificationId` | Delete/dismiss a notification entry. | `src/services/api.ts` (userAPI.deleteNotification) |
| **PUT** | `/notifications/mark-all-read` | Mark all user notifications as read. | `src/services/api.ts` (userAPI.markAllNotificationsAsRead) |

---

## 9. Advance Booking

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **POST** | `/advancebookings` | Place a gold rate lock/advance booking transaction. | `src/services/api.ts` (advanceBookingAPI.createBooking) |
| **GET** | `/advancebookings` | Fetch user's active/past advance bookings list. | `src/services/api.ts` (params: `?userId=...`) |

---

## 10. Bills

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **GET** | `/bills/my-bills` | Fetch bills/dues list for a user. | `src/services/api.ts` (params: `?userId=...`) |
| **POST** | `/bills/pay` | Submit a payment against an outstanding bill/due. | `src/services/api.ts` (billsAPI.payBill) |

---

## 11. Rewards & Referrals

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **GET** | `/rewards/my-referrals` | Retrieve list of registered referrals. | `src/services/api.ts` (params: `?userId=...`) |
| **GET** | `/rewards/wallet` | Fetch reward points wallet information. | `src/services/api.ts` (params: `?userId=...`) |
| **POST** | `/rewards/redeem` | Submit a request to redeem earned reward points. | `src/services/api.ts` (rewardsAPI.redeemPoints) |

---

## 12. Lucky Draw

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **GET** | `/lucky-draw` | Get list of active lucky draw contests. | `src/services/api.ts` (params: `?status=...`) |
| **GET** | `/lucky-draw/:id` | Get status and details of a specific lucky draw. | `src/services/api.ts` (luckyDrawAPI.getLuckyDrawDetails) |

---

## 13. System Configuration & Maintenance

| Method | Endpoint | Description | Service / File Location |
|:---|:---|:---|:---|
| **GET** | `/maintenance/status` | Check system availability / scheduled maintenance periods. | `src/services/api.ts` (maintenanceAPI.checkMaintenanceStatus) |
| **GET** | `/version/verify-version` | Verify client app version and check for mandatory updates. | `src/services/api.ts` / `src/services/forceUpdateService.ts` |
| **GET** | `/branches` | Fetch physical branch locations coordinates/details. | `src/services/api.ts` / `src/utils/apiCache.ts` |
| **GET** | `/about-page/latest` | Retrieve the latest text content/media config for the about page. | `src/utils/apiCache.ts` |
