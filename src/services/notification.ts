// services/notification.ts
import Toast from 'react-native-root-toast';
import { theme } from '../constants/theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

let currentToast: any = null;

export const showToast = (
    message: string,
    type: ToastType = 'info',
    duration: number = Toast.durations.LONG
) => {
    let backgroundColor = theme.colors.textDarkGrey;
    let textColor = theme.colors.textPrimary;

    switch (type) {
        case 'success':
            backgroundColor = theme.colors.success;
            break;
        case 'error':
            backgroundColor = theme.colors.error;
            break;
        case 'warning':
            backgroundColor = theme.colors.warning;
            break;
        case 'info':
        default:
            backgroundColor = theme.colors.info;
            break;
    }

    if (currentToast) {
        Toast.hide(currentToast);
        currentToast = null;
    }

    currentToast = Toast.show(message, {
        duration,
        position: Toast.positions.TOP,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
        backgroundColor,
        textColor,
        containerStyle: {
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginHorizontal: 16,
            marginTop: 16,
        },
        textStyle: {
            fontSize: 14,
            fontWeight: '500',
        },
    });
};

export const hideToast = () => {
    if (currentToast) {
        Toast.hide(currentToast);
        currentToast = null;
    }
};