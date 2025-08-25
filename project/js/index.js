// Global state
let isDark = localStorage.getItem('theme') === 'dark';
let currentSlide = 0;
let carouselInterval;

// Sample news data
function getNewsData() {
    const savedNews = localStorage.getItem('lightfox_news_articles');
    if (savedNews) {
        try {
            const parsed = JSON.parse(savedNews);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            console.error('Error loading news:', e);
        }
    }
    
    // Fallback news
    const fallbackNews = [
        {
            id: 1,
            title: "Новая система донатов запущена!",
            excerpt: "Теперь вы можете поддерживать любимые тайтлы и ускорить выход новых глав. Каждый донат приближает вас к новому контенту!",
            createdAt: new Date().toISOString(),
            category: "Обновление"
        },
        {
            id: 2,
            title: "Добавлено 50+ новых тайтлов",
            excerpt: "В каталог добавлены популярные манхва и маньхуа. Откройте для себя новые захватывающие истории!",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            category: "Каталог"
        },
        {
            id: 3,
            title: "Улучшена система уведомлений",
            excerpt: "Теперь вы будете получать уведомления о новых главах ваших любимых тайтлов быстрее и надежнее.",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            category: "Функции"
        }
    ];
    
    localStorage.setItem('lightfox_news_articles', JSON.stringify(fallbackNews));
    return fallbackNews;
}

// Theme functionality
function updateTheme() {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Desktop icons
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');
    
    // Mobile icons
    const mobileMoonIcon = document.querySelector('.mobile-moon-icon');
    const mobileSunIcon = document.querySelector('.mobile-sun-icon');
    
    if (moonIcon && sunIcon) {
        if (isDark) {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }
    
    if (mobileMoonIcon && mobileSunIcon) {
        if (isDark) {
            mobileMoonIcon.style.display = 'none';
            mobileSunIcon.style.display = 'block';
        } else {
            mobileMoonIcon.style.display = 'block';
            mobileSunIcon.style.display = 'none';
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
    const mobileLangSwitch = document.getElementById('mobileLangSwitch');
    if (langSwitch) langSwitch.value = lang;
    if (mobileLangSwitch) mobileLangSwitch.value = lang;
}

// Authentication state
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

function login() {
    const name = prompt('Введите ваше имя:') || 'Пользователь';
    const email = prompt('Введите ваш email:') || 'user@example.com';
    
    if (name && email) {
        const userData = { name, email, id: Date.now() };
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        updateAuthState();
        closeMenu();
        
        // Show notification if function exists
        if (typeof showNotification === 'function') {
            showNotification(`Добро пожаловать, ${name}!`, 'success');
        } else {
            alert(`Добро пожаловать, ${name}!`);
        }
    }
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        
        updateAuthState();
        closeMenu();
        
        if (typeof showNotification === 'function') {
            showNotification('Вы успешно вышли из системы', 'success');
        } else {
            alert('Вы успешно вышли из системы');
        }
    }
}

// Subscription page functionality
function openSubscriptionPage() {
    window.location.href = 'subscriptions.html';
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

// Time formatting
function formatTime(date) {
    const now = new Date();
    const time = new Date(date);
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
    
    return time.toLocaleDateString('ru-RU');
}

// Carousel functionality
function createCarousel() {
    const carouselContainer = document.getElementById('heroCarousel');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    
    if (!carouselContainer || !indicatorsContainer) {
        console.error('Carousel containers not found');
        return;
    }

    // Wait for MangaAPI to be ready
    if (!window.MangaAPI) {
        setTimeout(createCarousel, 500);
        return;
    }

    const allManga = window.MangaAPI.getAllManga();
    const featuredManga = allManga.slice(0, 5); // Top 5 manga for carousel

    if (featuredManga.length === 0) {
        carouselContainer.innerHTML = '<div class="carousel-slide active" style="background: linear-gradient(135deg, #ff8a50, #ff7043); display: flex; align-items: center; justify-content: center; color: white;"><h2>Добро пожаловать в Light Fox Manga!</h2></div>';
        return;
    }

    // Create slides
    carouselContainer.innerHTML = featuredManga.map((manga, index) => `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}" 
             style="background-image: url('${manga.image || 'https://via.placeholder.com/1200x450/FF6B35/FFFFFF?text=' + encodeURIComponent(manga.title)}')">
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <h1 class="slide-title">${manga.title}</h1>
                <p class="slide-description">${manga.description || 'Захватывающая история, которая не оставит вас равнодушными.'}</p>
                <div class="slide-meta">
                    <span class="slide-badge">${manga.type}</span>
                    <span class="slide-badge">⭐ ${manga.rating}</span>
                    <span class="slide-badge">Глав: ${manga.availableEpisodes}/${manga.totalEpisodes}</span>
                </div>
                <div class="slide-actions">
                    <a href="player.html?id=${manga.id}" class="btn btn-primary">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        Читать
                    </a>
                    <button class="btn btn-secondary" onclick="addToFavorites('${manga.id}')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                        В избранное
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Create indicators
    indicatorsContainer.innerHTML = featuredManga.map((_, index) => `
        <div class="indicator ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
    `).join('');

    // Start auto-play
    startCarousel();
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');

    if (slides.length === 0) return;

    slides[currentSlide].classList.remove('active');
    indicators[currentSlide].classList.remove('active');

    currentSlide = index;

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

function nextSlide() {
    const totalSlides = document.querySelectorAll('.carousel-slide').length;
    if (totalSlides === 0) return;
    
    const nextIndex = (currentSlide + 1) % totalSlides;
    goToSlide(nextIndex);
}

function startCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    carouselInterval = setInterval(nextSlide, 5000);
}

function stopCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
}

// Add to favorites function
function addToFavorites(mangaId) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        alert('Войдите в аккаунт для добавления в избранное');
        return;
    }
    
    const manga = window.MangaAPI ? window.MangaAPI.getMangaById(mangaId) : null;
    if (!manga) {
        alert('Тайтл не найден');
        return;
    }
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const exists = favorites.find(item => item.mangaId === mangaId);
    
    if (!exists) {
        favorites.push({
            id: Date.now(),
            mangaId: mangaId,
            title: manga.title,
            image: manga.image,
            addedAt: new Date().toISOString()
        });
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert('Добавлено в избранное!');
    } else {
        alert('Уже в избранном');
    }
}

// Render manga card
function renderMangaCard(manga, showBadge = '') {
    const timeAgo = manga.updatedAt ? formatTime(manga.updatedAt) : formatTime(new Date());
    const displayRating = manga.rating > 0 ? manga.rating : 'N/A';
    const currencySystem = window.CurrencySystem;
    
    return `
        <div class="manga-card" onclick="window.location.href='player.html?id=${manga.id}'">
            <div class="card-image-container">
                <img src="${manga.image || 'https://via.placeholder.com/300x400/FF6B35/FFFFFF?text=' + encodeURIComponent(manga.title.charAt(0))}" 
                     alt="${manga.title}" 
                     class="card-image"
                     onerror="this.src='https://via.placeholder.com/300x400/FF6B35/FFFFFF?text=' + encodeURIComponent('${manga.title.charAt(0)}')">
                <div class="card-badges">
                    ${manga.rating > 0 ? `<span class="badge rating">⭐ ${displayRating}</span>` : ''}
                    ${showBadge === 'new' ? '<span class="badge new">НОВОЕ</span>' : ''}
                    ${showBadge === 'hot' ? '<span class="badge hot">ХИТ</span>' : ''}
                    ${showBadge === 'updated' ? '<span class="badge updated">UPD</span>' : ''}
                </div>
            </div>
            <div class="card-info">
                <h3 class="card-title">${manga.title}</h3>
                <div class="card-meta">
                    <span class="card-chapters">${manga.availableEpisodes || 0}/${manga.totalEpisodes || 0}</span>
                    <span class="card-type">${manga.type}</span>
                </div>
                ${currencySystem ? `
                    <div class="card-donation">
                        <span data-amount="${manga.currentDonations || 0}">${currencySystem.formatAmount(manga.currentDonations || 0)}</span>
                        /
                        <span data-amount="${manga.donationGoal || 10000}">${currencySystem.formatAmount(manga.donationGoal || 10000)}</span>
                    </div>
                ` : ''}
                <div class="card-time">${timeAgo}</div>
            </div>
        </div>
    `;
}

// Load content sections
function loadHotNew() {
    const grid = document.getElementById('hotNewGrid');
    if (!grid) return;

    if (!window.MangaAPI) {
        grid.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка...</div>';
        return;
    }

    const allManga = window.MangaAPI.getAllManga();
    const hotNew = allManga
        .sort((a, b) => new Date(b.year || 0) - new Date(a.year || 0))
        .slice(0, 8);

    if (hotNew.length === 0) {
        grid.innerHTML = '<div class="loading">Нет данных для отображения</div>';
        return;
    }

    grid.innerHTML = hotNew.map(manga => renderMangaCard(manga, 'new')).join('');
}

function loadPopular() {
    const grid = document.getElementById('popularGrid');
    if (!grid) return;

    if (!window.MangaAPI) {
        grid.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка...</div>';
        return;
    }

    const allManga = window.MangaAPI.getAllManga();
    const popular = allManga
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8);

    if (popular.length === 0) {
        grid.innerHTML = '<div class="loading">Нет данных для отображения</div>';
        return;
    }

    grid.innerHTML = popular.map(manga => renderMangaCard(manga, 'hot')).join('');
}

function loadNews() {
    const newsData = getNewsData();
    const grid = document.getElementById('newsGrid');
    
    if (!grid) return;
    
    grid.innerHTML = newsData.map(news => `
        <div class="news-card">
            <h3 class="news-title">${news.title}</h3>
            <p class="news-excerpt">${news.excerpt}</p>
            <div class="news-meta">
                <span class="news-tag">${news.category}</span>
                <span>${formatTime(news.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

function loadRecentUpdates() {
    const list = document.getElementById('updatesList');
    if (!list) return;

    if (!window.MangaAPI) {
        list.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка...</div>';
        return;
    }

    const allManga = window.MangaAPI.getAllManga();
    const recentUpdates = allManga
        .filter(manga => manga.availableEpisodes > 0)
        .sort((a, b) => new Date(b.updatedAt || b.year || 0) - new Date(a.updatedAt || a.year || 0))
        .slice(0, 10);

    if (recentUpdates.length === 0) {
        list.innerHTML = '<div class="loading">Нет обновлений</div>';
        return;
    }

    list.innerHTML = recentUpdates.map(manga => `
        <div class="update-item" onclick="window.location.href='player.html?id=${manga.id}'">
            <img src="${manga.image || 'https://via.placeholder.com/60x80/FF6B35/FFFFFF?text=' + encodeURIComponent(manga.title.charAt(0))}" 
                 alt="${manga.title}" 
                 class="update-image"
                 onerror="this.src='https://via.placeholder.com/60x80/FF6B35/FFFFFF?text=' + encodeURIComponent('${manga.title.charAt(0)}')">
            <div class="update-content">
                <h4 class="update-title">${manga.title}</h4>
                <p class="update-chapter">Глава ${manga.availableEpisodes || 1} • ${manga.type}</p>
                <p class="update-time">${formatTime(manga.updatedAt || new Date())}</p>
            </div>
        </div>
    `).join('');
}

// Initialize homepage
function initializeHomepage() {
    console.log('🏠 Инициализация главной страницы...');
    
    // Load all sections
    createCarousel();
    loadHotNew();
    loadPopular();
    loadNews();
    loadRecentUpdates();
    
    console.log('✅ Главная страница инициализирована');
}

// Wait for data to be ready
function waitForData() {
    if (window.MangaAPI) {
        initializeHomepage();
    } else {
        setTimeout(waitForData, 100);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен, настраиваем обработчики...');
    
    // Theme toggles
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', toggleTheme);
    }

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
    
    if (profileBtn) {
        profileBtn.addEventListener('click', toggleMenu);
    }
    if (mobileProfileBtn) {
        mobileProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu();
        });
    }

    // Menu overlay
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }

    // Initialize theme and auth
    updateTheme();
    updateAuthState();
    
    // Ждем загрузки языковой системы
    setTimeout(() => {
        if (window.LanguageSystem) {
            window.LanguageSystem.translatePage();
        }
    }, 100);

    // Start loading data
    waitForData();

    // Pause carousel on hover
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.addEventListener('mouseenter', stopCarousel);
        heroSection.addEventListener('mouseleave', startCarousel);
    }
});

// Listen for data ready event
window.addEventListener('mangaDataReady', function(e) {
    console.log('📡 Получено событие mangaDataReady');
    initializeHomepage();
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMenu();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    stopCarousel();
});

// Export functions globally
window.toggleTheme = toggleTheme;
window.updateTheme = updateTheme;
window.updateLanguage = updateLanguage;
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
window.login = login;
window.logout = logout;
window.openSubscriptionPage = openSubscriptionPage;
window.openRandomManga = openRandomManga;
window.addToFavorites = addToFavorites;
window.goToSlide = goToSlide;

console.log('🦊 Главная страница Light Fox Manga загружена');