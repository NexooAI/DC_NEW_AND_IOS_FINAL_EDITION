# Hybrid Scheme - Step-by-Step Testing Guide

This guide details how to verify the new Hybrid (Flexi-Fixed) scheme end-to-end on both the backend API and the mobile app.

---

## Prerequisites

1. Ensure the Node API server is running (`npm run dev` or `node index.js`).
2. Make sure your Expo mobile app is running and connected to the local API server.

---

## Step 1: Create a Test Hybrid Scheme in the Database

1. The `'Hybrid'` scheme plan type is automatically seeded in your `scheme_plan_types` table when the API starts up. Verify its ID using:
   ```sql
   SELECT id FROM scheme_plan_types WHERE name = 'Hybrid';
   ```
   *(Let's assume the ID returned is `3`)*
2. In your Admin Panel (or via direct SQL), create a new **Scheme** and assign its `scheme_plan_type_id` to `3` (the Hybrid plan type).
3. Connect a chit configuration to this scheme (define payment frequency, e.g. Monthly, duration: 11 months).

---

## Step 2: Test Months 1–5 (Flexi Phase)

1. Log in to the mobile app as a test user.
2. Join the newly created Hybrid scheme (this creates an active investment record in the `investments` table).
3. Go to the **Savings Details** screen in the mobile app, and click **Pay Now** to proceed to payment.
4. **App UI Verification:**
   * You should see the edit amount button (pencil icon) and adjustment arrows (`+` / `-`).
   * Verify that you can change the payment amount freely.
5. **Backend Verification:**
   * Complete a test payment of any custom amount.
   * Go back and initiate another payment in the same month. The API should allow it successfully (Flexi mode, multiple payments permitted).

---

## Step 3: Test Months 6–11 (Fixed Phase)

Since we cannot wait for 5 real months to test this, we can simulate the passage of time by shifting the investment's creation dates in the database:

1. Update the `createdAt` and `start_date` fields of the test investment to be **6 months in the past**:
   ```sql
   UPDATE investments 
   SET createdAt = DATE_SUB(NOW(), INTERVAL 6 MONTH), 
       start_date = DATE_SUB(NOW(), INTERVAL 6 MONTH) 
   WHERE id = <YOUR_TEST_INVESTMENT_ID>;
   ```
2. Restart/reload the savings detail page for this investment in the mobile app.
3. **App UI Verification:**
   * The amount adjustment arrows (`+` / `-`) and edit button should now be **hidden / disabled**.
   * The amount displayed should be locked to the computed average: `Total Paid in first 5 months / 5`.
4. **Backend Verification:**
   * Try to initiate a payment. After completing one payment, try to make a second payment.
   * The second payment request should fail on the backend with:
     `"success": false, "message": "Payment already made for this Monthly"`
     *(Enforcing exactly one payment per period).*
