import { useState, useEffect } from 'react';
import { 
    getActivePersona, 
    subscribe, 
    setActivePersona, 
    type Persona 
} from '../stores/personaStore';

/**
 * React hook for persona context
 * Subscribes to personaStore and re-renders on changes
 */
export function usePersona() {
    const [activePersona, setActivePersonaState] = useState<Persona>(getActivePersona());

    useEffect(() => {
        // Subscribe to changes
        const unsubscribe = subscribe(() => {
            setActivePersonaState(getActivePersona());
        });

        // Cleanup on unmount
        return unsubscribe;
    }, []);

    return {
        activePersona,
        setActivePersona // Pass through for convenience
    };
}
