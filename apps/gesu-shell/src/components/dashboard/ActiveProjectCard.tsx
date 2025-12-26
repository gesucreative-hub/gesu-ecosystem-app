/**
 * Active Project Card Widget
 * Shows most recently active project with quick open link
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../Card';
import { Folder, ArrowRight } from 'lucide-react';
import { setActiveProject } from '../../stores/projectStore';

interface Project {
    id: string;
    name: string;
    path: string;
}

export function ActiveProjectCard() {
    const { t } = useTranslation('dashboard');
    const [activeProject, setActiveProjectState] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadActiveProject = async () => {
            setLoading(true);
            try {
                if (window.gesu?.projects?.list) {
                    const projects = await window.gesu.projects.list();

                    // Get the first project (most recent)
                    if (projects && projects.length > 0) {
                        setActiveProjectState({
                            id: projects[0].id,
                            name: projects[0].name || projects[0].id,
                            path: projects[0].projectPath
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to load active project:', err);
            } finally {
                setLoading(false);
            }
        };

        loadActiveProject();
    }, []);

    if (loading) {
        return (
            <Card className="p-5 min-h-[120px] flex items-center justify-center">
                <p className="text-xs text-tokens-muted">{t('common:status.loading', 'Loading...')}</p>
            </Card>
        );
    }

    if (!activeProject) {
        return (
            <Card className="p-5 min-h-[120px] flex flex-col items-center justify-center text-center">
                <Folder size={32} className="text-tokens-muted mb-2" />
                <p className="text-xs text-tokens-muted">{t('activeProject.noProjects')}</p>
                <Link
                    to="/initiator"
                    className="mt-2 text-xs text-tokens-brand-DEFAULT hover:underline"
                >
                    {t('activeProject.createFirst')} →
                </Link>
            </Card>
        );
    }

    return (
        <Card className="h-full p-5 bg-gradient-to-br from-slate-500/10 to-slate-500/5 border border-tokens-border/30 hover:border-tokens-brand-DEFAULT/40 transition-all group flex flex-col justify-center">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-tokens-panel2 flex items-center justify-center flex-shrink-0">
                    <Folder size={20} className="text-tokens-brand-DEFAULT" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-tokens-fg mb-1 truncate">
                        {activeProject.name}
                    </h3>
                    <p className="text-xs text-tokens-muted mb-3">
                        {t('activeProject.mostRecent')}
                    </p>
                    <Link
                        to="/initiator"
                        onClick={() => {
                            // Set active project in store before navigating
                            setActiveProject(activeProject.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-tokens-brand-DEFAULT hover:underline"
                    >
                        {t('activeProject.openWorkflow')}
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </Card>
    );
}
