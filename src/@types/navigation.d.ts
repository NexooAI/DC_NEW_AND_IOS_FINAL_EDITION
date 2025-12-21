import { UseFirstLaunchHook } from '@/common/hooks/useFirstLaunch';

declare global {
  namespace ReactNavigation {
    interface RootParamList {
      '/': undefined;
      '/(app)': undefined;
      '/(auth)/login': undefined;
      '/(products)': undefined;
      // Add other routes here
    }
  }
}

declare module '@/common/hooks/useFirstLaunch' {
  export type UseFirstLaunchHook = ReturnType<typeof useFirstLaunch>;
}