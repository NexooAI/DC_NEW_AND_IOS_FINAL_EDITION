/**
 * Performance monitoring utilities
 * Helps track app performance metrics
 */

import { logger } from './logger';

interface PerformanceMetrics {
    screenLoadTime: number;
    apiResponseTime: number;
    imageLoadTime: number;
    animationFrameRate: number;
}

class PerformanceMonitor {
    private metrics: Partial<PerformanceMetrics> = {};
    private timers: Map<string, number> = new Map();

    /**
     * Start timing an operation
     */
    startTimer(operation: string): void {
        this.timers.set(operation, Date.now());
    }

    /**
     * End timing an operation and log the result
     */
    endTimer(operation: string): number {
        const startTime = this.timers.get(operation);
        if (!startTime) {
            logger.warn(`Timer for ${operation} was not started`);
            return 0;
        }

        const duration = Date.now() - startTime;
        this.timers.delete(operation);

        logger.performance(`${operation} took ${duration}ms`);
        return duration;
    }

    /**
     * Track screen load time
     */
    trackScreenLoad(screenName: string, loadTime: number): void {
        this.metrics.screenLoadTime = loadTime;
        logger.performance(`Screen ${screenName} loaded in ${loadTime}ms`);
    }

    /**
     * Track API response time
     */
    trackApiCall(endpoint: string, responseTime: number): void {
        this.metrics.apiResponseTime = responseTime;
        logger.performance(`API ${endpoint} responded in ${responseTime}ms`);
    }

    /**
     * Track image load time
     */
    trackImageLoad(imageUrl: string, loadTime: number): void {
        this.metrics.imageLoadTime = loadTime;
        logger.performance(`Image ${imageUrl} loaded in ${loadTime}ms`);
    }

    /**
     * Get current performance metrics
     */
    getMetrics(): Partial<PerformanceMetrics> {
        return { ...this.metrics };
    }

    /**
     * Clear all metrics
     */
    clearMetrics(): void {
        this.metrics = {};
        this.timers.clear();
    }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const startTimer = (operation: string) => performanceMonitor.startTimer(operation);
export const endTimer = (operation: string) => performanceMonitor.endTimer(operation);
export const trackScreenLoad = (screenName: string, loadTime: number) =>
    performanceMonitor.trackScreenLoad(screenName, loadTime);
export const trackApiCall = (endpoint: string, responseTime: number) =>
    performanceMonitor.trackApiCall(endpoint, responseTime);
export const trackImageLoad = (imageUrl: string, loadTime: number) =>
    performanceMonitor.trackImageLoad(imageUrl, loadTime);

export default performanceMonitor;
