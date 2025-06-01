import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface UseRealtimeSubscriptionOptions<T> {
  tableName: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onReconnect?: () => void;
  enabled?: boolean;
}

export function useRealtimeSubscription<T>({
  tableName,
  onInsert,
  onUpdate,
  onDelete,
  onReconnect,
  enabled = true
}: UseRealtimeSubscriptionOptions<T>) {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 5000; // Start with 5 seconds

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (channelRef.current) {
      console.log(`Cleaning up realtime subscription for ${tableName}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [tableName]);

  // Store callbacks in refs to avoid dependency changes
  const callbacksRef = useRef({
    onInsert,
    onUpdate,
    onDelete,
    onReconnect
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onInsert,
      onUpdate,
      onDelete,
      onReconnect
    };
  }, [onInsert, onUpdate, onDelete, onReconnect]);

  const setupSubscription = useCallback(() => {
    if (!enabled) return;

    cleanup();
    setConnectionState('connecting');
    setError(null);

    const channelName = `${tableName}-channel-${Date.now()}`;
    const channel = supabase.channel(channelName);

    const eventConfig = { event: '*', schema: 'public', table: tableName };
    
    channel.on('postgres_changes', eventConfig, (payload: RealtimePostgresChangesPayload<T>) => {
      console.log(`Received ${payload.eventType} event for ${tableName}:`, payload);
      
      switch (payload.eventType) {
        case 'INSERT':
          callbacksRef.current.onInsert?.(payload);
          break;
        case 'UPDATE':
          callbacksRef.current.onUpdate?.(payload);
          break;
        case 'DELETE':
          callbacksRef.current.onDelete?.(payload);
          break;
      }
    });

    channel.subscribe((status: string, err?: Error) => {
      console.log(`Subscription status for ${tableName}: ${status}`, err);
      
      if (status === 'SUBSCRIBED') {
        setConnectionState('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        console.log(`Successfully subscribed to ${tableName} changes`);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        const errorMessage = err?.message || status;
        console.error(`Realtime subscription error for ${tableName}: ${errorMessage}`);
        setConnectionState('error');
        setError(`Connection error: ${errorMessage}. Attempting to reconnect...`);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;
          
          console.log(`Scheduling reconnection attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect to ${tableName} (attempt ${reconnectAttemptsRef.current})`);
            setupSubscription();
            callbacksRef.current.onReconnect?.();
          }, delay);
        } else {
          setError(`Failed to connect after ${maxReconnectAttempts} attempts. Please refresh the page.`);
          setConnectionState('disconnected');
        }
      } else if (status === 'CLOSED') {
        setConnectionState('disconnected');
        console.log(`Channel closed for ${tableName}`);
      }
    });

    channelRef.current = channel;
  }, [tableName, enabled, cleanup]);

  // Set up subscription and handle reconnection
  useEffect(() => {
    if (!enabled) return;
    
    setupSubscription();

    // Set up periodic connection check (heartbeat)
    const heartbeatInterval = setInterval(() => {
      if (channelRef.current) {
        // Check if the channel is still active
        const channelState = channelRef.current.state;
        if (channelState === 'closed' || channelState === 'errored') {
          console.log(`Detected disconnected channel for ${tableName}, reconnecting...`);
          setupSubscription();
        }
      }
    }, 30000); // Check every 30 seconds

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Check channel state when page becomes visible
        const channelState = channelRef.current?.state;
        if (channelState === 'closed' || channelState === 'errored') {
          console.log(`Page became visible, reconnecting ${tableName}...`);
          setupSubscription();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanup();
    };
  }, [tableName, enabled, setupSubscription, cleanup]);

  const reconnect = useCallback(() => {
    console.log(`Manual reconnection requested for ${tableName}`);
    reconnectAttemptsRef.current = 0;
    setupSubscription();
  }, [setupSubscription, tableName]);

  return {
    connectionState,
    error,
    reconnect
  };
}