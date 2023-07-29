import type{ NavItems } from './types'

export const NAV_ITEMS: NavItems = {
    home: {
        path: '/',
        title: 'home'
    },
    tags: {
        path: '/tags',
        title: 'tags'
    },
    // TODO: add
    // about: {
    //     path: '/about',
    //     title: 'about'
    // }
}

export const SITE = {
    // Your site's detail?
    name: 'Spektor?.dev',
    title: 'Spektor?.dev',
    description: 'This is a blog about nothing by Yossi Spektor',
    url: 'https://spektor.dev',
    githubUrl: 'https://github.com/yossisp',
    listDrafts: true,
    image: 'https://raw.githubusercontent.com/one-aalam/astro-ink/main/public/astro-banner.png',
    // YT video channel Id (used in media.astro)
    ytChannelId: '',
    // Optional, user/author settings (example)
    // Author: name
    author: '', // Example: Fred K. Schott
    // Author: Twitter handler
    authorTwitter: 'SpektorYossi', // Example: FredKSchott
    // Author: Image external source
    authorImage: '', // Example: https://pbs.twimg.com/profile_images/1272979356529221632/sxvncugt_400x400.jpg, https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png
    // Author: Bio
    authorBio: 'Crisp, minimal, personal blog theme for Astro. Crisp, minimal, personal blog theme for Astro. Crisp, minimal, personal blog theme for Astro'
}

// Ink - Theme configuration
export const PAGE_SIZE = 8
export const USE_POST_IMG_OVERLAY = false
export const USE_MEDIA_THUMBNAIL = true

export const USE_AUTHOR_CARD = false
export const USE_SUBSCRIPTION = false /* works only when USE_AUTHOR_CARD is true */
