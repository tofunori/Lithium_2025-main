// frontend/src/hooks/usePerformanceMonitor.ts
import { useEffect, useRef, useCallback, useState } from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  peakRenderTime: number;
  slowRenders: number;
  memoryUsage?: number;
  fps?: number;
}

export interface UsePerformanceMonitorOptions {
  componentName: string;
  slowRenderThreshold?: number;
  enableMemoryTracking?: boolean;
  enableFPSTracking?: boolean;
  onSlowRender?: (metrics: PerformanceMetrics) => void;
  logToConsole?: boolean;
}

export function usePerformanceMonitor({
  componentName,
  slowRenderThreshold = 16, // 16ms = 60fps
  enableMemoryTracking = false,
  enableFPSTracking = false,
  onSlowRender,
  logToConsole = false
}: UsePerformanceMonitorOptions) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);
  const peakRenderTime = useRef<number>(0);
  const slowRenderCount = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const fpsInterval = useRef<NodeJS.Timeout | null>(null);
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    peakRenderTime: 0,
    slowRenders: 0
  });

  // Mark render start
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  // Measure render completion
  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    
    renderCount.current++;
    totalRenderTime.current += renderTime;
    
    if (renderTime > peakRenderTime.current) {
      peakRenderTime.current = renderTime;
    }
    
    if (renderTime > slowRenderThreshold) {
      slowRenderCount.current++;
      
      if (onSlowRender) {
        onSlowRender({
          ...metrics,
          renderTime,
          lastRenderTime: renderTime
        });
      }
    }
    
    const averageRenderTime = totalRenderTime.current / renderCount.current;
    
    const newMetrics: PerformanceMetrics = {
      renderTime,
      renderCount: renderCount.current,
      lastRenderTime: renderTime,
      averageRenderTime,
      peakRenderTime: peakRenderTime.current,
      slowRenders: slowRenderCount.current
    };
    
    // Memory tracking
    if (enableMemoryTracking && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        newMetrics.memoryUsage = memoryInfo.usedJSHeapSize / 1048576; // Convert to MB
      }
    }
    
    setMetrics(newMetrics);
    
    if (logToConsole) {
      console.log(`[Performance] ${componentName}:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        renderCount: renderCount.current,
        averageRenderTime: `${averageRenderTime.toFixed(2)}ms`,
        peakRenderTime: `${peakRenderTime.current.toFixed(2)}ms`,
        slowRenders: slowRenderCount.current,
        memoryUsage: newMetrics.memoryUsage ? `${newMetrics.memoryUsage.toFixed(2)}MB` : 'N/A'
      });
    }
  });

  // FPS tracking
  useEffect(() => {
    if (!enableFPSTracking) return;
    
    let animationFrameId: number;
    
    const measureFPS = (timestamp: number) => {
      if (lastFrameTime.current > 0) {
        const delta = timestamp - lastFrameTime.current;
        frameCount.current++;
      }
      lastFrameTime.current = timestamp;
      animationFrameId = requestAnimationFrame(measureFPS);
    };
    
    animationFrameId = requestAnimationFrame(measureFPS);
    
    // Calculate FPS every second
    fpsInterval.current = setInterval(() => {
      const fps = frameCount.current;
      frameCount.current = 0;
      
      setMetrics(prev => ({ ...prev, fps }));
      
      if (logToConsole && fps < 55) {
        console.warn(`[Performance] ${componentName}: Low FPS detected (${fps})`);
      }
    }, 1000);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (fpsInterval.current) {
        clearInterval(fpsInterval.current);
      }
    };
  }, [enableFPSTracking, componentName, logToConsole]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (logToConsole) {
        console.log(`[Performance] ${componentName} final metrics:`, {
          totalRenders: renderCount.current,
          averageRenderTime: `${(totalRenderTime.current / renderCount.current).toFixed(2)}ms`,
          peakRenderTime: `${peakRenderTime.current.toFixed(2)}ms`,
          slowRenders: slowRenderCount.current,
          slowRenderPercentage: `${((slowRenderCount.current / renderCount.current) * 100).toFixed(1)}%`
        });
      }
    };
  }, [componentName, logToConsole]);

  const resetMetrics = useCallback(() => {
    renderCount.current = 0;
    totalRenderTime.current = 0;
    peakRenderTime.current = 0;
    slowRenderCount.current = 0;
    frameCount.current = 0;
    setMetrics({
      renderTime: 0,
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      peakRenderTime: 0,
      slowRenders: 0
    });
  }, []);

  return {
    metrics,
    resetMetrics
  };
}

// Performance optimization hooks
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const renderCount = useRef(0);
  const changeCount = useRef(0);
  
  useEffect(() => {
    renderCount.current++;
  });
  
  const memoized = useCallback(callback, deps);
  
  useEffect(() => {
    changeCount.current++;
    if (debugName && changeCount.current > 1) {
      console.log(`[Performance] ${debugName} recreated (${changeCount.current} times)`);
    }
  }, [memoized, debugName]);
  
  return memoized;
}

// Lazy loading helper
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options?: {
    delay?: number;
    onError?: (error: Error) => void;
  }
) {
  const [Component, setComponent] = useState<React.ComponentType<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const loadComponent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (options?.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }
        
        const module = await importFn();
        
        if (!cancelled) {
          setComponent(() => module.default);
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Failed to load component');
          setError(error);
          options?.onError?.(error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    
    loadComponent();
    
    return () => {
      cancelled = true;
    };
  }, []);
  
  return { Component, isLoading, error };
}