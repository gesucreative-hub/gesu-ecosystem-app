/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Lexend Deca"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            colors: {
                // Gesu Custom Palette (Additive)
                gesu: {
                    bg: 'var(--gesu-bg)',
                    card: 'var(--gesu-card)',
                    border: 'var(--gesu-border)',
                    primary: 'var(--gesu-primary)',
                    secondary: 'var(--gesu-secondary)',
                },
                gray: {
                    750: '#2d3748', // Custom intermediate
                    850: '#1a202c', // Custom dark
                    900: '#111827', // Tailwind default 900
                    950: '#030712', // Ultra dark background
                },
                primary: {
                    50: '#ecfeff',
                    100: '#cffafe',
                    200: '#a5f3fc',
                    300: '#67e8f9',
                    400: '#22d3ee',
                    500: '#06b6d4', // Cyan as primary base
                    600: '#0891b2',
                    700: '#0e7490',
                    800: '#155e75',
                    900: '#164e63',
                },
                secondary: {
                    300: '#fca5a5',
                    500: '#ef4444', // Red/Rose/Orange accent
                    700: '#b91c1c',
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
