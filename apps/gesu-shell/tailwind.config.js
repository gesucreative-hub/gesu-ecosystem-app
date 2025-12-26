/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
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
                    // New semantic tokens
                    popover: 'var(--popover)',
                    'popover-fg': 'var(--popover-fg)',
                    success: 'var(--success)',
                    warning: 'var(--warning)',
                    error: 'var(--error)',
                    'brand-light': 'var(--brand-light)',
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
                    // Theme-aware accent colors (from CSS variables)
                    cyan: 'var(--accent-cyan)',
                    purple: 'var(--accent-purple)',
                    amber: 'var(--accent-amber)',
                    rose: 'var(--accent-rose)',
                    // Legacy fallbacks
                    emerald: '#10b981',
                    orange: '#f97316',
                },
                // Status colors (theme-aware)
                status: {
                    success: 'var(--status-success)',
                    warning: 'var(--status-warning)',
                    error: 'var(--status-error)',
                    info: 'var(--status-info)',
                },
                // Chart/graph colors (theme-aware)
                chart: {
                    primary: 'var(--chart-primary)',
                    secondary: 'var(--chart-secondary)',
                    tertiary: 'var(--chart-tertiary)',
                    positive: 'var(--chart-positive)',
                    negative: 'var(--chart-negative)',
                },
                // Phase colors (consistent across themes)
                phase: {
                    1: 'var(--phase-1)',
                    2: 'var(--phase-2)',
                    3: 'var(--phase-3)',
                    4: 'var(--phase-4)',
                    5: 'var(--phase-5)',
                }
            },
            // Z-index scale
            zIndex: {
                'behind': '-1',
                'base': '0',
                'sticky': '10',
                'sidebar': '20',
                'dropdown': '50',
                'modal': '100',
                'confirm': '200',
                'toast': '9999',
            }
        },
    },
    plugins: [],
}
