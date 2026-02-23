/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                navy: {
                    50: '#f0f4ff',
                    100: '#e0e9ff',
                    200: '#c2d3ff',
                    300: '#94aeff',
                    400: '#6080ff',
                    500: '#3a57ff',
                    600: '#1e35f5',
                    700: '#1728e1',
                    800: '#1a23b6',
                    900: '#1c228f',
                    950: '#111347',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
