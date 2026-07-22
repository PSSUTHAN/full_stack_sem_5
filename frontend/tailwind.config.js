/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#004d99',
                accent: '#ff9900',
                text: '#333333',
                'bg-light': '#f4f4f4',
                'chatbot-user': '#e3f2fd',
                'chatbot-bot': '#f5f5f5',
            },
            fontFamily: {
                sans: ['Arial', 'sans-serif'],
            },
            animation: {
                'slide-up': 'slideUp 0.3s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'pulse-slow': 'pulse 2s infinite',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulse: {
                    '0%, 100%': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' },
                    '50%': { boxShadow: '0 4px 20px rgba(255, 153, 0, 0.6)' },
                }
            }
        },
    },
    plugins: [],
}
