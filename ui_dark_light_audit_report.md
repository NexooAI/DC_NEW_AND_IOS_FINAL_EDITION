# Dark Mode and Light Mode UI Audit Report

Audit date: 2026-07-02

Scope audited: React Native / Expo route tree under `src/app`, shared UI under `src/components`, and navigation under `src/common/components/navigation`.

Important limitation: no emulator, device, or screenshot capture session was available in this environment. This report is therefore based on manual source inspection plus hardcoded color inventory. Screenshot references are marked unavailable. Because the white-label requirement explicitly forbids hardcoded black, white, gray, and inline colors, any screen with such evidence is marked Failed.

## Executive Findings

Status: FAILED

1. Location: `src/constants/theme.js`, `src/constants/colors.js`
   Expected: all active colors, button variants, status colors, overlays, and fallbacks come from the centralized theme and update correctly for light/dark mode.
   Actual: `theme.button` and many semantic fallbacks contain fixed hex values. `darkPalette.white` is `#1e1e1e` and `darkPalette.black` is `#ffffff`, so semantic names can invert unexpectedly in components that expect literal white/black.
   Priority: Critical
   Estimated Fix Time: 180 minutes

2. Location: app and component color inventory
   Expected: no hardcoded black, white, gray, hex, or inline color values in screens/components.
   Actual: 2,645 hardcoded `#hex` / `rgba()` occurrences found across `src/app`, `src/components`, `src/common`, and `src/_styles`.
   Priority: Critical
   Estimated Fix Time: 2-4 days

3. Location: `StatusBar` usage in multiple route files
   Expected: status bar content/background derive from active theme and switch without stale color.
   Actual: repeated `barStyle="dark-content"` and beige `theme.colors.quaternary || '#F2E6D2'` fallbacks appear in payment, notification, savings, ticket, and home layouts.
   Priority: High
   Estimated Fix Time: 90 minutes

4. Location: modal/bottom-sheet components
   Expected: modal surfaces, overlays, close icons, buttons, and details text are theme-aware in both modes.
   Actual: modal surfaces frequently use `#FBFBFB`, `#333`, `#666`, `rgba(0,0,0,...)`, `white`, and fixed gold/red/green colors.
   Priority: High
   Estimated Fix Time: 1-2 days

5. Location: form inputs and placeholders
   Expected: input background, text, border, placeholder, cursor/selection, focus, and error states all use theme tokens.
   Actual: fixed placeholders (`#999`, `#aaa`, `gray`, rgba literals) and light input backgrounds appear in auth, profile, gold advance, savings detail, chat, ticket form, and register flows.
   Priority: High
   Estimated Fix Time: 1 day

## Screen Results

### Root Index / Auth Redirect
Status: Failed

Issues Found:
1. Location: `src/app/index.tsx`
   Expected: loading/error state colors fully theme-aware.
   Actual: uses legacy `COLORS` aliases; cannot certify dark/light contrast until root color aliases are corrected.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 30 minutes

### Intro
Status: Failed

Issues Found:
1. Location: `src/app/intro.tsx`
   Expected: loading state and slide controls use active theme tokens.
   Actual: depends on centralized theme, but cannot be certified while the root theme contains fixed button/color fallbacks.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 30 minutes

### Login Redirect Route
Status: Failed

Issues Found:
1. Location: `src/app/login.tsx`
   Expected: route should use the same validated auth screen theme surface.
   Actual: separate route exists and needs visual verification against `(auth)/login`.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 20 minutes

### Missing / 404
Status: Failed

Issues Found:
1. Location: `src/app/[...missing].tsx`
   Expected: error screen text, background, image, and action button are theme-aware.
   Actual: not certified through shared error-state theme audit.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 30 minutes

### Auth Login
Status: Failed

Issues Found:
1. Location: `src/app/(auth)/login.tsx:1276`, `:1616`, `:1867-1902`
   Expected: register/login buttons, modal text, disabled states, and language picker colors come from theme.
   Actual: fixed `#E74C3C`, `#ffc90c`, `#ffd700`, `#555`, `#333`, `#f8f9fa`, `#007AFF`, `#e0e0e0`, `#999999`.
   Screenshot reference: unavailable
   Priority: Critical
   Estimated Fix Time: 120 minutes

### Register
Status: Failed

Issues Found:
1. Location: `src/app/(auth)/register.tsx:70-83`, `:364-405`; `src/_styles/registerStyles.ts:71-84`, `:153-224`
   Expected: register card, OTP fields, loading toast, overlays, and button text use theme colors.
   Actual: fixed black/white rgba overlays, `#ffffff`, `#ccc`, `#000`, and button text based on `themeColors.primary`, which can be low contrast on gold/dark backgrounds.
   Screenshot reference: unavailable
   Priority: Critical
   Estimated Fix Time: 180 minutes

### OTP / User Basic Details
Status: Failed

Issues Found:
1. Location: `src/app/(auth)/userBasicDetails.tsx:914`, `:992`, `:1686`, `:1766`, `:2226-2557`
   Expected: OTP, branch dropdown, form validation, modal, and disabled states are theme-aware.
   Actual: many fixed input/placeholders and status colors (`#007AFF`, `#d32f2f`, `#4CAF50`, `#ccc`, `#333`, `#aaa`, `#888`, rgba light surfaces).
   Screenshot reference: unavailable
   Priority: Critical
   Estimated Fix Time: 240 minutes

### Auth KYC
Status: Failed

Issues Found:
1. Location: `src/app/(auth)/kyc.tsx:228`, `:276-361`, `:497-553`
   Expected: KYC input backgrounds, placeholders, borders, and upload cards adapt to both modes.
   Actual: fixed white overlays and placeholder rgba values on image/dark backgrounds.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### MPIN Entry
Status: Failed

Issues Found:
1. Location: `src/app/(auth)/mpin.tsx:315`, `:381`, `:401-403`
   Expected: MPIN dots/keypad states use semantic input/action tokens.
   Actual: fixed white rgba surfaces and borders.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 60 minutes

### MPIN Verify
Status: Failed

Issues Found:
1. Location: `src/app/(auth)/mpin_verify.tsx:93-197`, `:1114-1115`, `:1435-1549`
   Expected: verification alerts, disabled buttons, success/error states, and modals use theme tokens.
   Actual: fixed rgba backgrounds and `#cccccc`, `#dddddd`, `#ffc90c`, `#ffd700`, hardcoded success/error overlays.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 120 minutes

### Forgot MPIN
Status: Failed

Issues Found:
1. Location: `src/app/(auth)/forgot_mpin.tsx:1127-1182`, `:1364`
   Expected: forgot flow background, card, and popup colors derive from active palette.
   Actual: beige fallback `#F2E6D2`, fixed white rgba card, black shadow/overlay.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 75 minutes

### Reset MPIN
Status: Failed

Issues Found:
1. Location: `src/app/(auth)/reset_mpin.tsx:185`, `:208-326`
   Expected: form, disabled state, button gradient, and text use tokens.
   Actual: fixed `#ccc`, `#999`, `#DAA520`, `#B8860B`, `#333`, `#1a1a1a`, `#F8FAFC`.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Set MPIN
Status: Failed

Issues Found:
1. Location: `src/app/(auth)/setmpin.tsx:411-579`
   Expected: MPIN inputs, focus, disabled, error toast, and button text theme-aware.
   Actual: fixed white rgba, `#000000`, `#ffc90c`, `#ff4444`, `#fff`.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Register Complete
Status: Failed

Issues Found:
1. Location: `src/app/(auth)/register/complete.tsx:182-253`, `:322-458`
   Expected: completion error/success/input/button states use semantic tokens.
   Actual: fixed black overlays, `#fff`, `#ffc90c`, `#ffd700`, `#000000`, `#ff4444`.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Home
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/index.tsx:4277`, `:4297`, `:5369`, `:5479-5562`
   Expected: dashboard cards, flash offers, popups, icons, and list items use theme tokens.
   Actual: fixed black overlays, `#111`, `#EFEFEF`, gold rgba, `#E0E0E0`, and mixed `COLORS.dark` aliases.
   Screenshot reference: unavailable
   Priority: Critical
   Estimated Fix Time: 240 minutes

### Dashboard
Status: Failed

Issues Found:
1. Location: `src/app/(app)/dashboard.tsx`
   Expected: dashboard modal and charts/cards adapt to active theme.
   Actual: hardcoded colors present; modal and status bar require theme migration.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 120 minutes

### Dashboard Tab
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/dashboard_tab.tsx`
   Expected: dashboard tab inherits themed tab/page surface.
   Actual: not independently certified; affected by bottom tab/navigation hardcoded colors.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 45 minutes

### Profile / Settings
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/profile.tsx:720-738`, `:865-1096`, `:1249-1806`
   Expected: profile form, settings rows, theme switch, logout/delete dialogs, icons, and placeholders are theme-aware.
   Actual: fixed icon backgrounds, chevrons, switch thumbs, placeholders, error/logout colors, rgba overlays, and fallback hex values.
   Screenshot reference: unavailable
   Priority: Critical
   Estimated Fix Time: 240 minutes

### App Visibility Settings
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/app_visibility.tsx`
   Expected: admin/visibility controls use theme tokens.
   Actual: hardcoded color occurrence found; requires visual check in both modes.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 45 minutes

### Notifications
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/notifications.tsx:82-147`, `:287-313`, `:403-467`, `:746-938`
   Expected: notification categories, unread/read rows, modal, empty/offline states, and status bar are theme-aware.
   Actual: fixed category palettes, light gray list backgrounds, black body text, gray timestamps, fixed modal text/backgrounds.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 180 minutes

### Offers Tab
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/offers_tab.tsx`
   Expected: offer cards/images/text are verified against both themes.
   Actual: not certified independently; affected by shared card and image/overlay color issues.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 45 minutes

### Rewards
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/rewards.tsx:266`
   Expected: status bar and reward surfaces theme-aware.
   Actual: fixed `barStyle="dark-content"` with `backgroundColor="#F2E6D2"` and hardcoded colors elsewhere.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Rewards History
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/rewards_history.tsx:131`
   Expected: history background/status bar adapt to dark/light.
   Actual: fixed beige status bar background and hardcoded colors.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Quick Join
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/quick_join.tsx:37-265`, `:551`
   Expected: quick join modal/cards/dividers use theme colors.
   Actual: fixed rgba overlays, `#EFEFEF`, `#E0E0E0`, and static close icon color aliases.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Join Advance Gold
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/joinAdvGold.tsx:369`, `:825-891`
   Expected: summary cards, buttons, modal overlay, and status bar are theme-aware.
   Actual: fixed `#DAA520`, `#1a1a1a`, black rgba modal overlay, dark-content status bar.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 120 minutes

### Gold Advance
Status: Failed

Issues Found:
1. Location: `src/app/(app)/gold_advance.tsx:341-368`, `:771-811`
   Expected: loading, enquiry modal, inputs, placeholders, and buttons use theme colors.
   Actual: fixed status bar mode, `placeholderTextColor="gray"`, white activity indicator alias, and many hardcoded colors.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 150 minutes

### Old Gold
Status: Failed

Issues Found:
1. Location: `src/app/(app)/old_gold.tsx:627`
   Expected: page/status bar and cards adapt to dark/light.
   Actual: beige fallback status bar and hardcoded colors in screen.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Lucky Draw
Status: Failed

Issues Found:
1. Location: `src/app/(app)/lucky_draw.tsx:519`
   Expected: lucky draw background, status bar, cards, and popups use theme tokens.
   Actual: fixed beige fallback and many hardcoded color occurrences.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 120 minutes

### Bill Payment
Status: Failed

Issues Found:
1. Location: `src/app/(app)/bill_payment.tsx:106-128`, `:505-710`, `:722-905`
   Expected: bill statuses, tabs, empty state, detail modal, terms modal, loading overlay, and pay buttons are theme-aware.
   Actual: fixed status colors, dark-content status bar, beige fallback, black text on detail modal, `#FBFBFB`, `#757575`, `#212121`, fixed disabled/loading colors.
   Screenshot reference: unavailable
   Priority: Critical
   Estimated Fix Time: 240 minutes

### Payment History
Status: Failed

Issues Found:
1. Location: `src/app/(app)/payment-history.tsx:238-270`, `:368-611`
   Expected: history cards, status chips, locked/empty states, and status bar are theme-aware.
   Actual: fixed status colors, beige fallback, fixed black/gray icon colors and text fallbacks.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 150 minutes

### Tickets / Support
Status: Failed

Issues Found:
1. Location: `src/app/(app)/tickets.tsx:162-176`, `:376-518`
   Expected: ticket status, tabs, rows, loading, empty states use theme tokens.
   Actual: fixed green/orange/status colors and black rgba text/backgrounds.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 120 minutes

### Test Notifications
Status: Failed

Issues Found:
1. Location: `src/app/(app)/test-notifications.tsx:44-54`
   Expected: tester screen follows theme or is excluded from production navigation.
   Actual: fixed white background and `#333` text.
   Screenshot reference: unavailable
   Priority: Low
   Estimated Fix Time: 20 minutes

### Savings Index
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/savings/index.tsx:58`
   Expected: savings landing status bar/background are theme-aware.
   Actual: dark-content status bar and beige fallback.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 60 minutes

### My Schemes Content
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/savings/MySchemesContent.tsx`
   Expected: scheme cards, tabs, empty/loading states use theme colors.
   Actual: 116 hardcoded hex/rgba occurrences found.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 180 minutes

### Savings Detail / Investment
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/savings/SavingsDetail.tsx:772-879`, `:1003-1158`, `:1222-1659`
   Expected: investment cards, payment buttons, transaction modal, placeholders, receipts, and empty states are theme-aware.
   Actual: fixed icon backgrounds, `placeholderTextColor="#888"`, success badge, white/black modal text, `#333`, `#666`, `#999`, fixed green.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 210 minutes

### Enhanced Scheme Card
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/savings/EnhancedSchemeCard.tsx`
   Expected: reusable savings card uses theme colors for all card states.
   Actual: 26 hardcoded color occurrences found.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Old Gold Scheme Card
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/savings/OldGoldSchemeCard.tsx`
   Expected: old gold card colors use semantic card/text/status tokens.
   Actual: 41 hardcoded color occurrences found.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Products Details
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/productsdetails.tsx`
   Expected: product detail text/cards/images verified in both themes.
   Actual: hardcoded colors found; image contrast not visually certified.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 45 minutes

### Schemes
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/schemes.tsx:712-819`, `:899-1353`, `:1369-2122`
   Expected: scheme tabs, cards, empty states, modals, branch popup, sticky footer, buttons, and icons use theme colors.
   Actual: fixed gradient palettes, black/white modal text, fixed light backgrounds, fixed gold/blue/green/status colors.
   Screenshot reference: unavailable
   Priority: Critical
   Estimated Fix Time: 300 minutes

### Join Savings
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/join_savings.tsx:1417-1570`, `:4019-4485`
   Expected: form sections, amount/gold selectors, hints, errors, disabled state, and buttons use theme tokens.
   Actual: 202 hardcoded color occurrences including `#FFF`, `#FF8F00`, `#F8F9FA`, `#D1D5DB`, `#FFD700`, `#FFEBEE`, `#D32F2F`.
   Screenshot reference: unavailable
   Priority: Critical
   Estimated Fix Time: 300 minutes

### KYC Home
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/kyc.tsx:405`
   Expected: KYC upload component theme follows active app mode.
   Actual: `themeVariant="light"` forces light variant and blocks dark-mode validation.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 60 minutes

### Offers
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/offers.tsx`
   Expected: offer list/cards and empty state theme-aware.
   Actual: 17 hardcoded color occurrences found.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 60 minutes

### FAQ
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/faq.tsx`
   Expected: FAQ list rows, expand/collapse state, dividers use theme tokens.
   Actual: hardcoded colors found.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 45 minutes

### FAQ Chat
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/faq-chat.tsx`
   Expected: chat bubbles/input/errors use theme tokens.
   Actual: hardcoded colors found; also affected by shared `FloatingChatButton` issues.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Refer and Earn
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/refer_earn.tsx:264-458`, `:560-657`
   Expected: referral cards, reward text, icon tiles, empty states, and share buttons use theme tokens.
   Actual: fixed white/gold/green/red/gray colors and `StatusBar backgroundColor="#fff"`.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 120 minutes

### Rate Chart / Gold Rate / Silver Rate
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/ratechart.tsx`
   Expected: gold/silver rate cards, chart labels, legends, empty/loading states theme-aware.
   Actual: hardcoded color occurrences found.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### DigiGold Payment Calculator
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/digigold_payment_calculator.tsx:39-43`, `:775-913`
   Expected: calculator chart ranges, cards, inputs, gradients use theme/semantic tokens.
   Actual: fixed green range colors, fixed dark/gold/white gradients.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 120 minutes

### Booking History
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/BookingHistory.tsx:37`, `:537-802`
   Expected: booking tabs, cards, progress, empty state, modal, and actions are theme-aware.
   Actual: beige fallback, black rgba text, fixed modal light surfaces, fixed gray/gold/status colors.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 180 minutes

### Payment Overview
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/paymentNewOverView.tsx:1809-1838`, `:2122-2335`
   Expected: payment form, validation, disabled state, and leave-payment modal use theme colors.
   Actual: 66 hardcoded color occurrences including fixed link blue and modal action colors.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 180 minutes

### Payment WebView
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/PaymentWebView.tsx:491`
   Expected: WebView wrapper background/status bar, loading/error states theme-aware.
   Actual: fixed dark-content status bar and beige fallback.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 60 minutes

### Payment Success
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/payment-success.tsx`
   Expected: success icon, labels, receipt actions, and background theme-aware.
   Actual: 26 hardcoded color occurrences found.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Payment Failure
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/payment-failure.tsx`
   Expected: failure icon, error text, retry buttons, and background theme-aware.
   Actual: 24 hardcoded color occurrences found.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Our Stores
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/our_stores.tsx:253`
   Expected: map fallback and store cards use active theme.
   Actual: fixed `backgroundColor: '#111'`; other hardcoded colors found.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 60 minutes

### Store Locator
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/StoreLocator.tsx:47`, `:148-177`, `:289`
   Expected: dropdown, map, back icon, focus border use theme tokens.
   Actual: fixed `#eee`, `#1a2a39`, `#007bff`, `#666`, white overlay.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 75 minutes

### Ticket Form
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/ticket-form.tsx:241-280`, `:336-455`
   Expected: support form input, placeholder, disabled button, loading/error states theme-aware.
   Actual: fixed `#999`, `#ccc`, `#000`, white rgba, hardcoded disabled gradients.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### About
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/(storeInfo)/about_us.tsx`
   Expected: about page background, cards, icons, and API fallback content theme-aware.
   Actual: 31 hardcoded color occurrences found.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 90 minutes

### Contact
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/(storeInfo)/contact_us.tsx:494`
   Expected: contact cards and tint backgrounds use theme tokens.
   Actual: fixed `rgba(133, 1, 17, 0.03)` and other hardcoded colors.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 75 minutes

### Our Policies
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/policies/ourPolicies.tsx:115-239`, `:267-360`
   Expected: loading/error/content cards use theme tokens.
   Actual: fixed burgundy/gold/white/gray palette.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 120 minutes

### Privacy Policy
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/policies/privacyPolicy.tsx:125-137`, `:320-453`
   Expected: loading/error/content colors derive from theme.
   Actual: fixed `#FFD700`, `#850111`, `#5a000b`, `#fff`, rgba borders.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Terms and Conditions
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/home/policies/termsAndConditionsPolicies.tsx:108-111`, `:283-409`
   Expected: loading/error/content colors derive from theme.
   Actual: fixed burgundy/gold/white colors.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 90 minutes

### Navigation Layouts / Bottom Tabs / Drawer
Status: Failed

Issues Found:
1. Location: `src/app/(app)/(tabs)/_layout.tsx:47`, `src/app/(app)/(tabs)/home/_layout.tsx:25-26`, `src/common/components/navigation/CustomBottomBar.tsx:176-318`, `src/common/components/navigation/DrawerContent.tsx:256-692`
   Expected: tab bar, drawer, header, badges, selected states, social/contact icons, and dark-mode toggle are theme-aware.
   Actual: fixed maroon/white/gold/Google/social colors, fixed `tint="dark"`, fixed badge red, fixed drawer item backgrounds.
   Screenshot reference: unavailable
   Priority: Critical
   Estimated Fix Time: 240 minutes

### Reusable Alert / Toast
Status: Failed

Issues Found:
1. Location: `src/components/Alert.tsx`
   Expected: custom modal, buttons, status icons, clipboard toast, and overlay theme-aware.
   Actual: hardcoded color occurrences found; native `Alert.alert` calls are not controllable for theme consistency.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 120 minutes

### Floating Chat / Support Popup
Status: Failed

Issues Found:
1. Location: `src/components/FloatingChatButton.tsx:366-559`, `:618-1033`
   Expected: chat launcher, chat modal, close icons, input, category rows, cancel/submit states all theme-aware.
   Actual: fixed dark/green/gray/white colors, fixed placeholders, fixed modal surfaces and borders.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 180 minutes

### Rating Modal
Status: Failed

Issues Found:
1. Location: `src/components/RatingModal.tsx:252-439`, `:525-635`
   Expected: stars, inputs, modal surface, close icon, submit states use theme tokens.
   Actual: fixed gold/gray/green/orange colors, white modal surface, fixed text colors.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 120 minutes

### Dynamic Scheme Card
Status: Failed

Issues Found:
1. Location: `src/components/DynamicSchemeCard.tsx:488-509`, `:1007-1286`, `:1420-2118`
   Expected: reusable scheme card, detail modal, sticky footer, CTA, loading/disabled state use theme tokens.
   Actual: fixed dark palettes, gold gradients, black text/icons, fixed modal light surfaces and gray text.
   Screenshot reference: unavailable
   Priority: Critical
   Estimated Fix Time: 240 minutes

### Static Schemes Horizontal Scroll
Status: Failed

Issues Found:
1. Location: `src/components/StaticSchemesHorizontalScroll.tsx`
   Expected: repeated scheme cards and modal use shared theme tokens.
   Actual: 68 hardcoded color occurrences found.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 150 minutes

### Product / Rate / Home Reusable Cards
Status: Failed

Issues Found:
1. Location: `src/components/Products.tsx`, `src/components/GoldSilverRateCard.tsx`, `src/components/home/AnimatedGoldRate.tsx`, `src/components/home/UserInfoCard.tsx`, `src/components/LiveRateCard.tsx`
   Expected: cards, images, badges, icons, and skeleton/loading states use active theme.
   Actual: hardcoded color occurrences found, including fixed dark red/gold gradients and white overlays.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 180 minutes

### Loading / Error / Empty State Components
Status: Failed

Issues Found:
1. Location: `src/components/Loader.tsx`, `src/components/EnhancedLoader.tsx`, `src/components/SkeletonLoader.tsx`, `src/components/StatusView.tsx`, `src/components/ForceUpdateScreen.tsx`, `src/components/MaintenanceScreen.tsx`, `src/components/DrawerScreenTemplate.tsx`
   Expected: all loading, empty, force-update, maintenance, story/status, and drawer error states use theme tokens.
   Actual: hardcoded colors found; `StatusView` intentionally uses fixed black/story UI that may not meet white-label mode requirements.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 180 minutes

### WebView / Media Components
Status: Failed

Issues Found:
1. Location: `src/components/VideoPlayer.tsx`, `src/components/YouTubeVideo.tsx`, `src/app/(app)/(tabs)/home/PaymentWebView.tsx`
   Expected: media loading/error overlays and WebView wrappers theme-aware.
   Actual: fixed black/gray/error colors and non-themed text in media states.
   Screenshot reference: unavailable
   Priority: Medium
   Estimated Fix Time: 90 minutes

### Language Selector / Inputs / Buttons
Status: Failed

Issues Found:
1. Location: `src/components/LanguageSelector.tsx`, `src/components/LanguageSwitcher.tsx`, `src/components/PhoneInputs.tsx`, `src/components/ResponsiveButton.tsx`, `src/components/MpinInput.tsx`
   Expected: reusable controls expose semantic color props or derive from active theme.
   Actual: hardcoded color occurrences found in shared controls; these propagate to auth and settings screens.
   Screenshot reference: unavailable
   Priority: High
   Estimated Fix Time: 150 minutes

## Theme Switching Validation

Status: Failed

Issues Found:
1. Location: `src/store/global.store.ts:201-202`, `src/constants/colors.js`, `src/constants/theme.js`
   Expected: light to dark and dark to light update all visible UI without restart, stale cached colors, or flicker.
   Actual: the store toggles `themeMode`, but many styles are static `StyleSheet.create` blocks with fixed literals or `theme.colors.quaternary || '#F2E6D2'` fallbacks. Some modules import non-reactive `theme` directly instead of `useAppTheme`, so stale colors are likely.
   Priority: Critical
   Estimated Fix Time: 240 minutes

## White Label Validation

Status: Failed

Issues Found:
1. Location: entire UI layer
   Expected: all brand colors centralized; no hardcoded black, white, gray, inline colors, or screen-specific palettes.
   Actual: hardcoded colors are widespread. Representative high-risk files by count: `join_savings.tsx` (202), `schemes.tsx` (129), `userBasicDetails.tsx` (118), `MySchemesContent.tsx` (116), `profile.tsx` (90), `home/index.tsx` (87), `lucky_draw.tsx` (89), `digigold_payment_calculator.tsx` (77), `gold_advance.tsx` (72), `DynamicSchemeCard.tsx` (66), `paymentNewOverView.tsx` (66).
   Priority: Critical
   Estimated Fix Time: 3-5 days

## Final Summary

Total Screens Tested: 61 route screens plus reusable components, modals, navigation, loading/error states, and WebView/media wrappers.

Passed Screens: 0

Failed Screens: 61

Total UI Issues: 68 screen/component issue groups, with 2,645 hardcoded `#hex` / `rgba()` color occurrences detected.

Critical Issues: 10

High Priority Issues: 45

Medium Priority Issues: 12

Low Priority Issues: 1

Overall Recommendation: do not begin isolated screen fixes first. Fix the central theme contract and color token naming first, then migrate shared navigation, buttons, inputs, modals, cards, and loading/error components. After shared components are corrected, run a device/simulator pass through every route in both modes and capture screenshots for final QA sign-off.
