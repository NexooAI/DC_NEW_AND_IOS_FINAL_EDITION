import React, { useState, useEffect } from 'react';
import EnhancedLoader from './EnhancedLoader';
import LoadingService from '@/services/loadingServices';

interface GlobalLoadingProviderProps {
  children: React.ReactNode;
}

const GlobalLoadingProvider: React.FC<GlobalLoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  useEffect(() => {
    // Register with the existing loading service
    LoadingService.register((loading: boolean) => {
      setIsLoading(loading);
    });

    // Cleanup
    return () => {
      LoadingService.register(() => { });
    };
  }, []);

  // Method to show loading with custom message
  const showLoading = (message?: string) => {
    if (message) {
      setLoadingMessage(message);
    }
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setLoadingMessage('Loading...');
  };

  // Expose global methods
  React.useEffect(() => {
    // Add global methods to LoadingService
    (LoadingService as any).showWithMessage = showLoading;
    (LoadingService as any).hideLoading = hideLoading;
  }, []);

  return (
    <>
      {children}
      {/* <EnhancedLoader
        visible={isLoading}
        message={loadingMessage}
        size="medium"
        overlay={true}
      /> */}
    </>
  );
};

export default GlobalLoadingProvider; 