// Menu System JavaScript - Extracted from your working code
// All original function names and logic preserved

// Global state variables
let isDark = localStorage.getItem('theme') !== 'light';

// Theme functionality
function updateTheme() {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');
    
    if (moonIcon && sunIcon) {
        if (isDark) {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }
    
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
    if (langSwitch) langSwitch.value = lang;
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
    alert('Функция входа будет реализована позже');
}

function logout() {
    // Clear user data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    
    // Refresh page to update UI
    window.location.reload();
}

// Subscription page functionality
function openSubscriptionPage() {
    alert('Страница подписок будет доступна в следующем обновлении!');
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

// Active page detection and highlighting
function setActivePage() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    
    // Set active state for desktop navigation
    const desktopNavLinks = document.querySelectorAll('.desktop-nav .nav-link');
    desktopNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === currentPage) {
            link.classList.add('active');
        }
    });
    
    // Set active state for mobile navigation
    const mobileNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    mobileNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === currentPage) {
            item.classList.add('active');
        }
    });
    
    // Set active state for side menu
    const sideMenuItems = document.querySelectorAll('.side-menu .menu-item');
    sideMenuItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === currentPage) {
            item.classList.add('active');
        }
    });
}

// Initialize menu system
function initializeMenuSystem() {
    // Set up theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Set up language switch
    const langSwitch = document.getElementById('langSwitch');
    if (langSwitch) {
        langSwitch.addEventListener('change', (e) => updateLanguage(e.target.value));
        
        // Load saved language
        const savedLang = localStorage.getItem('language') || 'ru';
        langSwitch.value = savedLang;
    }

    // Set up profile buttons
    const profileBtn = document.getElementById('profileBtn');
    const mobileProfileBtn = document.getElementById('mobileProfileBtn');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', toggleMenu);
    }
    
    if (mobileProfileBtn) {
        mobileProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu();
        });
    }

    // Set up menu overlay
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }

    // Initialize theme and active page
    updateTheme();
    setActivePage();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMenuSystem);
} else {
    initializeMenuSystem();
}

// Export functions for global access (compatibility with existing code)
window.toggleTheme = toggleTheme;
window.updateTheme = updateTheme;
window.updateLanguage = updateLanguage;
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
window.login = login;
window.logout = logout;
window.openSubscriptionPage = openSubscriptionPage;
window.openRandomManga = openRandomManga;