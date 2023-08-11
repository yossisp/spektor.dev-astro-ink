const { fontFamily } = require('tailwindcss/defaultTheme')
const config = require('./tailwind.theme.config.cjs')
/**
 * Find the applicable theme color palette, or use the default one
 */
const themeConfig = process.env.THEME_KEY && config[process.env.THEME_KEY] ? config[process.env.THEME_KEY] : config.orangecity
const { colors } = themeConfig
module.exports = {
    darkMode: 'class',
    content: [
        './public/**/*.html',
        './src/**/*.{astro,js,ts}'
    ],
    safelist: ['dark'],
    theme: {
		fontFamily: {
			sans: ['Fira Code', ...fontFamily.sans],
		},
		extend: {
            colors: {
                theme: {
                    ...colors
                }
            },
            typography: (theme) => ({
                dark: {
                    css: {
                        color: theme("colors.gray.200"),
                        blockquote: {
                            color: colors.dark.primary,
                            borderColor: colors.primary
                        },
                        'blockquote > p::before, p::after': {
                            color: colors.primary,
                        },
                        '--tw-prose-code': theme('colors.white'),
                        '--tw-prose-strong': theme('colors.white'),
                        '--tw-prose-bold': theme('colors.white'),
                    },
                },
                DEFAULT: {
                    css: {
                        a: {
                            color: colors.primary,
                              '&:hover': {
                                color: colors.secondary,
                              },
                        },
                        blockquote: {
                            color: colors.primary,
                            fontSize: theme("fontSize.2xl"),
                            borderColor: colors.dark.primary,
                        },
                        'blockquote > p::before, p::after': {
                            color: colors.dark.primary,
                        },
                        h1: {
                            color: colors.dark.secondary,
                        },
                        h2: {
                            color: colors.dark.secondary,
                        },
                        h3: {
                            color: colors.dark.secondary,
                        },
                        h4: {
                            color: colors.dark.secondary,
                        },
                        h5x: {
                            color: colors.dark.secondary,
                        },
                    }
                },
            }),
		},
	},
    variants: {
        extend: { typography: ["dark"] }
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/aspect-ratio'),
        require('tailwindcss-hyphens'),
        function ({ addBase, config }) {
            addBase({
              'code': {
                wordWrap: 'break-word',
              },
            });
          },
    ]
};
