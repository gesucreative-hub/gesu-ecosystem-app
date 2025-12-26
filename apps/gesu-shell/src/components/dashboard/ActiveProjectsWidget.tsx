/**
 * Active Projects Widget
 * Shows recent projects with real progress bars calculated from workflow DoD completion
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../Card';
import { Folder, Plus } from 'lucide-react';
import { getProgressForProject } from '../../stores/workflowProgressStore';

interface Project {
    id: string;
    name: string;
    progress: number; // 0-100
}

export function ActiveProjectsWidget() {
    const { t } = useTranslation('dashboard');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProjects = async () => {
            setLoading(true);
            try {
                if (window.gesu?.projects?.list) {
                    const projectList = await window.gesu.projects.list();

                    // Calculate real progress for each project
                    const projectsWithProgress = projectList.slice(0, 3).map((p: any) => {
                        // Get workflow progress for this project
                        const progress = getProgressForProject(p.id);
                        let progressPercent = 0;

                        if (progress && progress.nodeProgress) {
                            // Count total and completed DoD items across all nodes
                            let totalDoD = 0;
                            let completedDoD = 0;

                            Object.values(progress.nodeProgress).forEach((node: any) => {
                                if (node.dodChecklist) {
                                    Object.values(node.dodChecklist).forEach((done: any) => {
                                        totalDoD++;
                                        if (done) completedDoD++;
                                    });
                                }
                            });

                            // Calculate percentage
                            if (totalDoD > 0) {
                                progressPercent = Math.round((completedDoD / totalDoD) * 100);
                            }
                        }

                        return {
                            id: p.id,
                            name: p.name || p.id,
                            progress: progressPercent,
                        };
                    });

                    setProjects(projectsWithProgress);
                }
            } catch (err) {
                console.error('Failed to load projects:', err);
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, []);

    const getProgressColor = (progress: number) => {
        if (progress >= 70) return 'bg-emerald-500';
        if (progress >= 40) return 'bg-amber-500';
        return 'bg-tokens-brand-DEFAULT';
    };

    return (
        <Card className="h-full p-5 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-tokens-fg uppercase tracking-wider">
                    {t('activeProjects.title')}
                </h3>
                <Link
                    to="/initiator"
                    className="w-6 h-6 rounded-lg bg-tokens-panel2 hover:bg-tokens-brand-DEFAULT/20 flex items-center justify-center transition-colors"
                    title="Add Project"
                >
                    <Plus size={14} className="text-tokens-muted" />
                </Link>
            </div>

            {/* Projects List */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-tokens-muted">{t('common:status.loading', 'Loading...')}</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <Folder size={24} className="text-tokens-muted" />
                    <p className="text-xs text-tokens-muted">{t('activeProject.noProjects')}</p>
                    <Link
                        to="/initiator"
                        className="text-xs text-tokens-brand-DEFAULT hover:underline"
                    >
                        {t('activeProject.createFirst')} →
                    </Link>
                </div>
            ) : (
                <div className="flex-1 space-y-3">
                    {projects.map(project => (
                        <Link
                            key={project.id}
                            to="/initiator"
                            className="block group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-tokens-fg group-hover:text-tokens-brand-DEFAULT transition-colors truncate">
                                    {project.name}
                                </span>
                                <span className="text-xs font-bold text-tokens-muted">
                                    {project.progress}%
                                </span>
                            </div>
                            <div className="h-2 bg-tokens-panel2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${getProgressColor(project.progress)} rounded-full transition-all duration-500`}
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </Card>
    );
}
