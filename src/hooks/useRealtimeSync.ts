import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UseRealtimeSyncProps {
    table: string;
    onUpdate: () => void;
    enabled?: boolean;
}

/**
 * Hook to force a data refresh when Supabase sends a Realtime event.
 * Filters events based on Soft Delete logic.
 */
export function useRealtimeSync({ table, onUpdate, enabled = true }: UseRealtimeSyncProps) {
    useEffect(() => {
        if (!enabled) return;

        // console.log(`🔌 [Realtime] Subscribing to ${table}...`);

        const channel = supabase
            .channel(`public:${table}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: table,
                },
                (_payload) => {
                    // Soft Delete Logic:
                    // If UPDATE sets deleted_at != null, we must refresh (Item disappeared)
                    // If UPDATE sets deleted_at == null, we must refresh (Item appeared/restored)
                    // If INSERT, we must refresh (New item)

                    // console.log(`⚡ [Realtime] Event on ${table}:`, _payload.eventType);
                    onUpdate();
                }
            )
            .subscribe();

        return () => {
            // console.log(`🔌 [Realtime] Unsubscribing from ${table}...`);
            supabase.removeChannel(channel);
        };
    }, [table, onUpdate, enabled]);
}
