// src/services/loadingService.ts
type LoadingCallback = (isLoading: boolean) => void;

class LoadingService {
  private static loadingCallback: LoadingCallback | null = null;
  private static currentMessage: string = 'Loading...';

  static register(callback: LoadingCallback): void {
    LoadingService.loadingCallback = callback;
  }

  static show(message?: string): void {
    if (message) {
      LoadingService.currentMessage = message;
    }
    if (LoadingService.loadingCallback) {
      LoadingService.loadingCallback(true);
    }
  }

  static hide(): void {
    if (LoadingService.loadingCallback) {
      LoadingService.loadingCallback(false);
    }
    // Reset message after hiding
    setTimeout(() => {
      LoadingService.currentMessage = 'Loading...';
    }, 300);
  }

  // New enhanced methods
  static showWithMessage(message: string): void {
    LoadingService.show(message);
  }

  static showPaymentLoading(): void {
    LoadingService.show('Processing Payment...');
  }

  static showApiLoading(): void {
    LoadingService.show('Fetching Data...');
  }

  static showSavingLoading(): void {
    LoadingService.show('Saving Information...');
  }

  static showGoldRateLoading(): void {
    LoadingService.show('Updating Gold Rates...');
  }

  static showSchemeLoading(): void {
    LoadingService.show('Loading Schemes...');
  }

  static getCurrentMessage(): string {
    return LoadingService.currentMessage;
  }

  // Utility method for async operations
  static async withLoading<T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> {
    try {
      LoadingService.show(message);
      const result = await operation();
      return result;
    } finally {
      LoadingService.hide();
    }
  }
}

export default LoadingService;
