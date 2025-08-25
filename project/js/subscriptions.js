// State
let isDark = localStorage.getItem('theme') === 'dark';

// Plan configurations with Russian prices
const planConfigs = {
    free: {
        name: 'Любители Манги',
        price: 0,
        icon: '📖',
        tier: 'Free',
        features: ['3 главы в день', 'Базовое качество', 'С рекламой']
    },
    basic: {
        name: 'Любители Пика',
        price: 290,
        icon: '🎯', 
        tier: 'Basic',
        features: ['10 глав в день', 'HD качество', 'Без рекламы']
    },
    premium: {
        name: 'Орден Шейхов',
        price: 690,
        icon: '👑',
        tier: 'Premium',
        features: ['Безлимитные главы', '4K качество', 'Ранний доступ', 'Офлайн чтение']
    },
    vip: {
        name: 'Лисямбы',
        price: 1290,
        icon: '🌟',
        tier: 'VIP Max',
        features: ['Все функции Premium', 'Эксклюзивный контент', 'VIP значок', 'Голосование']
    }
};

// Update prices when currency system loads
function updatePlanPrices() {
    if (!window.CurrencySystem) return;
    
    document.querySelectorAll('[data-price]').forEach(element => {
        const rublePrice = parseInt(element.dataset.price);
        if (!isNaN(rublePrice)) {
            element.textContent = window.CurrencySystem.formatAmount(rublePrice);
        }
    });
}

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

// Authentication
function updateAuthState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (isLoggedIn && currentUser) {
        if (authSection) authSection.style.display = 'none';
        if (userSection) userSection.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        if (userName) userName.textContent = currentUser.name || currentUser.username || 'Пользователь';
        if (userEmail) userEmail.textContent = currentUser.email || 'user@example.com';
    } else {
        if (authSection) authSection.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

function login() {
    const name = prompt('Введите ваше имя:') || 'Пользователь';
    const email = prompt('Введите ваш email:') || 'user@example.com';
    
    if (name && email) {
        const userData = { name, email, id: Date.now() };
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        updateAuthState();
        closeMenu();
        
        showNotification(`Добро пожаловать, ${name}!`, 'success');
    }
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        
        updateAuthState();
        closeMenu();
        
        showNotification('Вы успешно вышли из системы', 'success');
    }
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

// Random manga functionality
function openRandomManga() {
    if (window.MangaAPI) {
        const allManga = window.MangaAPI.getAllManga();
        if (allManga.length > 0) {
            const randomManga = allManga[Math.floor(Math.random() * allManga.length)];
            window.location.href = `player.html?id=${randomManga.id}`;
        } else {
            showNotification('Каталог пуст', 'error');
        }
    } else {
        showNotification('Система данных не загружена', 'error');
    }
}

// Select plan function
function selectPlan(planType) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        showNotification('Войдите в аккаунт для оформления подписки', 'error');
        login();
        return;
    }
    
    const plan = planConfigs[planType];
    
    if (planType === 'free') {
        // Activate free plan immediately
        activateSubscription(planType);
        return;
    }
    
    // Создаем платеж и перенаправляем на оплату
    if (window.PaymentSystem) {
        try {
            const payment = window.PaymentSystem.createSubscriptionPayment(planType, plan);
            showNotification('Перенаправление на оплату...', 'info');
            
            setTimeout(() => {
                window.PaymentSystem.redirectToPayment(payment.id);
            }, 1000);
            
        } catch (error) {
            showNotification(error.message, 'error');
        }
    } else {
        showNotification('Система оплаты недоступна', 'error');
    }
}

function activateSubscription(planType) {
    const plan = planConfigs[planType];
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now
    
    const subscription = {
        planType: planType,
        planName: plan.name,
        tier: plan.tier,
        icon: plan.icon,
        features: plan.features,
        price: plan.price,
        activatedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
    };
    
    localStorage.setItem('userSubscription', JSON.stringify(subscription));
    
    showNotification(`Подписка "${plan.name}" активирована!`, 'success');
    
    setTimeout(() => {
        window.location.href = 'cabinet.html';
    }, 2000);
}

function showNotification(message, type = 'success') {
    // Create notification if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-weight: 500;
        `;
        document.body.appendChild(notification);
    }
    
    // Set colors based on type
    const colors = {
        success: { bg: '#10b981', color: 'white' },
        error: { bg: '#ef4444', color: 'white' },
        warning: { bg: '#f59e0b', color: 'white' },
        info: { bg: '#3b82f6', color: 'white' }
    };
    
    const style = colors[type] || colors.success;
    notification.style.background = style.bg;
    notification.style.color = style.color;
    notification.textContent = message;
    notification.classList.add('show');
    
    // Auto hide
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('💎 Подписки: DOM загружен');
    
    // Theme toggles
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);

    // Language switches
    const langSwitch = document.getElementById('langSwitch');
    const mobileLangSwitch = document.getElementById('mobileLangSwitch');
    
    if (langSwitch) {
        langSwitch.addEventListener('change', (e) => updateLanguage(e.target.value));
    }
    if (mobileLangSwitch) {
        mobileLangSwitch.addEventListener('change', (e) => updateLanguage(e.target.value));
    }

    // Profile buttons
    const profileBtn = document.getElementById('profileBtn');
    const mobileProfileBtn = document.getElementById('mobileProfileBtn');
    
    if (profileBtn) profileBtn.addEventListener('click', toggleMenu);
    if (mobileProfileBtn) {
        mobileProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu();
        });
    }

    // Menu overlay
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

    // Initialize
    updateTheme();
    updateAuthState();
    
    // Load saved language
    const savedLang = localStorage.getItem('language') || 'ru';
    updateLanguage(savedLang);
    
    // Check auth state periodically
    setInterval(updateAuthState, 1000);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMenu();
    }
});

// Export functions globally
window.toggleTheme = toggleTheme;
window.updateTheme = updateTheme;
window.updateLanguage = updateLanguage;
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
window.login = login;
window.logout = logout;
window.openRandomManga = openRandomManga;
window.selectPlan = selectPlan;
window.showNotification = showNotification;

console.log('💎 Подписки с исправлениями загружены!');