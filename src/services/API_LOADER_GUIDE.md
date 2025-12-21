# API with Enhanced Loader Guide

This guide explains how to use the enhanced API system that automatically shows a beautiful loading animation with a gold GIF for all API calls.

## Features

✨ **Animated Gold GIF Loader** - Uses the `gold_animate.gif` for a premium jewelry business feel
🎯 **Context-Specific Messages** - Different loading messages for different operations
🚀 **Automatic Integration** - All API calls automatically trigger the loader
💎 **Burgundy & Gold Theme** - Consistent with the app's luxury jewelry theme
📱 **Safe Area Support** - Properly handles different device sizes and safe areas

## Quick Start

### 1. Using Pre-defined API Methods

```typescript
import apiWithLoader from '@/services/apiWithLoader';

// Authentication
const loginUser = async (credentials) => {
  try {
    const response = await apiWithLoader.auth.login(credentials);
    // Loader automatically shows "Signing you in..." and hides when done
    return response.data;
  } catch (error) {
    // Loader automatically hides on error
    console.error('Login failed:', error);
  }
};

// Investments
const loadUserInvestments = async (userId) => {
  try {
    const response = await apiWithLoader.investments.getUserInvestments(userId);
    // Shows "Loading your investments..."
    return response.data;
  } catch (error) {
    console.error('Failed to load investments:', error);
  }
};

// Payments
const processPayment = async (paymentData) => {
  try {
    const response = await apiWithLoader.payments.createPayment(paymentData);
    // Shows "Processing payment..."
    return response.data;
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

### 2. Using Generic Methods with Custom Messages

```typescript
import apiWithLoader from '@/services/apiWithLoader';

// Custom GET request
const customGet = async () => {
  try {
    const response = await apiWithLoader.get('/custom-endpoint', 'Loading custom data...');
    return response.data;
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Custom POST request
const customPost = async (data) => {
  try {
    const response = await apiWithLoader.post('/custom-endpoint', data, 'Saving custom data...');
    return response.data;
  } catch (error) {
    console.error('Request failed:', error);
  }
};
```

### 3. Using LoadingService Directly

```typescript
import LoadingService from '@/services/loadingServices';
import api from '@/services/api';

const customApiCall = async () => {
  try {
    // Manual loading control
    LoadingService.show('Custom loading message...');
    
    const response = await api.get('/some-endpoint');
    
    LoadingService.hide();
    return response.data;
  } catch (error) {
    LoadingService.hide(); // Always hide on error
    throw error;
  }
};

// Using the withLoading utility
const anotherApiCall = async () => {
  return LoadingService.withLoading(
    () => api.post('/endpoint', data),
    'Custom message for this operation...'
  );
};
```

## Available API Categories

### 🔐 Authentication
- `apiWithLoader.auth.login(credentials)` - "Signing you in..."
- `apiWithLoader.auth.register(userData)` - "Creating your account..."
- `apiWithLoader.auth.logout()` - "Signing out..."
- `apiWithLoader.auth.verifyMpin(mpin)` - "Verifying MPIN..."

### 💰 Investments
- `apiWithLoader.investments.getUserInvestments(userId)` - "Loading your investments..."
- `apiWithLoader.investments.createInvestment(data)` - "Creating your investment..."
- `apiWithLoader.investments.getInvestmentDetails(id)` - "Loading investment details..."
- `apiWithLoader.investments.checkPayment(payload)` - "Verifying payment status..."

### 💳 Payments
- `apiWithLoader.payments.initiate(data)` - "Initiating payment..."
- `apiWithLoader.payments.createPayment(data)` - "Processing payment..."
- `apiWithLoader.payments.getPaymentHistory(userId)` - "Loading payment history..."

### 📊 Schemes
- `apiWithLoader.schemes.getActiveSchemes()` - "Loading savings schemes..."
- `apiWithLoader.schemes.getSchemeDetails(id)` - "Loading scheme details..."

### 🏆 Gold Rates
- `apiWithLoader.rates.getLiveRates()` - "Updating gold rates..."
- `apiWithLoader.rates.getRateHistory(period)` - "Loading rate history..."

### 📝 Transactions
- `apiWithLoader.transactions.createTransaction(data)` - "Recording transaction..."
- `apiWithLoader.transactions.getUserTransactions(userId)` - "Loading transactions..."

### 👤 User Profile
- `apiWithLoader.user.getProfile()` - "Loading your profile..."
- `apiWithLoader.user.updateProfile(data)` - "Updating your profile..."
- `apiWithLoader.user.updateFcmToken(fcmToken, userId, deviceType)` - "Updating notifications..."

### 📰 Content
- `apiWithLoader.content.getNews()` - "Loading latest news..."
- `apiWithLoader.content.getBanners()` - "Loading banners..."
- `apiWithLoader.content.getVideos()` - "Loading featured video..."
- `apiWithLoader.content.getPolicies(type)` - "Loading policy information..."

### 📋 KYC
- `apiWithLoader.kyc.submitKyc(data)` - "Submitting KYC documents..."
- `apiWithLoader.kyc.getKycStatus(userId)` - "Checking KYC status..."

## Loader Configuration

The enhanced loader includes:

- **Gold Animated GIF** - Uses `assets/images/gold_animate.gif`
- **Rotating Golden Ring** - Elegant outer animation
- **Crown Overlay** - Royal jewelry business touch
- **Sparkle Effects** - Premium visual effects
- **Pulsing Glow** - Smooth breathing animation
- **DC Jewellers Branding** - Professional company branding

## Best Practices

### ✅ Do's
- Use pre-defined methods for common operations
- Provide meaningful loading messages
- Handle errors properly
- Use context-specific messages

### ❌ Don'ts
- Don't nest multiple LoadingService calls
- Don't forget to handle errors (loader auto-hides)
- Don't use generic messages for specific operations
- Don't manually show/hide if using apiWithLoader methods

## Migration from Old API

Replace this:
```typescript
// Old way
LoadingService.show();
const response = await api.get('/endpoint');
LoadingService.hide();
```

With this:
```typescript
// New way
const response = await apiWithLoader.get('/endpoint', 'Loading data...');
```

## Error Handling

The system automatically:
- Hides loader on any error
- Shows appropriate error toasts
- Handles network connectivity issues
- Manages authentication errors

## Customization

To modify loader appearance, edit:
- `src/app/components/EnhancedLoader.tsx` - Main loader component
- `src/services/loadingServices.ts` - Loading service logic
- `src/app/components/GlobalLoadingProvider.tsx` - Global provider

---

**Note**: The loader automatically integrates with all existing API interceptors and provides a seamless user experience across the entire app. 