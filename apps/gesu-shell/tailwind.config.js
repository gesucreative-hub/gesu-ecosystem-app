/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Lexend Deca"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            colors: {
                // Semantic Tokens (New System)
                tokens: {
                    bg: 'var(--bg)',
                    fg: 'var(--fg)',
                    muted: 'var(--muted)',
                    panel: 'var(--panel)',
                    panel2: 'var(--panel2)',
                    border: 'var(--border)',
                    ring: 'var(--ring)',
                    brand: {
                        DEFAULT: 'var(--brand)',
                        foreground: 'var(--brand-contrast)',
                        hover: 'var(--brand-hover)',
                    },
                    sidebar: {
                        bg: 'var(--sidebar-bg)',
                        fg: 'var(--sidebar-fg)',
                        muted: 'var(--sidebar-muted)',
                        border: 'var(--sidebar-border)',
                        active: 'var(--sidebar-active-bg)',
                        'active-fg': 'var(--sidebar-active-fg)',
                        hover: 'var(--sidebar-hover)',
                    }
                },
                // Gesu Custom Palette (Legacy)
                gesu: {
                    bg: 'var(--gesu-bg)',
                    card: 'var(--gesu-card)',
                    border: 'var(--gesu-border)',
                    primary: 'var(--gesu-primary)',
                    secondary: 'var(--gesu-secondary)',
                    // ... keep existing references safe
                },
                gray: {
                    50: '#f6f6f6',
                    750: '#2d3748',
                    850: '#1a202c',
                    900: '#3d3d3d', // Updated to match palette
                    950: '#292929', // Updated to match palette
                },
                primary: {
                    50: '#eff4fe',
                    700: '#4141b9',
                    950: '#1f1f47',
                    // ... others implied
                },
                secondary: {
                    300: '#a4db74',
                    950: '#15280b',
                },
                accent: {
                    cyan: '#06b6d4',
                    purple: '#a855f7',
                    emerald: '#10b981',
                    rose: '#f43f5e',
                    orange: '#f97316',
                }
            }
        },
    },
    plugins: [],
}
