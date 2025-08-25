// Menu Loader - Universal menu system loader
// This script automatically loads and initializes the menu system on any page

(function() {
    'use strict';
    
    // Configuration
    const MENU_CONFIG = {
        basePath: 'components/', // Path to menu components
        files: {
            html: 'menu.html',
            css: 'menu.css',
            js: 'menu.js'
        }
    };

    // State
    let isLoading = false;
    let isLoaded = false;

    // Utility functions
    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    function loadJS(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    function loadHTML(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.status}`);
                }
                return response.text();
            });
    }

    // Main loader function
    async function loadMenuSystem() {
        if (isLoading || isLoaded) {
            return;
        }

        isLoading = true;

        try {
            console.log('🔄 Loading Light Fox Manga Menu System...');

            // Load CSS first
            await loadCSS(MENU_CONFIG.basePath + MENU_CONFIG.files.css);
            console.log('✅ Menu CSS loaded');

            // Load HTML structure
            const menuHTML = await loadHTML(MENU_CONFIG.basePath + MENU_CONFIG.files.html);
            
            // Insert menu HTML into page
            const menuContainer = document.createElement('div');
            menuContainer.innerHTML = menuHTML;
            
            // Insert at the beginning of body
            document.body.insertBefore(menuContainer.firstElementChild, document.body.firstChild);
            
            // Continue inserting remaining menu elements
            while (menuContainer.firstElementChild) {
                document.body.insertBefore(menuContainer.firstElementChild, document.body.children[1]);
            }
            
            console.log('✅ Menu HTML loaded');

            // Load JavaScript functionality
            await loadJS(MENU_CONFIG.basePath + MENU_CONFIG.files.js);
            console.log('✅ Menu JavaScript loaded');

            // Mark as loaded
            isLoaded = true;
            isLoading = false;

            // Dispatch custom event for other scripts
            window.dispatchEvent(new CustomEvent('menuSystemLoaded', {
                detail: { timestamp: Date.now() }
            }));

            console.log('🎉 Light Fox Manga Menu System loaded successfully!');

        } catch (error) {
            console.error('❌ Failed to load menu system:', error);
            
            // Fallback: create basic menu structure
            createFallbackMenu();
            isLoading = false;
        }
    }

    // Fallback menu in case files can't be loaded
    function createFallbackMenu() {
        console.log('🔄 Creating fallback menu...');
        
        // Create basic header
        const header = document.createElement('header');
        header.className = 'header';
        header.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: #2d2d2d;
            color: white;
            display: flex;
            align-items: center;
            padding: 0 20px;
            z-index: 1000;
            border-bottom: 1px solid #444;
        `;
        
        header.innerHTML = `
            <a href="index.html" style="color: #ff8a50; text-decoration: none; font-weight: bold; font-size: 20px;">
                Light Fox Manga
            </a>
            <nav style="margin-left: auto; display: flex; gap: 20px;">
                <a href="index.html" style="color: white; text-decoration: none;">Главная</a>
                <a href="catalog.html" style="color: white; text-decoration: none;">Каталог</a>
                <a href="cabinet.html" style="color: white; text-decoration: none;">Кабинет</a>
            </nav>
        `;
        
        // Insert header
        document.body.insertBefore(header, document.body.firstChild);
        
        // Add basic body padding
        document.body.style.paddingTop = '60px';
        
        console.log('✅ Fallback menu created');
    }

    // Auto-detect page and set active states
    function setActiveMenuStates() {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        
        // Wait a bit for menu to be fully loaded
        setTimeout(() => {
            // Desktop nav
            const desktopLinks = document.querySelectorAll('.desktop-nav .nav-link');
            desktopLinks.forEach(link => {
                link.classList.remove('active');
                const linkPage = link.getAttribute('href').replace('.html', '').replace('index', '');
                if (linkPage === currentPage || (linkPage === '' && currentPage === 'index')) {
                    link.classList.add('active');
                }
            });

            // Mobile nav
            const mobileLinks = document.querySelectorAll('.bottom-nav .nav-item');
            mobileLinks.forEach(link => {
                link.classList.remove('active');
                const linkPage = link.getAttribute('href')?.replace('.html', '').replace('index', '') || '';
                if (linkPage === currentPage || (linkPage === '' && currentPage === 'index')) {
                    link.classList.add('active');
                }
            });

            // Side menu
            const sideMenuLinks = document.querySelectorAll('.side-menu .menu-item');
            sideMenuLinks.forEach(link => {
                link.classList.remove('active');
                const linkPage = link.getAttribute('href')?.replace('.html', '').replace('index', '') || '';
                if (linkPage === currentPage || (linkPage === '' && currentPage === 'index')) {
                    link.classList.add('active');
                }
            });
        }, 100);
    }

    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadMenuSystem().then(setActiveMenuStates);
            });
        } else {
            loadMenuSystem().then(setActiveMenuStates);
        }
    }

    // Public API
    window.MenuLoader = {
        load: loadMenuSystem,
        isLoaded: () => isLoaded,
        isLoading: () => isLoading
    };

    // Auto-initialize
    init();

})();