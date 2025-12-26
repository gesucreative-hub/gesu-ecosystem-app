// Blueprint Templates - Sprint 21.3 Phase 7
// Ready-to-use blueprint templates for different personas

import { WorkflowBlueprint, WorkflowPhaseDefinition, TemplateCategory } from '../types/workflowBlueprints';

// Phase color palette (consistent across templates)
const PHASE_COLORS = {
    phase1: '#6366f1',  // Indigo
    phase2: '#8b5cf6',  // Purple
    phase3: '#06b6d4',  // Cyan
    phase4: '#10b981',  // Emerald
    phase5: '#f59e0b',  // Amber
};

// --- Phase Definitions for Each Template ---

const ARCHVIZ_PHASES: WorkflowPhaseDefinition[] = [
    { id: 'concept', label: 'Concept', color: PHASE_COLORS.phase1 },
    { id: 'modeling', label: 'Modeling', color: PHASE_COLORS.phase2 },
    { id: 'texturing', label: 'Texturing', color: PHASE_COLORS.phase3 },
    { id: 'lighting', label: 'Lighting', color: PHASE_COLORS.phase4 },
    { id: 'post', label: 'Post', color: PHASE_COLORS.phase5 },
];

const BRAND_DESIGN_PHASES: WorkflowPhaseDefinition[] = [
    { id: 'brief', label: 'Brief', color: PHASE_COLORS.phase1 },
    { id: 'research', label: 'Research', color: PHASE_COLORS.phase2 },
    { id: 'concept', label: 'Concept', color: PHASE_COLORS.phase3 },
    { id: 'design', label: 'Design', color: PHASE_COLORS.phase4 },
    { id: 'delivery', label: 'Delivery', color: PHASE_COLORS.phase5 },
];

const MOTION_GRAPHICS_PHASES: WorkflowPhaseDefinition[] = [
    { id: 'script', label: 'Script', color: PHASE_COLORS.phase1 },
    { id: 'storyboard', label: 'Storyboard', color: PHASE_COLORS.phase2 },
    { id: 'design', label: 'Design', color: PHASE_COLORS.phase3 },
    { id: 'animation', label: 'Animation', color: PHASE_COLORS.phase4 },
    { id: 'export', label: 'Export', color: PHASE_COLORS.phase5 },
];

const UIUX_PHASES: WorkflowPhaseDefinition[] = [
    { id: 'research', label: 'Research', color: PHASE_COLORS.phase1 },
    { id: 'wireframe', label: 'Wireframe', color: PHASE_COLORS.phase2 },
    { id: 'design', label: 'Design', color: PHASE_COLORS.phase3 },
    { id: 'prototype', label: 'Prototype', color: PHASE_COLORS.phase4 },
    { id: 'handoff', label: 'Handoff', color: PHASE_COLORS.phase5 },
];

const WEB_DEV_PHASES: WorkflowPhaseDefinition[] = [
    { id: 'planning', label: 'Planning', color: PHASE_COLORS.phase1 },
    { id: 'design', label: 'Design', color: PHASE_COLORS.phase2 },
    { id: 'development', label: 'Development', color: PHASE_COLORS.phase3 },
    { id: 'testing', label: 'Testing', color: PHASE_COLORS.phase4 },
    { id: 'deploy', label: 'Deploy', color: PHASE_COLORS.phase5 },
];

const APP_DEV_PHASES: WorkflowPhaseDefinition[] = [
    { id: 'requirements', label: 'Requirements', color: PHASE_COLORS.phase1 },
    { id: 'design', label: 'Design', color: PHASE_COLORS.phase2 },
    { id: 'development', label: 'Development', color: PHASE_COLORS.phase3 },
    { id: 'qa', label: 'QA', color: PHASE_COLORS.phase4 },
    { id: 'release', label: 'Release', color: PHASE_COLORS.phase5 },
];

const CONTENT_CREATOR_PHASES: WorkflowPhaseDefinition[] = [
    { id: 'idea', label: 'Idea', color: PHASE_COLORS.phase1 },
    { id: 'script', label: 'Script', color: PHASE_COLORS.phase2 },
    { id: 'production', label: 'Production', color: PHASE_COLORS.phase3 },
    { id: 'edit', label: 'Edit', color: PHASE_COLORS.phase4 },
    { id: 'publish', label: 'Publish', color: PHASE_COLORS.phase5 },
];

const CLIENT_PROJECT_PHASES: WorkflowPhaseDefinition[] = [
    { id: 'brief', label: 'Brief', color: PHASE_COLORS.phase1 },
    { id: 'proposal', label: 'Proposal', color: PHASE_COLORS.phase2 },
    { id: 'execution', label: 'Execution', color: PHASE_COLORS.phase3 },
    { id: 'review', label: 'Review', color: PHASE_COLORS.phase4 },
    { id: 'delivery', label: 'Delivery', color: PHASE_COLORS.phase5 },
];

// --- Template Blueprints ---

export const BLUEPRINT_TEMPLATES: WorkflowBlueprint[] = [
    // CREATIVE CATEGORY
    {
        id: 'tpl-archviz',
        name: 'ArchViz Standard',
        nameKey: 'initiator:templates.archvizStandard',
        categoryId: 'templates',
        version: 1,
        isTemplate: true,
        templateCategory: 'creative',
        phases: ARCHVIZ_PHASES,
        folderTemplateId: 'archviz-standard',
        nodes: [
            { id: 'av-1', phaseId: 'concept', title: 'Reference Collection', description: 'Gather visual references and inspiration', dod: ['References folder organized', 'Mood board created'], tools: ['Pinterest', 'PureRef'] },
            { id: 'av-2', phaseId: 'concept', title: 'Client Brief Review', description: 'Understand client requirements and expectations', dod: ['Brief document reviewed', 'Questions clarified'], tools: ['Notion'] },
            { id: 'av-3', phaseId: 'modeling', title: 'Base Modeling', description: 'Create base 3D geometry', dod: ['Main structures modeled', 'Scale verified'], tools: ['SketchUp', 'Blender', '3ds Max'] },
            { id: 'av-4', phaseId: 'modeling', title: 'Detail Modeling', description: 'Add architectural details and props', dod: ['Details added', 'Geometry cleaned'], tools: ['SketchUp', 'Blender'] },
            { id: 'av-5', phaseId: 'texturing', title: 'Material Setup', description: 'Apply and configure materials', dod: ['Materials assigned', 'UVs checked'], tools: ['D5 Render', 'Substance'] },
            { id: 'av-6', phaseId: 'texturing', title: 'Texture Refinement', description: 'Fine-tune textures and details', dod: ['Textures realistic', 'No seams visible'], tools: ['Photoshop', 'Substance Painter'] },
            { id: 'av-7', phaseId: 'lighting', title: 'Lighting Setup', description: 'Configure scene lighting', dod: ['Key lights placed', 'Mood established'], tools: ['D5 Render', 'Corona'] },
            { id: 'av-8', phaseId: 'lighting', title: 'Camera Setup', description: 'Set up camera angles and composition', dod: ['Cameras positioned', 'Composition balanced'], tools: ['D5 Render'] },
            { id: 'av-9', phaseId: 'post', title: 'Render Output', description: 'Generate final renders', dod: ['Renders completed', 'Quality verified'], tools: ['D5 Render', 'Corona'] },
            { id: 'av-10', phaseId: 'post', title: 'Post-Processing', description: 'Color correction and final touches', dod: ['Colors corrected', 'Final exports ready'], tools: ['Photoshop', 'Lightroom'] },
        ]
    },
    {
        id: 'tpl-brand',
        name: 'Brand Design',
        nameKey: 'initiator:templates.brandDesign',
        categoryId: 'templates',
        version: 1,
        isTemplate: true,
        templateCategory: 'creative',
        phases: BRAND_DESIGN_PHASES,
        folderTemplateId: 'brand-design-standard',
        nodes: [
            { id: 'bd-1', phaseId: 'brief', title: 'Brief Analysis', description: 'Analyze client brief and requirements', dod: ['Brief understood', 'Goals defined'], tools: ['Notion'] },
            { id: 'bd-2', phaseId: 'brief', title: 'Competitor Analysis', description: 'Research competitor brands', dod: ['Competitors identified', 'Gaps found'], tools: ['Figma', 'Notion'] },
            { id: 'bd-3', phaseId: 'research', title: 'Mood Board', description: 'Create visual direction mood board', dod: ['Mood board approved', 'Direction clear'], tools: ['Figma', 'Pinterest'] },
            { id: 'bd-4', phaseId: 'research', title: 'Typography Research', description: 'Explore typography options', dod: ['Fonts shortlisted', 'Pairings tested'], tools: ['Google Fonts', 'Figma'] },
            { id: 'bd-5', phaseId: 'concept', title: 'Logo Concepts', description: 'Sketch initial logo concepts', dod: ['3+ concepts created', 'Best selected'], tools: ['Illustrator', 'Figma'] },
            { id: 'bd-6', phaseId: 'concept', title: 'Color Palette', description: 'Define brand color palette', dod: ['Primary/secondary colors defined', 'Palette documented'], tools: ['Coolors', 'Figma'] },
            { id: 'bd-7', phaseId: 'design', title: 'Logo Refinement', description: 'Refine selected logo concept', dod: ['Logo finalized', 'Variations created'], tools: ['Illustrator'] },
            { id: 'bd-8', phaseId: 'design', title: 'Brand Guidelines', description: 'Document brand usage guidelines', dod: ['Guidelines complete', 'Examples included'], tools: ['Figma', 'InDesign'] },
            { id: 'bd-9', phaseId: 'delivery', title: 'Asset Export', description: 'Export all brand assets', dod: ['All formats exported', 'Files organized'], tools: ['Illustrator', 'Figma'] },
            { id: 'bd-10', phaseId: 'delivery', title: 'Client Handoff', description: 'Deliver to client with documentation', dod: ['Files delivered', 'Feedback addressed'], tools: ['Google Drive'] },
        ]
    },
    {
        id: 'tpl-motion',
        name: 'Motion Graphics',
        nameKey: 'initiator:templates.motionGraphics',
        categoryId: 'templates',
        version: 1,
        isTemplate: true,
        templateCategory: 'creative',
        phases: MOTION_GRAPHICS_PHASES,
        folderTemplateId: 'motion-graphics',
        nodes: [
            { id: 'mg-1', phaseId: 'script', title: 'Script Writing', description: 'Write or review the script', dod: ['Script finalized', 'Timing estimated'], tools: ['Google Docs'] },
            { id: 'mg-2', phaseId: 'script', title: 'Audio Selection', description: 'Select background music and VO', dod: ['Music selected', 'VO recorded'], tools: ['Epidemic Sound'] },
            { id: 'mg-3', phaseId: 'storyboard', title: 'Storyboard Frames', description: 'Create key storyboard frames', dod: ['Key frames drawn', 'Flow approved'], tools: ['Figma', 'Procreate'] },
            { id: 'mg-4', phaseId: 'design', title: 'Style Frames', description: 'Design detailed style frames', dod: ['Style approved', 'Assets listed'], tools: ['Illustrator', 'Figma'] },
            { id: 'mg-5', phaseId: 'design', title: 'Asset Creation', description: 'Create animation-ready assets', dod: ['Assets exported', 'Layers organized'], tools: ['Illustrator', 'Photoshop'] },
            { id: 'mg-6', phaseId: 'animation', title: 'Rough Animation', description: 'Create rough animation pass', dod: ['Timing locked', 'Motion previewed'], tools: ['After Effects'] },
            { id: 'mg-7', phaseId: 'animation', title: 'Final Animation', description: 'Polish and finalize animation', dod: ['Animations smooth', 'Effects added'], tools: ['After Effects'] },
            { id: 'mg-8', phaseId: 'export', title: 'Render & Review', description: 'Render and internal review', dod: ['Render complete', 'Issues fixed'], tools: ['After Effects', 'Media Encoder'] },
            { id: 'mg-9', phaseId: 'export', title: 'Final Export', description: 'Export in all required formats', dod: ['Formats delivered', 'Quality verified'], tools: ['Media Encoder'] },
        ]
    },
    {
        id: 'tpl-uiux',
        name: 'UI/UX Project',
        nameKey: 'initiator:templates.uiuxProject',
        categoryId: 'templates',
        version: 1,
        isTemplate: true,
        templateCategory: 'creative',
        phases: UIUX_PHASES,
        folderTemplateId: 'uiux-project',
        nodes: [
            { id: 'ux-1', phaseId: 'research', title: 'User Research', description: 'Conduct user interviews and surveys', dod: ['Users interviewed', 'Insights documented'], tools: ['Notion', 'Typeform'] },
            { id: 'ux-2', phaseId: 'research', title: 'Competitive Analysis', description: 'Analyze competitor products', dod: ['Competitors reviewed', 'Opportunities identified'], tools: ['Figma', 'Notion'] },
            { id: 'ux-3', phaseId: 'wireframe', title: 'User Flows', description: 'Map user journeys and flows', dod: ['Flows mapped', 'Edge cases covered'], tools: ['FigJam', 'Miro'] },
            { id: 'ux-4', phaseId: 'wireframe', title: 'Lo-Fi Wireframes', description: 'Create low-fidelity wireframes', dod: ['Key screens wireframed', 'Flow validated'], tools: ['Figma'] },
            { id: 'ux-5', phaseId: 'design', title: 'Design System', description: 'Define design tokens and components', dod: ['Tokens defined', 'Components built'], tools: ['Figma'] },
            { id: 'ux-6', phaseId: 'design', title: 'Hi-Fi Designs', description: 'Create high-fidelity mockups', dod: ['All screens designed', 'States covered'], tools: ['Figma'] },
            { id: 'ux-7', phaseId: 'prototype', title: 'Interactive Prototype', description: 'Build interactive prototype', dod: ['Prototype functional', 'Interactions smooth'], tools: ['Figma', 'Protopie'] },
            { id: 'ux-8', phaseId: 'prototype', title: 'User Testing', description: 'Conduct usability testing', dod: ['Tests completed', 'Feedback incorporated'], tools: ['Maze', 'Zoom'] },
            { id: 'ux-9', phaseId: 'handoff', title: 'Dev Handoff', description: 'Prepare specs for development', dod: ['Specs documented', 'Assets exported'], tools: ['Figma', 'Zeplin'] },
        ]
    },

    // DEVELOPMENT CATEGORY
    {
        id: 'tpl-webdev',
        name: 'Web Development',
        nameKey: 'initiator:templates.webDevelopment',
        categoryId: 'templates',
        version: 1,
        isTemplate: true,
        templateCategory: 'development',
        phases: WEB_DEV_PHASES,
        folderTemplateId: 'web-development',
        nodes: [
            { id: 'wd-1', phaseId: 'planning', title: 'Requirements Gathering', description: 'Define project requirements', dod: ['Requirements documented', 'Scope defined'], tools: ['Notion'] },
            { id: 'wd-2', phaseId: 'planning', title: 'Technical Spec', description: 'Write technical specification', dod: ['Stack chosen', 'Architecture defined'], tools: ['Notion', 'draw.io'] },
            { id: 'wd-3', phaseId: 'design', title: 'UI Design', description: 'Design user interface', dod: ['Designs approved', 'Responsive layouts'], tools: ['Figma'] },
            { id: 'wd-4', phaseId: 'design', title: 'Component Design', description: 'Design reusable components', dod: ['Components defined', 'Design system built'], tools: ['Figma'] },
            { id: 'wd-5', phaseId: 'development', title: 'Setup & Scaffolding', description: 'Project setup and configuration', dod: ['Project scaffolded', 'CI/CD configured'], tools: ['VS Code', 'Git'] },
            { id: 'wd-6', phaseId: 'development', title: 'Core Development', description: 'Implement core features', dod: ['Features implemented', 'Code reviewed'], tools: ['VS Code', 'Git'] },
            { id: 'wd-7', phaseId: 'development', title: 'Integration', description: 'Integrate APIs and services', dod: ['APIs connected', 'Data flowing'], tools: ['Postman', 'VS Code'] },
            { id: 'wd-8', phaseId: 'testing', title: 'Unit Testing', description: 'Write and run unit tests', dod: ['Tests passing', 'Coverage adequate'], tools: ['Jest', 'Vitest'] },
            { id: 'wd-9', phaseId: 'testing', title: 'E2E Testing', description: 'End-to-end testing', dod: ['E2E tests passing', 'Critical paths covered'], tools: ['Playwright', 'Cypress'] },
            { id: 'wd-10', phaseId: 'deploy', title: 'Deployment', description: 'Deploy to production', dod: ['Deployed successfully', 'Monitoring active'], tools: ['Vercel', 'AWS'] },
        ]
    },
    {
        id: 'tpl-appdev',
        name: 'App Development',
        nameKey: 'initiator:templates.appDevelopment',
        categoryId: 'templates',
        version: 1,
        isTemplate: true,
        templateCategory: 'development',
        phases: APP_DEV_PHASES,
        folderTemplateId: 'app-development',
        nodes: [
            { id: 'ad-1', phaseId: 'requirements', title: 'Feature Specification', description: 'Define app features', dod: ['Features listed', 'Priority set'], tools: ['Notion', 'Linear'] },
            { id: 'ad-2', phaseId: 'requirements', title: 'Platform Decision', description: 'Choose platforms and tech stack', dod: ['Platforms chosen', 'Stack defined'], tools: ['Notion'] },
            { id: 'ad-3', phaseId: 'design', title: 'App Design', description: 'Design app screens and flows', dod: ['All screens designed', 'Platform guidelines followed'], tools: ['Figma'] },
            { id: 'ad-4', phaseId: 'development', title: 'Core Development', description: 'Build core app functionality', dod: ['Core features working', 'Code reviewed'], tools: ['VS Code', 'Xcode', 'Android Studio'] },
            { id: 'ad-5', phaseId: 'development', title: 'Backend Integration', description: 'Connect to backend services', dod: ['APIs integrated', 'Auth working'], tools: ['Postman', 'Firebase'] },
            { id: 'ad-6', phaseId: 'qa', title: 'Internal Testing', description: 'Internal QA and bug fixes', dod: ['Bugs fixed', 'Performance acceptable'], tools: ['TestFlight', 'Firebase App Distribution'] },
            { id: 'ad-7', phaseId: 'qa', title: 'Beta Testing', description: 'External beta testing', dod: ['Beta feedback incorporated', 'Major issues resolved'], tools: ['TestFlight'] },
            { id: 'ad-8', phaseId: 'release', title: 'Store Submission', description: 'Submit to app stores', dod: ['Store requirements met', 'Submitted successfully'], tools: ['App Store Connect', 'Play Console'] },
            { id: 'ad-9', phaseId: 'release', title: 'Launch & Monitor', description: 'Launch and monitor performance', dod: ['App live', 'Analytics tracking'], tools: ['Firebase', 'Mixpanel'] },
        ]
    },

    // GENERAL CATEGORY
    {
        id: 'tpl-content',
        name: 'Content Creator',
        nameKey: 'initiator:templates.contentCreator',
        categoryId: 'templates',
        version: 1,
        isTemplate: true,
        templateCategory: 'general',
        phases: CONTENT_CREATOR_PHASES,
        folderTemplateId: 'content-creator',
        nodes: [
            { id: 'cc-1', phaseId: 'idea', title: 'Topic Research', description: 'Research trending topics', dod: ['Topic selected', 'Angle defined'], tools: ['YouTube', 'Google Trends'] },
            { id: 'cc-2', phaseId: 'idea', title: 'Outline', description: 'Create content outline', dod: ['Outline complete', 'Key points listed'], tools: ['Notion'] },
            { id: 'cc-3', phaseId: 'script', title: 'Script Writing', description: 'Write detailed script', dod: ['Script finalized', 'Hook strong'], tools: ['Notion', 'Google Docs'] },
            { id: 'cc-4', phaseId: 'production', title: 'Recording', description: 'Record video/audio', dod: ['Recording complete', 'Quality acceptable'], tools: ['Camera', 'OBS'] },
            { id: 'cc-5', phaseId: 'production', title: 'B-Roll & Assets', description: 'Capture supplementary footage', dod: ['B-roll captured', 'Graphics ready'], tools: ['Camera', 'Canva'] },
            { id: 'cc-6', phaseId: 'edit', title: 'Rough Cut', description: 'Create first edit pass', dod: ['Timeline assembled', 'Flow established'], tools: ['Premiere Pro', 'DaVinci'] },
            { id: 'cc-7', phaseId: 'edit', title: 'Final Edit', description: 'Polish and finalize edit', dod: ['Edit complete', 'Audio mixed'], tools: ['Premiere Pro'] },
            { id: 'cc-8', phaseId: 'publish', title: 'Thumbnail & Title', description: 'Create thumbnail and optimize title', dod: ['Thumbnail eye-catching', 'Title SEO-optimized'], tools: ['Photoshop', 'Canva'] },
            { id: 'cc-9', phaseId: 'publish', title: 'Upload & Schedule', description: 'Upload and schedule publication', dod: ['Video uploaded', 'Description complete'], tools: ['YouTube Studio'] },
        ]
    },
    {
        id: 'tpl-client',
        name: 'Client Project',
        nameKey: 'initiator:templates.clientProject',
        categoryId: 'templates',
        version: 1,
        isTemplate: true,
        templateCategory: 'general',
        phases: CLIENT_PROJECT_PHASES,
        folderTemplateId: 'client-project',
        nodes: [
            { id: 'cp-1', phaseId: 'brief', title: 'Client Meeting', description: 'Initial client consultation', dod: ['Requirements gathered', 'Expectations aligned'], tools: ['Zoom', 'Notion'] },
            { id: 'cp-2', phaseId: 'brief', title: 'Scope Definition', description: 'Define project scope and deliverables', dod: ['Scope documented', 'Boundaries clear'], tools: ['Notion'] },
            { id: 'cp-3', phaseId: 'proposal', title: 'Proposal Creation', description: 'Create project proposal', dod: ['Proposal complete', 'Pricing included'], tools: ['Notion', 'Google Docs'] },
            { id: 'cp-4', phaseId: 'proposal', title: 'Contract & Deposit', description: 'Get contract signed and deposit', dod: ['Contract signed', 'Deposit received'], tools: ['DocuSign', 'Stripe'] },
            { id: 'cp-5', phaseId: 'execution', title: 'Project Kickoff', description: 'Start project execution', dod: ['Kickoff meeting held', 'Timeline shared'], tools: ['Notion', 'Slack'] },
            { id: 'cp-6', phaseId: 'execution', title: 'Core Work', description: 'Execute main project work', dod: ['Main work completed', 'Milestones met'], tools: ['Various'] },
            { id: 'cp-7', phaseId: 'review', title: 'Client Review', description: 'Present work for client feedback', dod: ['Feedback received', 'Revisions listed'], tools: ['Zoom', 'Loom'] },
            { id: 'cp-8', phaseId: 'review', title: 'Revisions', description: 'Implement client revisions', dod: ['Revisions complete', 'Client approved'], tools: ['Various'] },
            { id: 'cp-9', phaseId: 'delivery', title: 'Final Delivery', description: 'Deliver final files', dod: ['Files delivered', 'Invoice sent'], tools: ['Google Drive', 'Stripe'] },
            { id: 'cp-10', phaseId: 'delivery', title: 'Project Wrap-up', description: 'Close project and follow-up', dod: ['Payment received', 'Testimonial requested'], tools: ['Notion'] },
        ]
    },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowBlueprint | undefined {
    return BLUEPRINT_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates grouped by category
 */
export function getTemplatesGroupedByCategory(): Record<TemplateCategory, WorkflowBlueprint[]> {
    return {
        creative: BLUEPRINT_TEMPLATES.filter(t => t.templateCategory === 'creative'),
        development: BLUEPRINT_TEMPLATES.filter(t => t.templateCategory === 'development'),
        general: BLUEPRINT_TEMPLATES.filter(t => t.templateCategory === 'general'),
    };
}

/**
 * Create a copy of a template for user customization
 */
export function duplicateTemplate(templateId: string, newName: string): WorkflowBlueprint | null {
    const template = getTemplateById(templateId);
    if (!template) return null;

    const newId = `custom-${Date.now()}`;
    return {
        ...template,
        id: newId,
        name: newName,
        isTemplate: false,  // User copy is not a template
        version: 1,
        categoryId: 'custom',  // User blueprints go to custom category
        nodes: template.nodes.map(node => ({
            ...node,
            id: `${newId}-${node.id}`,  // New unique IDs
        })),
    };
}
