(function() {
    'use strict';

    const langToggle = document.getElementById('language-toggle');
    const langList = document.getElementById('language-list');
    const langLinks = document.querySelectorAll('.lang-link');

    if (!langToggle || !langList) {
        return;
    }

    // Toggle language list visibility
    langToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const isActive = langList.style.display === 'block';
        langList.style.display = isActive ? 'none' : 'block';
        langToggle.setAttribute('aria-expanded', !isActive);
    });

    // Close language list when clicking outside
    document.addEventListener('click', function() {
        langList.style.display = 'none';
        langToggle.setAttribute('aria-expanded', 'false');
    });

    // Prevent closing when clicking inside the language list
    langList.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Handle language link clicks
    langLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && !this.classList.contains('active')) {
                window.location.href = href;
            }
        });
    });

    // Update language links to preserve current page
    function updateLanguageLinks() {
        const currentPath = window.location.pathname;
        const currentLang = document.documentElement.lang || 'en';

        langLinks.forEach(function(link) {
            const lang = link.getAttribute('data-lang');
            if (!lang) return;

            let href;

            if (lang === 'en') {
                // For English, remove language prefix
                href = currentPath.replace(/^\/zh-CN\//, '/');
                if (href === '' || href === '/') {
                    href = '/';
                }
            } else {
                // For other languages, add language prefix
                if (currentPath.startsWith('/zh-CN/')) {
                    // Already in Chinese, just change to target language
                    href = '/' + lang + currentPath.replace(/^\/zh-CN/, '');
                } else {
                    // In English, add language prefix
                    href = '/' + lang + (currentPath === '/' ? '' : currentPath);
                }
            }

            // Ensure trailing slash for directories
            if (href.match(/\.[a-z]+$/i) === null && href.endsWith('/') === false) {
                href += '/';
            }

            link.setAttribute('href', href);
        });
    }

    // Update links on page load
    updateLanguageLinks();

    // Also update links when sidebar navigation changes (for SPA-like navigation)
    const observer = new MutationObserver(function() {
        updateLanguageLinks();
    });

    const contentDiv = document.getElementById('content');
    if (contentDiv) {
        observer.observe(contentDiv, { childList: true, subtree: true });
    }
})();
