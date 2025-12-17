import { useEffect, useState } from 'react';
import { subscribe as subscribeToTasks } from '../stores/projectHubTasksStore';
import { canAddTask as canAddTaskGuardrail, getRemainingSlots as getRemainingSlotsGuardrail } from '../utils/taskGuardrail';

/**
 * Hook to subscribe to task changes and get reactive task capacity
 * Returns: { canAddTask, remainingSlots }
 */
export function useTaskGuardrail() {
    const [updateTrigger, setUpdateTrigger] = useState(0);

    useEffect(() => {
        // Subscribe to task changes from projectHubTasksStore
        const unsubscribe = subscribeToTasks(() => {
            // Trigger re-render when tasks change
            setUpdateTrigger(prev => prev + 1);
        });

        return unsubscribe;
    }, []);

    // Read fresh values on every render (they reload from localStorage)
    const canAddTask = canAddTaskGuardrail();
    const remainingSlots = getRemainingSlotsGuardrail();

    return { canAddTask, remainingSlots, updateTrigger };
}
