// State management
let state = {
    sortBy: 'popularity',
    isFiltersOpen: false,
    searchQuery: '',
    chaptersFrom: '',
    chaptersTo: '',
    activeFilterPage: 'main',
    selectedGenres: [],
    genreSearchQuery: '',
    selectedCategories: [],
    categorySearchQuery: '',
    selectedStatuses: [],
    isDark: localStorage.getItem('theme') === 'dark'
};

// Function to get status badge class and text
function getStatusBadge(status) {
    const statusMap = {
        'Заморожен': { class: 'status-frozen', text: 'Заморожен' },
        'Завершён': { class: 'status-completed', text: 'Завершён' },
        'Анонс': { class: 'status-announcement', text: 'Анонс' },
        'Выходит': { class: 'status-ongoing', text: 'Выходит' }
    };
    
    return statusMap[status] || { class: 'status-ongoing', text: status };
}

// Theme functionality
function updateTheme() {
    document.body.setAttribute('data-theme', state.isDark ? 'dark' : 'light');
    
    // Update all theme toggle icons
    const updateIcons = (moonClass, sunClass) => {
        const moonIcons = document.querySelectorAll(moonClass);
        const sunIcons = document.querySelectorAll(sunClass);
        
        moonIcons.forEach(icon => {
            icon.style.display = state.isDark ? 'none' : 'block';
        });
        
        sunIcons.forEach(icon => {
            icon.style.display = state.isDark ? 'block' : 'none';
        });
    };
    
    updateIcons('.moon-icon', '.sun-icon');
    updateIcons('.mobile-moon-icon', '.mobile-sun-icon');
    
    localStorage.setItem('theme', state.isDark ? 'dark' : 'light');
}

function toggleTheme() {
    state.isDark = !state.isDark;
    updateTheme();
}

// Language functionality
function updateLanguage(lang) {
    localStorage.setItem('language', lang);
    
    // Sync both language selectors
    const langSwitch = document.getElementById('langSwitch');
    const mobileLangSwitch = document.getElementById('mobileLangSwitch');
    
    if (langSwitch) langSwitch.value = lang;
    if (mobileLangSwitch) mobileLangSwitch.value = lang;
}

// Authentication functionality
function updateAuthState() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const logoutBtn = document.getElementById('logoutBtn');
    const authRequiredCatalog = document.getElementById('authRequiredCatalog');
    const mangaGrid = document.getElementById('mangaGrid');
    const loadingState = document.getElementById('loadingState');
    
    if (isLoggedIn && currentUser) {
        if (authSection) authSection.style.display = 'none';
        if (userSection) userSection.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        // Show catalog content
        if (authRequiredCatalog) authRequiredCatalog.style.display = 'none';
        if (loadingState) loadingState.style.display = 'none';
        if (mangaGrid) mangaGrid.style.display = 'grid';
        
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        if (userName) userName.textContent = currentUser.name || currentUser.username || 'Пользователь';
        if (userEmail) userEmail.textContent = currentUser.email || 'user@example.com';
        
        // Load catalog content
        renderMangaGrid();
    } else {
        if (authSection) authSection.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Hide catalog content for non-logged users
        if (authRequiredCatalog) authRequiredCatalog.style.display = 'block';
        if (loadingState) loadingState.style.display = 'none';
        if (mangaGrid) mangaGrid.style.display = 'none';
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
            alert('Каталог пуст. Добавьте тайтлы через админку!');
        }
    } else {
        alert('Система данных не загружена');
    }
}

// Show auth popup
function showAuthPopup(mode = 'login') {
    login(); // Fallback to simple login for now
}

// Render manga card with color status badges
function renderMangaCard(manga) {
    const currencySystem = window.CurrencySystem;
    const donationCurrent = manga.currentDonations || 0;
    const donationGoal = manga.donationGoal || 10000;
    const donationProgress = (donationCurrent / donationGoal) * 100;
    const statusInfo = getStatusBadge(manga.status);
    const displayRating = manga.rating > 0 ? manga.rating : 'N/A';
    
    return `
        <div class="title-card" data-id="${manga.id}" onclick="openManga('${manga.id}')">
            <div class="cover-container">
                <img src="${manga.image || 'https://via.placeholder.com/300x450/FF6B35/FFFFFF?text=' + encodeURIComponent(manga.title)}" 
                     alt="${manga.title}" 
                     class="cover-image"
                     onerror="this.src='https://via.placeholder.com/300x450/FF6B35/FFFFFF?text=' + encodeURIComponent('${manga.title}')" />
                
                <!-- Badges Container -->
                <div class="card-badges">
                    <!-- Status Badge (left) -->
                    <div class="status-badge-overlay ${statusInfo.class}">
                        ${statusInfo.text}
                    </div>

                    <!-- Rating Badge (right) -->
                    ${manga.rating > 0 ? `
                        <div class="rating-badge">
                            <svg class="star-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            ${displayRating}
                        </div>
                    ` : ''}
                </div>

                ${donationProgress > 0 ? `
                    <div class="donation-progress">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                            <span>🚀 ${donationProgress.toFixed(0)}%</span>
                            <span data-amount="${donationCurrent}">${currencySystem ? currencySystem.formatAmount(donationCurrent) : donationCurrent + '₽'}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(donationProgress, 100)}%"></div>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="card-info">
                <div class="card-meta">
                    <span>${manga.type} ${manga.year}</span>
                </div>
                <h3 class="card-title">${manga.title}</h3>
                <div class="card-meta">
                    <span>Глав: ${manga.availableEpisodes || 0}/${manga.totalEpisodes || 0}</span>
                </div>
                <div class="card-genres">
                    ${manga.genres ? manga.genres.slice(0, 3).map(genre => 
                        `<span class="genre-tag">${genre}</span>`
                    ).join('') : ''}
                </div>
            </div>
        </div>
    `;
}

// Filter and search functions
function getFilteredManga() {
    if (!window.MangaAPI) {
        return [];
    }

    const filters = {
        search: state.searchQuery,
        genres: state.selectedGenres,
        categories: state.selectedCategories,
        statuses: state.selectedStatuses,
        chaptersFrom: state.chaptersFrom,
        chaptersTo: state.chaptersTo,
        sortBy: state.sortBy
    };

    return window.MangaAPI.filterManga(filters);
}

function renderMangaGrid() {
    const filteredData = getFilteredManga();
    const grid = document.getElementById('mangaGrid');
    const noResults = document.getElementById('noResults');
    const resultsInfo = document.getElementById('resultsInfo');
    const loadingState = document.getElementById('loadingState');

    if (!grid) return;

    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        // Show auth required message
        if (loadingState) loadingState.style.display = 'none';
        if (grid) grid.style.display = 'none';
        if (noResults) noResults.style.display = 'none';
        return;
    }

    // Hide loading
    if (loadingState) loadingState.style.display = 'none';
    if (grid) grid.style.display = 'grid';

    if (filteredData.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        if (resultsInfo) resultsInfo.textContent = 'Результатов: 0';
    } else {
        grid.innerHTML = filteredData.map(manga => renderMangaCard(manga)).join('');
        if (noResults) noResults.style.display = 'none';
        if (resultsInfo) resultsInfo.textContent = `Найдено тайтлов: ${filteredData.length}`;
    }
}

// Navigation functions
function openManga(id) {
    // Используем систему контроля доступа
    if (window.AccessControl && !window.AccessControl.checkAndEnforceMangaAccess(id)) {
        return; // Доступ запрещен, система сама покажет нужное сообщение
    }
    
    window.location.href = `player.html?id=${id}`;
}

// Filter sidebar functions
function renderMainFilters() {
    const genres = window.MangaAPI ? window.MangaAPI.getGenres() : [];
    const categories = window.MangaAPI ? window.MangaAPI.getCategories() : [];
    const statuses = window.MangaAPI ? window.MangaAPI.getStatuses() : [];

    return `
        <div class="filter-categories">
            <button class="filter-category-button" onclick="setActiveFilterPage('genres')">
                <span>Жанры ${state.selectedGenres.length > 0 ? `<span class="filter-count">${state.selectedGenres.length}</span>` : ''}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>

            <button class="filter-category-button" onclick="setActiveFilterPage('categories')">
                <span>Категории ${state.selectedCategories.length > 0 ? `<span class="filter-count">${state.selectedCategories.length}</span>` : ''}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>

            <button class="filter-category-button" onclick="setActiveFilterPage('status')">
                <span>Статус ${state.selectedStatuses.length > 0 ? `<span class="filter-count">${state.selectedStatuses.length}</span>` : ''}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        </div>
    `;
}

function renderFilterPage(type, items, selected, searchQuery = '') {
    const filteredItems = items.filter(item => 
        item.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const titles = {
        genres: 'Жанры',
        categories: 'Категории', 
        status: 'Статус'
    };
    const title = titles[type];

    return `
        <div style="display: flex; flex-direction: column; height: 100%;">
            <div class="filter-page-header">
                <button class="back-button" onclick="setActiveFilterPage('main')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    ${title}
                </button>
                <button class="back-button" onclick="clearFilter('${type}')">Сбросить</button>
            </div>

            ${type !== 'status' ? `
            <div class="search-input-container">
                <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input type="text" placeholder="Поиск..." value="${searchQuery}" 
                       class="search-input" onkeyup="updateFilterSearch('${type}', this.value)" />
            </div>
            ` : ''}

            <div class="filter-list">
                ${filteredItems.map(item => `
                    <button class="filter-item" onclick="toggleFilter('${type}', '${item}')">
                        <span class="checkbox">
                            <div class="checkbox-input ${selected.includes(item) ? 'checked' : ''}">
                                ${selected.includes(item) ? `
                                    <svg class="checkmark" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                ` : ''}
                            </div>
                        </span>
                        ${item}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function renderFiltersContent() {
    const content = document.getElementById('filtersContent');
    
    if (!content) return;
    
    if (!window.MangaAPI) {
        content.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка фильтров...</div>';
        return;
    }

    if (state.activeFilterPage === 'main') {
        content.innerHTML = renderMainFilters();
    } else if (state.activeFilterPage === 'genres') {
        content.innerHTML = renderFilterPage('genres', window.MangaAPI.getGenres(), state.selectedGenres, state.genreSearchQuery);
    } else if (state.activeFilterPage === 'categories') {
        content.innerHTML = renderFilterPage('categories', window.MangaAPI.getCategories(), state.selectedCategories, state.categorySearchQuery);
    } else if (state.activeFilterPage === 'status') {
        content.innerHTML = renderFilterPage('status', window.MangaAPI.getStatuses(), state.selectedStatuses);
    }
}

// Filter management functions
function setActiveFilterPage(page) {
    state.activeFilterPage = page;
    if (page === 'main') {
        state.genreSearchQuery = '';
        state.categorySearchQuery = '';
    }
    renderFiltersContent();
}

function updateFilterSearch(type, value) {
    if (type === 'genres') {
        state.genreSearchQuery = value;
    } else if (type === 'categories') {
        state.categorySearchQuery = value;
    }
    renderFiltersContent();
}

function toggleFilter(type, item) {
    if (type === 'genres') {
        if (state.selectedGenres.includes(item)) {
            state.selectedGenres = state.selectedGenres.filter(g => g !== item);
        } else {
            state.selectedGenres.push(item);
        }
    } else if (type === 'categories') {
        if (state.selectedCategories.includes(item)) {
            state.selectedCategories = state.selectedCategories.filter(c => c !== item);
        } else {
            state.selectedCategories.push(item);
        }
    } else if (type === 'status') {
        if (state.selectedStatuses.includes(item)) {
            state.selectedStatuses = state.selectedStatuses.filter(s => s !== item);
        } else {
            state.selectedStatuses.push(item);
        }
    }
    renderFiltersContent();
    renderMangaGrid();
}

function clearFilter(type) {
    if (type === 'genres') {
        state.selectedGenres = [];
    } else if (type === 'categories') {
        state.selectedCategories = [];
    } else if (type === 'status') {
        state.selectedStatuses = [];
    }
    renderFiltersContent();
    renderMangaGrid();
}

function clearAllFilters() {
    state.selectedGenres = [];
    state.selectedCategories = [];
    state.selectedStatuses = [];
    state.searchQuery = '';
    state.chaptersFrom = '';
    state.chaptersTo = '';
    
    const centralSearchInput = document.getElementById('centralSearchInput');
    if (centralSearchInput) centralSearchInput.value = '';
    
    renderFiltersContent();
    renderMangaGrid();
    closeFilters();
}

// UI functions
function openFilters() {
    state.isFiltersOpen = true;
    state.activeFilterPage = 'main';
    document.body.style.overflow = 'hidden';
    
    const filtersBackdrop = document.getElementById('filtersBackdrop');
    const filtersSidebar = document.getElementById('filtersSidebar');
    
    if (filtersBackdrop) filtersBackdrop.classList.add('show');
    if (filtersSidebar) filtersSidebar.classList.add('show');
    
    renderFiltersContent();
}

function closeFilters() {
    state.isFiltersOpen = false;
    state.activeFilterPage = 'main';
    state.genreSearchQuery = '';
    state.categorySearchQuery = '';
    document.body.style.overflow = '';
    
    const filtersBackdrop = document.getElementById('filtersBackdrop');
    const filtersSidebar = document.getElementById('filtersSidebar');
    
    if (filtersBackdrop) filtersBackdrop.classList.remove('show');
    if (filtersSidebar) filtersSidebar.classList.remove('show');
}

// Notification function
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

// Initialize when data is ready
function initializeCatalog() {
    console.log('📚 Инициализация каталога...');
    renderMangaGrid();
    renderFiltersContent();
    console.log('✅ Каталог инициализирован');
}

// Wait for data
function waitForData() {
    if (window.MangaAPI) {
        initializeCatalog();
    } else {
        setTimeout(waitForData, 100);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Каталог: DOM загружен');
    
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

    // Search input
    const centralSearchInput = document.getElementById('centralSearchInput');
    if (centralSearchInput) {
        centralSearchInput.addEventListener('input', function(e) {
            state.searchQuery = e.target.value;
            renderMangaGrid();
        });
    }

    // Sort dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            state.sortBy = e.target.value;
            renderMangaGrid();
        });
    }

    // Filters button
    const filtersButton = document.getElementById('filtersButton');
    if (filtersButton) filtersButton.addEventListener('click', openFilters);

    // Close filters
    const closeSidebar = document.getElementById('closeSidebar');
    const filtersBackdrop = document.getElementById('filtersBackdrop');
    
    if (closeSidebar) closeSidebar.addEventListener('click', closeFilters);
    if (filtersBackdrop) filtersBackdrop.addEventListener('click', closeFilters);

    // Initialize theme and auth
    updateTheme();
    updateAuthState();
    
    // Load saved language
    const savedLang = localStorage.getItem('language') || 'ru';
    updateLanguage(savedLang);

    // Wait for data to be ready
    waitForData();

    // Listen for data updates
    window.addEventListener('mangaDataUpdate', renderMangaGrid);
    window.addEventListener('mangaDataReady', initializeCatalog);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeFilters();
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
window.openManga = openManga;
window.showAuthPopup = showAuthPopup;
window.setActiveFilterPage = setActiveFilterPage;
window.updateFilterSearch = updateFilterSearch;
window.toggleFilter = toggleFilter;
window.clearFilter = clearFilter;
window.clearAllFilters = clearAllFilters;
window.openFilters = openFilters;
window.closeFilters = closeFilters;
window.showNotification = showNotification;

console.log('📦 Каталог с исправлениями загружен!');