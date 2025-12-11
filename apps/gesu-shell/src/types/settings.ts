export interface GesuSettings {
    paths: {
        workflowRoot: string;
        projectsRoot: string;
        backupRoot: string;
    };
    engines: {
        ytDlpPath: string | null;
        ffmpegPath: string | null;
        imageMagickPath: string | null;
        libreOfficePath: string | null;
    };
    appearance: {
        theme: 'dark' | 'light' | 'system';
        accentColor: string;
        glassmorphism: boolean;
    };
    installPreference?: 'manual' | 'winget' | 'choco' | 'scoop';
}
