// State
let isDark = localStorage.getItem('theme') === 'dark';
let currentSection = null;
let showingNotifications = false;
let userLists = {
    favorites: [],
    watching: [],
    wantToWatch: [],
    completed: [],
    subscription: null
};

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

// Authentication functionality
function updateAuthState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const profile = window.ProfileSystem ? window.ProfileSystem.getCurrentUserProfile() : null;
    
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (isLoggedIn && currentUser) {
        if (authSection) authSection.style.display = 'none';
        if (userSection) userSection.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = profile?.username || currentUser.name || currentUser.username || 'Пользователь';
        if (userEmail) userEmail.textContent = profile?.email || currentUser.email || 'user@example.com';
        
        // Обновляем аватар
        if (userAvatar) {
            if (profile?.avatar) {
                userAvatar.innerHTML = `<img src="${profile.avatar}" alt="Аватар" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                const displayName = profile?.username || currentUser.name || 'П';
                userAvatar.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
            }
        }
        
        // Обновляем счетчик уведомлений
        if (window.NotificationSystem) {
            window.NotificationSystem.updateNotificationBadge();
        }
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

// Initialize cabinet
function initializeCabinet() {
    console.log('🏠 Инициализация личного кабинета...');
    
    loadUserLists();
    updateCounts();
    loadDonationProjects();
    
    console.log('✅ Личный кабинет инициализирован');
}

// Load user lists from localStorage
function loadUserLists() {
    Object.keys(userLists).forEach(listName => {
        if (listName === 'subscription') return;
        
        const saved = localStorage.getItem(listName);
        if (saved) {
            try {
                userLists[listName] = JSON.parse(saved);
            } catch (e) {
                console.error(`Error loading ${listName}:`, e);
                userLists[listName] = [];
            }
        }
    });
}

// Update section counts
function updateCounts() {
    Object.keys(userLists).forEach(listName => {
        if (listName === 'subscription') return;
        
        const countElement = document.getElementById(listName + 'Count');
        if (countElement) {
            countElement.textContent = userLists[listName].length;
        }
    });
    
    // Update subscription status
    updateSubscriptionStatus();
}

// Notifications functionality
function openNotifications() {
    currentSection = 'notifications';
    showingNotifications = true;
    
    const dashboardView = document.getElementById('dashboard-view');
    const sectionDetail = document.getElementById('section-detail');
    
    if (dashboardView) dashboardView.style.display = 'none';
    if (sectionDetail) sectionDetail.classList.add('active');
    
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) {
        sectionTitle.textContent = 'Уведомления';
    }
    
    loadNotifications();
}

function loadNotifications() {
    const container = document.getElementById('sectionContent');
    if (!container) return;

    const notifications = window.NotificationSystem ? window.NotificationSystem.getUserNotifications() : [];
    const unreadCount = window.NotificationSystem ? window.NotificationSystem.getUnreadNotifications().length : 0;

    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <div class="empty-title">Нет уведомлений</div>
                <div class="empty-text">Подпишитесь на тайтлы, чтобы получать уведомления о новых сериях</div>
                <a href="catalog.html" class="empty-action">
                    <span>🔍</span>
                    Открыть каталог
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="notifications-header">
            <div class="notifications-stats">
                <span>Всего: ${notifications.length}</span>
                ${unreadCount > 0 ? `<span class="unread-count">Новых: ${unreadCount}</span>` : ''}
            </div>
            ${unreadCount > 0 ? `
                <button class="btn btn-secondary" onclick="markAllNotificationsRead()">
                    Отметить все как прочитанные
                </button>
            ` : ''}
        </div>
        
        <div class="notifications-list">
            ${notifications.map(notification => renderNotificationItem(notification)).join('')}
        </div>
    `;

    // Отмечаем уведомления как прочитанные при просмотре
    setTimeout(() => {
        if (window.NotificationSystem) {
            window.NotificationSystem.markAllAsRead();
        }
    }, 1000);
}

function renderNotificationItem(notification) {
    const timeAgo = formatTime(notification.createdAt);
    const isUnread = !notification.read;
    
    return `
        <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="openNotificationManga('${notification.mangaId}', ${notification.id})">
            <div class="notification-content">
                <div class="notification-header">
                    <img src="${notification.mangaImage || 'https://via.placeholder.com/50x70/FF6B35/FFFFFF?text=' + encodeURIComponent(notification.mangaTitle.charAt(0))}" 
                         alt="${notification.mangaTitle}" 
                         class="notification-manga-image"
                         onerror="this.src='https://via.placeholder.com/50x70/FF6B35/FFFFFF?text=' + encodeURIComponent('${notification.mangaTitle.charAt(0)}')">
                    <div class="notification-info">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    ${isUnread ? '<div class="unread-indicator"></div>' : ''}
                </div>
            </div>
            <button class="notification-delete" onclick="event.stopPropagation(); deleteNotification(${notification.id})">
                ✕
            </button>
        </div>
    `;
}

function openNotificationManga(mangaId, notificationId) {
    if (window.NotificationSystem) {
        window.NotificationSystem.markAsRead(notificationId);
    }
    window.location.href = `player.html?id=${mangaId}`;
}

function deleteNotification(notificationId) {
    if (window.NotificationSystem) {
        window.NotificationSystem.deleteNotification(notificationId);
        loadNotifications();
        showNotification('Уведомление удалено', 'success');
    }
}

function markAllNotificationsRead() {
    if (window.NotificationSystem) {
        window.NotificationSystem.markAllAsRead();
        loadNotifications();
        showNotification('Все уведомления отмечены как прочитанные', 'success');
    }
}

// Profile editing functionality
function openProfileEditor() {
    currentSection = 'profile';
    
    const dashboardView = document.getElementById('dashboard-view');
    const sectionDetail = document.getElementById('section-detail');
    
    if (dashboardView) dashboardView.style.display = 'none';
    if (sectionDetail) sectionDetail.classList.add('active');
    
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) {
        sectionTitle.textContent = 'Редактирование профиля';
    }
    
    loadProfileEditor();
}

function loadProfileEditor() {
    const container = document.getElementById('sectionContent');
    if (!container) return;

    const profile = window.ProfileSystem ? window.ProfileSystem.getCurrentUserProfile() : null;
    if (!profile) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <div class="empty-title">Ошибка загрузки профиля</div>
                <div class="empty-text">Попробуйте перезагрузить страницу</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="profile-editor">
            <div class="profile-avatar-section">
                <div class="current-avatar">
                    ${profile.avatar ? 
                        `<img src="${profile.avatar}" alt="Аватар" class="profile-avatar-img">` :
                        `<div class="profile-avatar-placeholder">${profile.username.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="avatar-controls">
                    <input type="file" id="avatarInput" accept="image/*" style="display: none;" onchange="handleAvatarUpload(this)">
                    <button class="btn btn-primary" onclick="document.getElementById('avatarInput').click()">
                        📷 Загрузить фото
                    </button>
                    ${profile.avatar ? `
                        <button class="btn btn-secondary" onclick="removeAvatar()">
                            🗑️ Удалить фото
                        </button>
                    ` : ''}
                </div>
            </div>

            <form class="profile-form" onsubmit="saveProfile(event)">
                <div class="form-group">
                    <label class="form-label">Имя пользователя</label>
                    <input type="text" class="form-input" id="profileUsername" value="${profile.username}" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="profileEmail" value="${profile.email}" required>
                </div>

                <div class="form-group">
                    <label class="form-label">О себе</label>
                    <textarea class="form-textarea" id="profileBio" rows="3" placeholder="Расскажите о себе...">${profile.bio || ''}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Настройки</label>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <input type="checkbox" id="settingNotifications" ${profile.settings.notifications ? 'checked' : ''}>
                            <label for="settingNotifications">Уведомления о новых сериях</label>
                        </div>
                        <div class="setting-item">
                            <input type="checkbox" id="settingEmailNotifications" ${profile.settings.emailNotifications ? 'checked' : ''}>
                            <label for="settingEmailNotifications">Email уведомления</label>
                        </div>
                    </div>
                </div>

                <div class="profile-stats">
                    <h4>Статистика</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-number">${profile.stats.totalWatched}</span>
                            <span class="stat-label">Просмотрено</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${profile.stats.totalRatings}</span>
                            <span class="stat-label">Оценок</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${profile.stats.totalComments}</span>
                            <span class="stat-label">Комментариев</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${profile.stats.totalDonations}₽</span>
                            <span class="stat-label">Донатов</span>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        💾 Сохранить изменения
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="backToDashboard()">
                        ❌ Отмена
                    </button>
                </div>
            </form>
        </div>
    `;
}

function handleAvatarUpload(input) {
    const file = input.files[0];
    if (!file) return;

    if (window.ProfileSystem) {
        window.ProfileSystem.uploadAvatar(file)
            .then(avatar => {
                showNotification('Аватар обновлен!', 'success');
                loadProfileEditor();
                updateAuthState(); // Обновляем аватар в меню
            })
            .catch(error => {
                showNotification(error.message, 'error');
            });
    }
}

function removeAvatar() {
    if (confirm('Удалить аватар?')) {
        if (window.ProfileSystem) {
            window.ProfileSystem.removeAvatar();
            showNotification('Аватар удален', 'success');
            loadProfileEditor();
            updateAuthState();
        }
    }
}

function saveProfile(e) {
    e.preventDefault();
    
    const updates = {
        username: document.getElementById('profileUsername').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        bio: document.getElementById('profileBio').value.trim(),
        settings: {
            notifications: document.getElementById('settingNotifications').checked,
            emailNotifications: document.getElementById('settingEmailNotifications').checked,
            theme: isDark ? 'dark' : 'light',
            language: localStorage.getItem('language') || 'ru'
        }
    };

    if (window.ProfileSystem) {
        try {
            window.ProfileSystem.updateProfile(updates);
            showNotification('Профиль обновлен!', 'success');
            updateAuthState(); // Обновляем отображение в меню
            backToDashboard();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }
}

// Update subscription status
function updateSubscriptionStatus() {
    const subscription = JSON.parse(localStorage.getItem('userSubscription') || 'null');
    const statusElement = document.getElementById('subscriptionStatus');
    const descriptionElement = document.getElementById('subscriptionDescription');
    
    if (!statusElement || !descriptionElement) return;
    
    if (subscription && new Date(subscription.expiresAt) > new Date()) {
        statusElement.textContent = subscription.planName;
        statusElement.classList.add('active');
        
        const daysLeft = Math.ceil((new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
        descriptionElement.textContent = `Активна до ${new Date(subscription.expiresAt).toLocaleDateString('ru-RU')} (${daysLeft} дней)`;
    } else {
        statusElement.textContent = 'Не активна';
        statusElement.classList.remove('active');
        descriptionElement.textContent = 'Оформите подписку для доступа к премиум контенту';
    }
}

// Load donation projects
function loadDonationProjects() {
    const container = document.getElementById('donationProjectsContainer');
    if (!container) return;

    if (!window.MangaAPI) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Система данных загружается...
            </div>
        `;
        return;
    }

    try {
        // Load donation projects from admin
        const donationProjects = JSON.parse(localStorage.getItem('lightfox_donation_projects') || '[]');
        
        if (donationProjects.length === 0) {
            // Fallback: use manga data
            return loadDonationProjectsFromAPI();
        }

        // Filter active projects with progress < 100%
        const activeProjects = donationProjects.filter(project => {
            if (project.status !== 'active') return false;
            
            const progress = (project.currentAmount / project.goal) * 100;
            return progress < 100;
        }).slice(0, 6);

        if (activeProjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎉</div>
                    <div class="empty-title">Все цели достигнуты!</div>
                    <div class="empty-text">Спасибо за поддержку проектов</div>
                </div>
            `;
            return;
        }

        const projectsHTML = activeProjects.map(project => renderDonationProjectCard(project)).join('');
        container.innerHTML = `
            <div class="donation-projects">
                ${projectsHTML}
            </div>
        `;

    } catch (error) {
        console.error('Error loading donation projects:', error);
        loadDonationProjectsFromAPI();
    }
}

// Fallback function for compatibility
function loadDonationProjectsFromAPI() {
    const container = document.getElementById('donationProjectsContainer');
    if (!container) return;
    
    const allManga = window.MangaAPI.getAllManga();

    if (!allManga || allManga.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <div class="empty-title">Пока нет проектов</div>
                <div class="empty-text">Тайтлы для поддержки появятся здесь</div>
                <a href="catalog.html" class="empty-action">
                    <span>🔍</span>
                    Открыть каталог
                </a>
            </div>
        `;
        return;
    }

    // Filter manga with incomplete donations
    const activeProjects = allManga.filter(manga => {
        const current = manga.currentDonations || 0;
        const goal = manga.donationGoal || 10000;
        const progress = (current / goal) * 100;
        return progress < 100;
    }).slice(0, 6);

    if (activeProjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <div class="empty-title">Все цели достигнуты!</div>
                <div class="empty-text">Спасибо за поддержку проектов</div>
            </div>
        `;
        return;
    }

    const projectsHTML = activeProjects.map(manga => renderDonationCard(manga)).join('');
    container.innerHTML = `
        <div class="donation-projects">
            ${projectsHTML}
        </div>
    `;
}

// Render donation project card
function renderDonationProjectCard(project) {
    if (!project) return '';

    const manga = window.MangaAPI ? window.MangaAPI.getMangaById(project.mangaId) : null;
    
    const progress = Math.min((project.currentAmount / project.goal) * 100, 100);
    const title = project.title || 'Неизвестный проект';
    const mangaTitle = manga ? manga.title : 'Неизвестная манга';
    const type = manga ? manga.type : 'Проект';
    const year = manga ? manga.year : '';
    
    const image = project.image || 
                 (manga ? manga.image : null) || 
                 `https://via.placeholder.com/60x80/8b5cf6/FFFFFF?text=${encodeURIComponent(title.charAt(0))}`;

    return `
        <div class="donation-card">
            <div class="donation-header">
                <img src="${image}" 
                     alt="${title}" 
                     class="donation-poster"
                     onerror="this.src='https://via.placeholder.com/60x80/8b5cf6/FFFFFF?text=${encodeURIComponent(title.charAt(0))}'">
                <div class="donation-info">
                    <h3>${title}</h3>
                    <div class="donation-meta">${type}${year ? ` • ${year}` : ''}</div>
                    ${project.description ? `<div style="font-size: 0.75rem; color: var(--secondary-color); margin-top: 4px;">${project.description}</div>` : ''}
                </div>
            </div>
            
            <div class="donation-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">
                    <span>${project.currentAmount.toLocaleString()}₽</span>
                    <span>${project.goal.toLocaleString()}₽</span>
                </div>
            </div>

            <div class="donation-input-group">
                <input type="number" class="donation-input" 
                       placeholder="Сумма" min="10" max="50000" 
                       id="donationAmountProject${project.id}">
                <button class="donate-btn" onclick="makeDonationToProject(${project.id})">💝 Донат</button>
            </div>

            <div class="donation-quick-buttons">
                <button class="quick-donate-btn" onclick="quickDonateToProject(${project.id}, 100)">100₽</button>
                <button class="quick-donate-btn" onclick="quickDonateToProject(${project.id}, 500)">500₽</button>
                <button class="quick-donate-btn" onclick="quickDonateToProject(${project.id}, 1000)">1K₽</button>
            </div>
        </div>
    `;
}

// Render manga donation card
function renderDonationCard(manga) {
    if (!manga) return '';

    const current = manga.currentDonations || 0;
    const goal = manga.donationGoal || 10000;
    const progress = Math.min((current / goal) * 100, 100);
    const title = manga.title || 'Неизвестный тайтл';
    const type = manga.type || 'Манга';
    const year = manga.year || 'N/A';
    const image = manga.image || `https://via.placeholder.com/60x80/FF6B35/FFFFFF?text=${encodeURIComponent(title.charAt(0))}`;

    return `
        <div class="donation-card">
            <div class="donation-header">
                <img src="${image}" 
                     alt="${title}" 
                     class="donation-poster"
                     onerror="this.src='https://via.placeholder.com/60x80/FF6B35/FFFFFF?text=${encodeURIComponent(title.charAt(0))}'">
                <div class="donation-info">
                    <h3>${title}</h3>
                    <div class="donation-meta">${type} • ${year}</div>
                </div>
            </div>
            
            <div class="donation-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">
                    <span>${current.toLocaleString()}₽</span>
                    <span>${goal.toLocaleString()}₽</span>
                </div>
            </div>

            <div class="donation-input-group">
                <input type="number" class="donation-input" 
                       placeholder="Сумма" min="10" max="50000" 
                       id="donationAmount${manga.id}">
                <button class="donate-btn" onclick="makeDonation('${manga.id}')">💝 Донат</button>
            </div>

            <div class="donation-quick-buttons">
                <button class="quick-donate-btn" onclick="quickDonate('${manga.id}', 100)">100₽</button>
                <button class="quick-donate-btn" onclick="quickDonate('${manga.id}', 500)">500₽</button>
                <button class="quick-donate-btn" onclick="quickDonate('${manga.id}', 1000)">1K₽</button>
            </div>
        </div>
    `;
}

// Donation functions for projects
function quickDonateToProject(projectId, amount) {
    const input = document.getElementById(`donationAmountProject${projectId}`);
    if (input) {
        input.value = amount;
        makeDonationToProject(projectId);
    }
}

function makeDonationToProject(projectId) {
    const amountInput = document.getElementById(`donationAmountProject${projectId}`);
    if (!amountInput) return;
    
    const amount = parseInt(amountInput.value) || 0;

    if (amount < 10) {
        showNotification('Минимальная сумма: 10₽', 'error');
        return;
    }

    if (amount > 50000) {
        showNotification('Максимальная сумма: 50,000₽', 'error');
        return;
    }

    try {
        const donationProjects = JSON.parse(localStorage.getItem('lightfox_donation_projects') || '[]');
        const projectIndex = donationProjects.findIndex(p => p.id === projectId);
        
        if (projectIndex === -1) {
            showNotification('Проект не найден', 'error');
            return;
        }

        const project = donationProjects[projectIndex];
        
        const newTotal = Math.min(project.currentAmount + amount, project.goal);
        donationProjects[projectIndex].currentAmount = newTotal;
        donationProjects[projectIndex].updatedAt = new Date().toISOString();
        
        localStorage.setItem('lightfox_donation_projects', JSON.stringify(donationProjects));
        
        const donationHistory = JSON.parse(localStorage.getItem('donationHistory') || '[]');
        donationHistory.push({
            projectId: projectId,
            projectTitle: project.title,
            mangaId: project.mangaId,
            amount: amount,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('donationHistory', JSON.stringify(donationHistory));

        amountInput.value = '';
        loadDonationProjects();

        showNotification(`Спасибо! Добавлено ${amount.toLocaleString()}₽ в "${project.title}"`, 'success');

    } catch (error) {
        console.error('Error making donation to project:', error);
        showNotification('Ошибка обработки доната', 'error');
    }
}

// Donation functions for manga
function quickDonate(mangaId, amount) {
    const input = document.getElementById(`donationAmount${mangaId}`);
    if (input) {
        input.value = amount;
        makeDonation(mangaId);
    }
}

function makeDonation(mangaId) {
    const amountInput = document.getElementById(`donationAmount${mangaId}`);
    if (!amountInput) return;
    
    const amount = parseInt(amountInput.value) || 0;

    if (amount < 10) {
        showNotification('Минимальная сумма: 10₽', 'error');
        return;
    }

    if (amount > 50000) {
        showNotification('Максимальная сумма: 50,000₽', 'error');
        return;
    }

    // Создаем платеж через систему оплаты
    if (window.PaymentSystem && window.MangaAPI) {
        const manga = window.MangaAPI.getMangaById(mangaId);
        if (manga) {
            try {
                const payment = window.PaymentSystem.createDonationPayment(
                    mangaId, 
                    amount, 
                    manga.title
                );
                
                amountInput.value = '';
                
                // Показываем страницу оплаты
                window.PaymentSystem.redirectToPayment(payment.id);
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        } else {
            showNotification('Тайтл не найден', 'error');
        }
    } else {
        showNotification('Система оплаты недоступна', 'error');
    }
}

// Section navigation
function openSection(sectionName) {
    currentSection = sectionName;
    showingNotifications = false;
    
    const dashboardView = document.getElementById('dashboard-view');
    const sectionDetail = document.getElementById('section-detail');
    
    if (dashboardView) dashboardView.style.display = 'none';
    if (sectionDetail) sectionDetail.classList.add('active');
    
    const titles = {
        favorites: 'Избранное',
        watching: 'Смотрю',
        wantToWatch: 'Хочу посмотреть',
        completed: 'Досмотрел',
        subscription: 'Моя подписка',
        notifications: 'Уведомления',
        profile: 'Редактирование профиля'
    };
    
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) {
        sectionTitle.textContent = titles[sectionName] || sectionName;
    }
    
    loadSectionContent(sectionName);
}

function backToDashboard() {
    const dashboardView = document.getElementById('dashboard-view');
    const sectionDetail = document.getElementById('section-detail');
    
    if (dashboardView) dashboardView.style.display = 'block';
    if (sectionDetail) sectionDetail.classList.remove('active');
    
    currentSection = null;
    showingNotifications = false;
}

// Load section content
function loadSectionContent(sectionName) {
    const container = document.getElementById('sectionContent');
    if (!container) return;
    
    if (sectionName === 'subscription') {
        loadSubscriptionContent(container);
        return;
    }
    
    if (sectionName === 'notifications') {
        loadNotifications();
        return;
    }
    
    if (sectionName === 'profile') {
        loadProfileEditor();
        return;
    }
    
    const items = userLists[sectionName] || [];

    if (items.length === 0) {
        const emptyStates = {
            favorites: {
                icon: '❤️',
                title: 'Нет избранных тайтлов',
                text: 'Добавляйте тайтлы в избранное из каталога или плеера'
            },
            watching: {
                icon: '▶️',
                title: 'Не читаете тайтлы',
                text: 'Начните читать тайтлы и они появятся здесь'
            },
            wantToWatch: {
                icon: '📚',
                title: 'Список пуст',
                text: 'Добавляйте интересные тайтлы в планы'
            },
            completed: {
                icon: '✅',
                title: 'Нет завершенных',
                text: 'Прочитанные тайтлы будут отображаться здесь'
            }
        };

        const state = emptyStates[sectionName];
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${state.icon}</div>
                <div class="empty-title">${state.title}</div>
                <div class="empty-text">${state.text}</div>
                <a href="catalog.html" class="empty-action">
                    <span>🔍</span>
                    Открыть каталог
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="manga-grid">
            ${items.map(item => renderMangaCard(item)).join('')}
        </div>
    `;
}

// Load subscription content
function loadSubscriptionContent(container) {
    const subscription = JSON.parse(localStorage.getItem('userSubscription') || 'null');
    
    if (!subscription || new Date(subscription.expiresAt) <= new Date()) {
        container.innerHTML = `
            <div class="subscription-inactive">
                <div class="subscription-icon">💎</div>
                <h3>Подписка не активна</h3>
                <p>Оформите подписку для доступа к премиум контенту и эксклюзивным тайтлам</p>
                <a href="subscriptions.html" class="subscription-btn">
                    <span>🚀</span>
                    Выбрать подписку
                </a>
            </div>
        `;
        return;
    }
    
    const daysLeft = Math.ceil((new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysLeft <= 7;
    
    container.innerHTML = `
        <div class="subscription-active">
            <div class="subscription-card">
                <div class="subscription-header">
                    <div class="subscription-plan">
                        <span class="plan-icon">${subscription.icon}</span>
                        <div>
                            <h3>${subscription.planName}</h3>
                            <p class="plan-tier">${subscription.tier}</p>
                        </div>
                    </div>
                    <div class="subscription-status ${isExpiringSoon ? 'expiring' : 'active'}">
                        ${isExpiringSoon ? '⚠️ Истекает' : '✅ Активна'}
                    </div>
                </div>
                
                <div class="subscription-details">
                    <div class="detail-row">
                        <span>Действует до:</span>
                        <span class="expiry-date ${isExpiringSoon ? 'expiring' : ''}">${new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div class="detail-row">
                        <span>Осталось дней:</span>
                        <span class="${isExpiringSoon ? 'expiring' : ''}">${daysLeft}</span>
                    </div>
                    <div class="detail-row">
                        <span>Тип подписки:</span>
                        <span>${subscription.tier}</span>
                    </div>
                </div>
                
                <div class="subscription-features">
                    <h4>Ваши привилегии:</h4>
                    <ul>
                        ${subscription.features.map(feature => `<li>✅ ${feature}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="subscription-actions">
                    <a href="subscriptions.html" class="subscription-btn primary">
                        <span>🔄</span>
                        Продлить подписку
                    </a>
                    <button class="subscription-btn secondary" onclick="cancelSubscription()">
                        <span>❌</span>
                        Отменить подписку
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Cancel subscription
function cancelSubscription() {
    if (confirm('Вы уверены, что хотите отменить подписку? Доступ к премиум контенту будет ограничен.')) {
        localStorage.removeItem('userSubscription');
        updateSubscriptionStatus();
        loadSectionContent('subscription');
        showNotification('Подписка отменена', 'warning');
    }
}

// Render manga card for lists
function renderMangaCard(item) {
    let manga = item;
    if (window.MangaAPI && item.mangaId) {
        const apiData = window.MangaAPI.getMangaById(item.mangaId);
        if (apiData) {
            manga = { ...item, ...apiData };
        }
    }

    const mangaId = manga.mangaId || manga.id;
    const itemId = item.id || item.mangaId;

    return `
        <div class="manga-card" onclick="openManga('${mangaId}')">
            <div class="manga-poster-container">
                <img src="${manga.image || 'https://via.placeholder.com/180x240/FF6B35/FFFFFF?text=' + encodeURIComponent((manga.title || '').charAt(0))}" 
                     alt="${manga.title}" class="manga-poster"
                     onerror="this.src='https://via.placeholder.com/180x240/FF6B35/FFFFFF?text=' + encodeURIComponent('${(manga.title || '').charAt(0)}')">
                ${manga.currentEpisode ? `<div class="manga-badge">Серия ${manga.currentEpisode}</div>` : ''}
            </div>
            
            <div class="manga-info">
                <div class="manga-title">${manga.title}</div>
                <div class="manga-meta">
                    ${manga.type || 'Манга'} • ⭐ ${manga.rating || 'N/A'}
                </div>
                
                <div class="manga-actions">
                    <button class="action-btn primary" onclick="event.stopPropagation(); openManga('${mangaId}')">
                        Читать
                    </button>
                    <button class="action-btn" onclick="event.stopPropagation(); removeFromList('${currentSection}', '${itemId}')">
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    `;
}

// User actions
function openManga(mangaId) {
    if (mangaId && mangaId !== 'undefined') {
        window.location.href = `player.html?id=${mangaId}`;
    } else {
        showNotification('Тайтл не найден', 'error');
    }
}

function removeFromList(listName, itemId) {
    const list = userLists[listName];
    if (!list) return;
    
    const index = list.findIndex(item => (item.id || item.mangaId) == itemId);
    
    if (index !== -1) {
        list.splice(index, 1);
        localStorage.setItem(listName, JSON.stringify(list));
        updateCounts();
        
        if (currentSection === listName) {
            loadSectionContent(listName);
        }
        
        showNotification('Удалено из списка', 'success');
    }
}

// Utility functions
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

// Wait for data
function waitForData() {
    if (window.MangaAPI) {
        initializeCabinet();
    } else {
        setTimeout(waitForData, 100);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Кабинет: DOM загружен');
    
    // Проверяем доступ к кабинету
    if (window.AccessControl && !window.AccessControl.enforcePageAccess()) {
        return; // Доступ запрещен, пользователь будет перенаправлен
    }
    
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

    // Wait for data
    waitForData();

    // Listen for storage updates from other pages
    window.addEventListener('storage', function(e) {
        if (['favorites', 'watching', 'wantToWatch', 'completed'].includes(e.key)) {
            loadUserLists();
            updateCounts();
            if (currentSection) {
                loadSectionContent(currentSection);
            }
        }
    });
    
    // Listen for data events
    window.addEventListener('mangaDataReady', initializeCabinet);
    window.addEventListener('mangaDataUpdate', loadDonationProjects);
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
window.openSection = openSection;
window.backToDashboard = backToDashboard;
window.openManga = openManga;
window.removeFromList = removeFromList;
window.makeDonation = makeDonation;
window.quickDonate = quickDonate;
window.makeDonationToProject = makeDonationToProject;
window.quickDonateToProject = quickDonateToProject;
window.cancelSubscription = cancelSubscription;
window.openNotifications = openNotifications;
window.openProfileEditor = openProfileEditor;
window.handleAvatarUpload = handleAvatarUpload;
window.removeAvatar = removeAvatar;
window.saveProfile = saveProfile;
window.openNotificationManga = openNotificationManga;
window.deleteNotification = deleteNotification;
window.markAllNotificationsRead = markAllNotificationsRead;
window.showNotification = showNotification;

console.log('🏠 Личный кабинет с исправлениями загружен!');