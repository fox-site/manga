// Menu Loader - Universal menu system loader
// This script automatically loads and initializes the menu system on any page

(function() {
    'use strict';
    
    // Check if menu is already loaded
    if (window.MenuLoader && window.MenuLoader.isLoaded()) {
        return;
    }

    // Global menu functions that work on all pages
    let isDark = localStorage.getItem('theme') === 'dark';

    // Theme functionality
    function updateTheme() {
        document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        
        const updateIcons = (moonClass, sunClass) => {
            const moonIcons = document.querySelectorAll(moonClass);
            const sunIcons = document.querySelectorAll(sunClass);
            
            moonIcons.forEach(icon => {
                icon.style.display = isDark ? 'none' : 'block';
            });
            
            sunIcons.forEach(icon => {
                icon.style.display = isDark ? 'block' : 'none';
            });
        };
        
        updateIcons('.moon-icon', '.sun-icon');
        updateIcons('.mobile-moon-icon', '.mobile-sun-icon');
        
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    function toggleTheme() {
        isDark = !isDark;
        updateTheme();
    }

    // Language functionality
    function updateLanguage(lang) {
        localStorage.setItem('language', lang);
        
        const langSwitch = document.getElementById('langSwitch');
        const mobileLangSwitch = document.getElementById('mobileLangSwitch');
        
        if (langSwitch) langSwitch.value = lang;
        if (mobileLangSwitch) mobileLangSwitch.value = lang;
    }

    // Menu functionality
    function toggleMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        if (sideMenu && menuOverlay) {
            sideMenu.classList.toggle('open');
            menuOverlay.classList.toggle('show');
        }
    }

    function closeMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        if (sideMenu && menuOverlay) {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('show');
        }
    }

    // Authentication functionality
    function login() {
        const name = prompt('Введите ваше имя:') || 'Пользователь';
        const email = prompt('Введите ваш email:') || 'user@example.com';
        
        if (name && email) {
            const userData = { name, email, id: Date.now() };
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            // Update auth state on current page
            if (typeof window.updateAuthState === 'function') {
                window.updateAuthState();
            }
            
            closeMenu();
            
            // Show notification
            if (typeof window.showNotification === 'function') {
                window.showNotification(`Добро пожаловать, ${name}!`, 'success');
            } else {
                alert(`Добро пожаловать, ${name}!`);
            }
        }
    }

    function logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            
            // Update auth state on current page
            if (typeof window.updateAuthState === 'function') {
                window.updateAuthState();
            }
            
            closeMenu();
            
            // Show notification
            if (typeof window.showNotification === 'function') {
                window.showNotification('Вы успешно вышли из системы', 'success');
            } else {
                alert('Вы успешно вышли из системы');
            }
        }
    }

    // Random manga functionality
    function openRandomManga() {
        if (window.MangaAPI) {
            const allManga = window.MangaAPI.getAllManga();
            if (allManga.length > 0) {
                const randomManga = allManga[Math.floor(Math.random() * allManga.length)];
                window.location.href = `player.html?id=${randomManga.id}`;
            } else {
                alert('Каталог пуст. Добавьте тайтлы через админку!');
            }
        } else {
            alert('Система данных не загружена');
        }
    }

    // Subscription page functionality
    function openSubscriptionPage() {
        window.location.href = 'subscriptions.html';
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
                const linkHref = link.getAttribute('href') || '';
                const linkPage = linkHref.replace('.html', '').replace('index', '');
                if (linkPage === currentPage || (linkPage === '' && currentPage === 'index')) {
                    link.classList.add('active');
                }
            });

            // Mobile nav
            const mobileLinks = document.querySelectorAll('.bottom-nav .nav-item');
            mobileLinks.forEach(link => {
                link.classList.remove('active');
                const linkHref = link.getAttribute('href') || '';
                const linkPage = linkHref.replace('.html', '').replace('index', '');
                if (linkPage === currentPage || (linkPage === '' && currentPage === 'index')) {
                    link.classList.add('active');
                }
            });

            // Side menu
            const sideMenuLinks = document.querySelectorAll('.side-menu .menu-item');
            sideMenuLinks.forEach(link => {
                link.classList.remove('active');
                const linkHref = link.getAttribute('href') || '';
                const linkPage = linkHref.replace('.html', '').replace('index', '');
                if (linkPage === currentPage || (linkPage === '' && currentPage === 'index')) {
                    link.classList.add('active');
                }
            });
        }, 100);
    }

    // Initialize menu system
    function initializeMenuSystem() {
        console.log('🔧 Инициализация системы меню...');
        
        // Set up theme toggles
        const themeToggles = document.querySelectorAll('#themeToggle, #mobileThemeToggle, #mobileSideThemeToggle');
        themeToggles.forEach(toggle => {
            if (toggle && !toggle.hasAttribute('data-menu-listener')) {
                toggle.addEventListener('click', toggleTheme);
                toggle.setAttribute('data-menu-listener', 'true');
            }
        });

        // Set up language switches
        const langSwitches = document.querySelectorAll('#langSwitch, #mobileLangSwitch');
        langSwitches.forEach(langSwitch => {
            if (langSwitch && !langSwitch.hasAttribute('data-menu-listener')) {
                langSwitch.addEventListener('change', (e) => updateLanguage(e.target.value));
                langSwitch.setAttribute('data-menu-listener', 'true');
                
                // Load saved language
                const savedLang = localStorage.getItem('language') || 'ru';
                langSwitch.value = savedLang;
            }
        });

        // Set up profile buttons
        const profileBtns = document.querySelectorAll('#profileBtn, #mobileProfileBtn');
        profileBtns.forEach(btn => {
            if (btn && !btn.hasAttribute('data-menu-listener')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    toggleMenu();
                });
                btn.setAttribute('data-menu-listener', 'true');
            }
        });

        // Set up menu overlay
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay && !menuOverlay.hasAttribute('data-menu-listener')) {
            menuOverlay.addEventListener('click', closeMenu);
            menuOverlay.setAttribute('data-menu-listener', 'true');
        }

        // Initialize theme
        updateTheme();
        setActiveMenuStates();
        
        // Keyboard shortcuts
        if (!document.hasAttribute('data-menu-keyboard')) {
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeMenu();
                }
            });
            document.setAttribute('data-menu-keyboard', 'true');
        }
        
        console.log('✅ Система меню инициализирована');
    }

    // Export functions for global access
    window.toggleTheme = toggleTheme;
    window.updateTheme = updateTheme;
    window.updateLanguage = updateLanguage;
    window.toggleMenu = toggleMenu;
    window.closeMenu = closeMenu;
    window.login = login;
    window.logout = logout;
    window.openSubscriptionPage = openSubscriptionPage;
    window.openRandomManga = openRandomManga;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMenuSystem);
    } else {
        initializeMenuSystem();
    }

    // Mark as loaded
    window.MenuLoader = {
        isLoaded: () => true,
        isLoading: () => false
    };

    console.log('🦊 Light Fox Manga Menu System загружена');

})();