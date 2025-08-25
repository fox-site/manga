// Админ панель для Light Fox Manga с исправленным fallback
(function() {
    'use strict';

    // Состояние админки
    let currentSection = 'dashboard';
    let currentUser = null;
    let isLoggedIn = false;
    let isSupabaseMode = false;

    // Проверка доступности Supabase
    async function checkSupabaseAvailability() {
        try {
            if (!window.supabase) {
                console.log('🔄 Supabase не инициализирован, используем fallback');
                return false;
            }

            // Проверяем реальное подключение
            const { data, error } = await window.supabase.auth.getSession();
            
            if (error && error.message.includes('fetch')) {
                console.log('🔄 Supabase недоступен, используем fallback');
                return false;
            }

            console.log('✅ Supabase доступен');
            return true;
        } catch (error) {
            console.log('🔄 Ошибка Supabase, используем fallback:', error.message);
            return false;
        }
    }

    // Проверка прав администратора
    async function checkAdminAccess() {
        try {
            isSupabaseMode = await checkSupabaseAvailability();

            if (isSupabaseMode) {
                // Supabase режим
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) {
                    showLoginForm();
                    return false;
                }

                // Проверяем права админа в базе
                const { data: profile, error } = await window.supabase
                    .from('users')
                    .select('is_admin, username')
                    .eq('id', user.id)
                    .single();

                if (error || !profile?.is_admin) {
                    showAccessDenied();
                    return false;
                }

                currentUser = { ...user, profile };
                isLoggedIn = true;
                return true;
            } else {
                // Fallback режим - проверяем localStorage
                const savedUser = localStorage.getItem('admin_user');
                if (savedUser) {
                    try {
                        currentUser = JSON.parse(savedUser);
                        isLoggedIn = true;
                        return true;
                    } catch (e) {
                        localStorage.removeItem('admin_user');
                    }
                }

                showLoginForm();
                return false;
            }
        } catch (error) {
            console.error('Admin access check error:', error);
            showLoginForm();
            return false;
        }
    }

    // Показ формы входа
    function showLoginForm() {
        document.body.innerHTML = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .login-container {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                }

                .login-title {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 10px;
                    background: linear-gradient(135deg, #ff8a50, #ff7043);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .login-subtitle {
                    color: #666;
                    margin-bottom: 30px;
                    font-size: 1.1rem;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .login-input {
                    padding: 15px 20px;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }

                .login-input:focus {
                    outline: none;
                    border-color: #ff8a50;
                    box-shadow: 0 0 0 3px rgba(255, 138, 80, 0.1);
                    background: white;
                }

                .login-btn {
                    padding: 15px;
                    background: linear-gradient(135deg, #ff8a50, #ff7043);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(255, 138, 80, 0.3);
                }

                .login-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .demo-info {
                    margin-top: 25px;
                    padding: 20px;
                    background: rgba(16, 185, 129, 0.1);
                    border-radius: 12px;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }

                .demo-info h4 {
                    color: #059669;
                    margin-bottom: 15px;
                    font-size: 1.1rem;
                }

                .demo-credentials {
                    display: grid;
                    gap: 10px;
                    text-align: left;
                }

                .credential-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }

                .credential-label {
                    font-weight: 600;
                    color: #374151;
                }

                .credential-value {
                    font-family: 'Courier New', monospace;
                    color: #059669;
                    font-weight: 600;
                }

                .mode-indicator {
                    margin-top: 20px;
                    padding: 15px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                }

                .mode-supabase {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #059669;
                }

                .mode-fallback {
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    color: #d97706;
                }

                .error-message {
                    color: #dc2626;
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(220, 38, 38, 0.1);
                    border-radius: 8px;
                    display: none;
                }

                .back-link {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    color: white;
                    text-decoration: none;
                    padding: 10px 20px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 25px;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }

                .back-link:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
            </style>

            <a href="index.html" class="back-link">← На главную</a>

            <div class="login-container">
                <h1 class="login-title">🦊 Light Fox</h1>
                <h2 class="login-subtitle">Админ панель</h2>
                
                <form class="login-form" id="adminLoginForm">
                    <input type="email" class="login-input" id="adminEmail" placeholder="Email администратора" required>
                    <input type="password" class="login-input" id="adminPassword" placeholder="Пароль" required>
                    <button type="submit" class="login-btn" id="loginBtn">Войти в админку</button>
                </form>

                <div class="error-message" id="loginError"></div>

                <div class="demo-info">
                    <h4>🔑 Демо доступ:</h4>
                    <div class="demo-credentials">
                        <div class="credential-row">
                            <span class="credential-label">Email:</span>
                            <span class="credential-value">admin@lightfox.com</span>
                        </div>
                        <div class="credential-row">
                            <span class="credential-label">Пароль:</span>
                            <span class="credential-value">admin123</span>
                        </div>
                        <div class="credential-row">
                            <span class="credential-label">Альтернатива:</span>
                            <span class="credential-value">demo@example.com / 123456</span>
                        </div>
                    </div>
                </div>

                <div class="mode-indicator ${isSupabaseMode ? 'mode-supabase' : 'mode-fallback'}">
                    ${isSupabaseMode ? 
                        '🗄️ Режим: Supabase (серверная база данных)' : 
                        '💾 Режим: localStorage (локальная база данных)'
                    }
                </div>
            </div>
        `;

        document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    }

    // Показ отказа в доступе
    function showAccessDenied() {
        document.body.innerHTML = `
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    color: white;
                    text-align: center;
                }
                .access-denied {
                    max-width: 400px;
                }
                .back-btn {
                    background: white;
                    color: #dc2626;
                    padding: 12px 24px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    margin-top: 20px;
                    display: inline-block;
                    transition: all 0.3s ease;
                }
                .back-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                }
            </style>
            <div class="access-denied">
                <h1 style="font-size: 4rem; margin-bottom: 1rem;">🚫</h1>
                <h2 style="margin-bottom: 1rem;">Доступ запрещен</h2>
                <p style="margin-bottom: 2rem;">У вас нет прав администратора</p>
                <a href="index.html" class="back-btn">На главную</a>
            </div>
        `;
    }

    // Обработка входа админа
    async function handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('loginError');
        const loginBtn = document.getElementById('loginBtn');

        // Очищаем предыдущие ошибки
        errorDiv.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Вход...';

        try {
            if (isSupabaseMode && window.supabase) {
                // Supabase авторизация
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                // Проверяем права админа
                const { data: profile, error: profileError } = await window.supabase
                    .from('users')
                    .select('is_admin, username')
                    .eq('id', data.user.id)
                    .single();

                if (profileError || !profile?.is_admin) {
                    throw new Error('У вас нет прав администратора');
                }

                currentUser = { ...data.user, profile };
                isLoggedIn = true;
                
                // Сохраняем для fallback
                localStorage.setItem('admin_user', JSON.stringify({
                    email: email,
                    username: profile.username || 'Admin',
                    isAdmin: true,
                    mode: 'supabase'
                }));

            } else {
                // Fallback авторизация
                const validCredentials = [
                    { email: 'admin@lightfox.com', password: 'admin123', username: 'Admin' },
                    { email: 'demo@example.com', password: '123456', username: 'DemoAdmin' }
                ];

                const validUser = validCredentials.find(cred => 
                    cred.email === email && cred.password === password
                );

                if (!validUser) {
                    throw new Error('Неверный email или пароль');
                }

                currentUser = {
                    email: validUser.email,
                    username: validUser.username,
                    isAdmin: true,
                    mode: 'fallback'
                };
                isLoggedIn = true;

                // Сохраняем сессию
                localStorage.setItem('admin_user', JSON.stringify(currentUser));
            }

            // Успешный вход
            initializeAdminPanel();

        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Ошибка входа: ' + error.message;
            errorDiv.style.display = 'block';
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Войти в админку';
        }
    }

    // Инициализация админ панели
    function initializeAdminPanel() {
        createAdminInterface();
        loadDashboard();
    }

    // Создание интерфейса админки
    function createAdminInterface() {
        document.body.innerHTML = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: #f8fafc;
                    color: #1e293b;
                    line-height: 1.6;
                    min-height: 100vh;
                }

                .admin-header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 70px;
                    background: white;
                    border-bottom: 2px solid #dc2626;
                    display: flex;
                    align-items: center;
                    padding: 0 24px;
                    z-index: 1000;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .admin-logo {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #dc2626;
                    margin-right: 24px;
                }

                .admin-nav {
                    display: flex;
                    gap: 20px;
                    margin-right: auto;
                    flex-wrap: wrap;
                }

                .nav-btn {
                    padding: 8px 16px;
                    background: transparent;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    color: #1e293b;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .nav-btn:hover {
                    border-color: #dc2626;
                    background-color: rgba(220, 38, 38, 0.05);
                }

                .nav-btn.active {
                    background: #dc2626;
                    color: white;
                    border-color: #dc2626;
                }

                .admin-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.875rem;
                }

                .mode-indicator {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .mode-supabase {
                    background: rgba(16, 185, 129, 0.1);
                    color: #059669;
                }

                .mode-fallback {
                    background: rgba(245, 158, 11, 0.1);
                    color: #d97706;
                }

                .logout-btn {
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .logout-btn:hover {
                    background: #b91c1c;
                }

                .main-content {
                    margin-top: 70px;
                    padding: 24px;
                    min-height: calc(100vh - 70px);
                }

                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .content-section {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    overflow: hidden;
                    margin-bottom: 24px;
                    display: none;
                }

                .content-section.active {
                    display: block;
                }

                .section-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .section-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .section-content {
                    padding: 24px;
                }

                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    text-align: center;
                    border: 1px solid #e2e8f0;
                }

                .stat-number {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #dc2626;
                    margin-bottom: 8px;
                }

                .stat-label {
                    color: #64748b;
                    font-size: 0.875rem;
                }

                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                    color: #64748b;
                }

                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #e2e8f0;
                    border-top: 3px solid #dc2626;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-right: 16px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .error {
                    color: #dc2626;
                    text-align: center;
                    padding: 20px;
                    background: rgba(220, 38, 38, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(220, 38, 38, 0.2);
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                    text-decoration: none;
                }

                .btn-primary {
                    background: #dc2626;
                    color: white;
                }

                .btn-primary:hover {
                    background: #b91c1c;
                    transform: translateY(-1px);
                }

                .notification {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 10px 15px rgba(0,0,0,0.1);
                    z-index: 2000;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                    max-width: 400px;
                    font-weight: 500;
                }

                .notification.show {
                    transform: translateX(0);
                }

                .notification.success {
                    background: #059669;
                    color: white;
                }

                .notification.error {
                    background: #dc2626;
                    color: white;
                }

                .notification.warning {
                    background: #d97706;
                    color: white;
                }

                @media (max-width: 768px) {
                    .admin-nav {
                        display: none;
                    }
                    
                    .admin-header {
                        flex-direction: column;
                        height: auto;
                        padding: 16px;
                    }
                    
                    .main-content {
                        margin-top: 120px;
                    }
                }
            </style>

            <!-- Admin Header -->
            <header class="admin-header">
                <div class="admin-logo">🦊 Light Fox Admin</div>
                <nav class="admin-nav">
                    <button class="nav-btn active" onclick="switchSection('dashboard')">📊 Дашборд</button>
                    <button class="nav-btn" onclick="switchSection('manga')">📚 Манга</button>
                    <button class="nav-btn" onclick="switchSection('users')">👥 Пользователи</button>
                    <button class="nav-btn" onclick="switchSection('donations')">💰 Донаты</button>
                    <button class="nav-btn" onclick="switchSection('comments')">💬 Комментарии</button>
                </nav>
                <div class="admin-controls">
                    <div class="mode-indicator ${isSupabaseMode ? 'mode-supabase' : 'mode-fallback'}">
                        ${isSupabaseMode ? '🗄️ Supabase' : '💾 localStorage'}
                    </div>
                    <span>👤 ${currentUser.username || currentUser.email}</span>
                    <button class="logout-btn" onclick="adminLogout()">Выйти</button>
                </div>
            </header>

            <!-- Main Content -->
            <main class="main-content">
                <div class="container">
                    <!-- Dashboard Section -->
                    <section class="content-section active" id="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">📊 Дашборд</h2>
                        </div>
                        <div class="section-content" id="dashboard-content">
                            <div class="loading">
                                <div class="spinner"></div>
                                Загрузка статистики...
                            </div>
                        </div>
                    </section>

                    <!-- Manga Section -->
                    <section class="content-section" id="manga-section">
                        <div class="section-header">
                            <h2 class="section-title">📚 Управление мангой</h2>
                            <button class="btn btn-primary" onclick="showAddMangaForm()">
                                <span>➕</span>
                                Добавить тайтл
                            </button>
                        </div>
                        <div class="section-content" id="manga-content">
                            <!-- Content will be loaded here -->
                        </div>
                    </section>

                    <!-- Users Section -->
                    <section class="content-section" id="users-section">
                        <div class="section-header">
                            <h2 class="section-title">👥 Пользователи</h2>
                        </div>
                        <div class="section-content" id="users-content">
                            <!-- Content will be loaded here -->
                        </div>
                    </section>

                    <!-- Donations Section -->
                    <section class="content-section" id="donations-section">
                        <div class="section-header">
                            <h2 class="section-title">💰 Донаты</h2>
                        </div>
                        <div class="section-content" id="donations-content">
                            <!-- Content will be loaded here -->
                        </div>
                    </section>

                    <!-- Comments Section -->
                    <section class="content-section" id="comments-section">
                        <div class="section-header">
                            <h2 class="section-title">💬 Модерация комментариев</h2>
                        </div>
                        <div class="section-content" id="comments-content">
                            <!-- Content will be loaded here -->
                        </div>
                    </section>
                </div>
            </main>

            <!-- Notification -->
            <div class="notification" id="notification"></div>
        `;
    }

    // Переключение разделов
    function switchSection(section) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section + '-section').classList.add('active');

        currentSection = section;

        // Load section content
        switch(section) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'manga':
                loadMangaManagement();
                break;
            case 'users':
                loadUsersManagement();
                break;
            case 'donations':
                loadDonationsManagement();
                break;
            case 'comments':
                loadCommentsModeration();
                break;
        }
    }

    // Загрузка дашборда
    async function loadDashboard() {
        const content = document.getElementById('dashboard-content');
        if (!content) return;

        try {
            let stats = {
                totalManga: 0,
                totalUsers: 0,
                totalComments: 0,
                totalDonations: 0
            };

            if (isSupabaseMode && window.supabase) {
                // Получаем статистику из Supabase
                try {
                    const [mangaData, userData, commentData, donationData] = await Promise.all([
                        window.supabase.from('manga').select('id, current_donations').eq('is_active', true),
                        window.supabase.from('users').select('id, total_donations'),
                        window.supabase.from('comments').select('id'),
                        window.supabase.from('donations').select('amount').eq('status', 'completed')
                    ]);

                    stats.totalManga = mangaData.data?.length || 0;
                    stats.totalUsers = userData.data?.length || 0;
                    stats.totalComments = commentData.data?.length || 0;
                    stats.totalDonations = donationData.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
                } catch (error) {
                    console.error('Supabase stats error:', error);
                    // Fallback к localStorage
                    stats = getLocalStorageStats();
                }
            } else {
                // Fallback к localStorage
                stats = getLocalStorageStats();
            }

            content.innerHTML = `
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalManga}</div>
                        <div class="stat-label">Тайтлов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalUsers}</div>
                        <div class="stat-label">Пользователей</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalComments}</div>
                        <div class="stat-label">Комментариев</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${isSupabaseMode ? (stats.totalDonations / 100).toLocaleString() : stats.totalDonations.toLocaleString()}₽</div>
                        <div class="stat-label">Донатов</div>
                    </div>
                </div>

                <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <h3 style="margin-bottom: 15px;">🚀 Статус системы</h3>
                    <div style="display: grid; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>🗄️ База данных:</span>
                            <span style="color: ${isSupabaseMode ? '#059669' : '#d97706'}; font-weight: 600;">
                                ${isSupabaseMode ? '✅ PostgreSQL (Supabase)' : '⚠️ localStorage (fallback)'}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>🔐 Авторизация:</span>
                            <span style="color: ${isSupabaseMode ? '#059669' : '#d97706'}; font-weight: 600;">
                                ${isSupabaseMode ? '✅ JWT токены' : '⚠️ localStorage'}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>📁 Файлы:</span>
                            <span style="color: ${isSupabaseMode ? '#059669' : '#d97706'}; font-weight: 600;">
                                ${isSupabaseMode ? '✅ Supabase Storage' : '⚠️ Локальные файлы'}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>🌍 Геоблокировка:</span>
                            <span style="color: ${isSupabaseMode ? '#059669' : '#d97706'}; font-weight: 600;">
                                ${isSupabaseMode ? '✅ Активна (KR,DE,CN,JP)' : '⚠️ Отключена'}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>⚡ Real-time:</span>
                            <span style="color: ${isSupabaseMode ? '#059669' : '#d97706'}; font-weight: 600;">
                                ${isSupabaseMode ? '✅ Включен' : '⚠️ Отключен'}
                            </span>
                        </div>
                    </div>
                    
                    ${!isSupabaseMode ? `
                        <div style="margin-top: 20px; padding: 15px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.3);">
                            <h4 style="color: #d97706; margin-bottom: 10px;">⚠️ Fallback режим</h4>
                            <p style="color: #d97706; font-size: 0.9rem;">
                                Система работает в автономном режиме. Для полного функционала подключите Supabase.
                            </p>
                        </div>
                    ` : `
                        <div style="margin-top: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
                            <h4 style="color: #059669; margin-bottom: 10px;">✅ Серверный режим</h4>
                            <p style="color: #059669; font-size: 0.9rem;">
                                Все функции работают через Supabase. Полная безопасность и производительность.
                            </p>
                        </div>
                    `}
                </div>
            `;

        } catch (error) {
            content.innerHTML = `
                <div class="error">
                    <h3>❌ Ошибка загрузки статистики</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadDashboard()" style="margin-top: 15px;">Попробовать снова</button>
                </div>
            `;
        }
    }

    // Получение статистики из localStorage
    function getLocalStorageStats() {
        const mangaData = window.MangaAPI ? window.MangaAPI.getAllManga() : [];
        const authSystem = window.AuthSystem;
        
        let totalComments = 0;
        mangaData.forEach(manga => {
            const comments = JSON.parse(localStorage.getItem(`comments_${manga.id}`) || '[]');
            totalComments += comments.length;
        });

        return {
            totalManga: mangaData.length,
            totalUsers: authSystem ? authSystem.users.length : 0,
            totalComments: totalComments,
            totalDonations: mangaData.reduce((sum, manga) => sum + (manga.currentDonations || 0), 0)
        };
    }

    // Загрузка управления мангой
    async function loadMangaManagement() {
        const content = document.getElementById('manga-content');
        if (!content) return;

        content.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Загрузка тайтлов...
            </div>
        `;

        try {
            let manga = [];

            if (isSupabaseMode && window.supabase) {
                const { data, error } = await window.supabase
                    .from('manga')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                manga = data || [];
            } else {
                // Fallback к MangaAPI
                manga = window.MangaAPI ? await window.MangaAPI.getAllManga() : [];
            }

            if (manga.length === 0) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <h3>📚 Тайтлы не найдены</h3>
                        <p>Добавьте первый тайтл для начала работы</p>
                        <button class="btn btn-primary" onclick="showAddMangaForm()" style="margin-top: 15px;">
                            ➕ Добавить тайтл
                        </button>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    ${manga.map(item => `
                        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; transition: transform 0.2s;">
                            <div style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
                                <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${item.title}</div>
                                <div style="color: #64748b; font-size: 0.875rem;">
                                    ${item.type} • ${item.status} • ${item.available_episodes || item.availableEpisodes || 0}/${item.total_episodes || item.totalEpisodes || 0} серий
                                </div>
                                <div style="color: #64748b; font-size: 0.875rem; margin-top: 4px;">
                                    Донатов: ${(item.current_donations || item.currentDonations || 0).toLocaleString()}₽ / ${(item.donation_goal || item.donationGoal || 10000).toLocaleString()}₽
                                </div>
                            </div>
                            <div style="padding: 16px; display: flex; gap: 8px;">
                                <button class="btn" style="background: #64748b; color: white; flex: 1;" onclick="editManga('${item.id}')">Редактировать</button>
                                <button class="btn" style="background: #dc2626; color: white;" onclick="deleteManga('${item.id}')">Удалить</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = `
                <div class="error">
                    <h3>❌ Ошибка загрузки тайтлов</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadMangaManagement()" style="margin-top: 15px;">Попробовать снова</button>
                </div>
            `;
        }
    }

    // Загрузка управления пользователями
    async function loadUsersManagement() {
        const content = document.getElementById('users-content');
        if (!content) return;

        content.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Загрузка пользователей...
            </div>
        `;

        try {
            let users = [];

            if (isSupabaseMode && window.supabase) {
                const { data, error } = await window.supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                users = data || [];
            } else {
                // Fallback к AuthSystem
                users = window.AuthSystem ? window.AuthSystem.getAllUsers() : [];
            }

            content.innerHTML = `
                <div style="margin-bottom: 20px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; gap: 20px; font-size: 0.875rem; color: #64748b;">
                        <span>Всего пользователей: ${users.length}</span>
                        <span>Активных: ${users.filter(u => !u.is_banned && !u.isBanned).length}</span>
                        <span>Админов: ${users.filter(u => u.is_admin || u.isAdmin).length}</span>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${users.map(user => `
                        <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; transition: all 0.2s ease;">
                            <div style="padding: 16px; display: flex; align-items: center; gap: 16px;">
                                <div style="width: 50px; height: 50px; border-radius: 50%; background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.2rem; flex-shrink: 0;">
                                    ${(user.username || user.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${user.username || 'Пользователь'}</div>
                                    <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">${user.email}</div>
                                    <div style="font-size: 0.75rem; color: #64748b;">
                                        Регистрация: ${new Date(user.created_at || user.registeredAt || Date.now()).toLocaleDateString('ru-RU')} • 
                                        Донатов: ${user.total_donations || user.stats?.totalDonations || 0}₽
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; ${(user.is_admin || user.isAdmin) ? 'background: rgba(220, 38, 38, 0.1); color: #dc2626;' : 'background: rgba(100, 116, 139, 0.1); color: #64748b;'}">
                                        ${(user.is_admin || user.isAdmin) ? 'Админ' : 'Пользователь'}
                                    </div>
                                </div>
                            </div>
                            <div style="padding: 16px; display: flex; gap: 8px; border-top: 1px solid #e2e8f0;">
                                <button class="btn" style="background: #64748b; color: white;" onclick="editUser('${user.id}')">Редактировать</button>
                                ${!(user.is_admin || user.isAdmin) ? `
                                    <button class="btn" style="background: #f59e0b; color: white;" onclick="toggleUserBan('${user.id}', ${user.is_banned || user.isBanned || false})">
                                        ${(user.is_banned || user.isBanned) ? 'Разбанить' : 'Забанить'}
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = `
                <div class="error">
                    <h3>❌ Ошибка загрузки пользователей</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadUsersManagement()" style="margin-top: 15px;">Попробовать снова</button>
                </div>
            `;
        }
    }

    // Загрузка управления донатами
    async function loadDonationsManagement() {
        const content = document.getElementById('donations-content');
        if (!content) return;

        content.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Загрузка донатов...
            </div>
        `;

        try {
            let donations = [];
            let totalAmount = 0;

            if (isSupabaseMode && window.supabase) {
                const { data, error } = await window.supabase
                    .from('donations')
                    .select(`
                        *,
                        user:users(username),
                        manga:manga(title)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                donations = data || [];
                totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
            } else {
                // Fallback к localStorage
                const donationHistory = JSON.parse(localStorage.getItem('donationHistory') || '[]');
                donations = donationHistory.map(d => ({
                    ...d,
                    user: { username: 'Пользователь' },
                    manga: { title: d.mangaTitle },
                    status: 'completed',
                    created_at: d.timestamp,
                    amount: d.amount
                }));
                totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
            }

            const completedDonations = donations.filter(d => d.status === 'completed');

            content.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div class="stat-card">
                        <div class="stat-number">${donations.length}</div>
                        <div class="stat-label">Всего донатов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${completedDonations.length}</div>
                        <div class="stat-label">Завершенных</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${isSupabaseMode ? (totalAmount / 100).toLocaleString() : totalAmount.toLocaleString()}₽</div>
                        <div class="stat-label">Общая сумма</div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${donations.slice(0, 20).map(donation => `
                        <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
                            <div style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 4px;">${donation.manga?.title || 'Неизвестный тайтл'}</div>
                                    <div style="color: #64748b; font-size: 0.875rem;">
                                        От: ${donation.user?.username || 'Аноним'} • 
                                        ${isSupabaseMode ? (donation.amount / 100) : donation.amount}₽
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: rgba(16, 185, 129, 0.1); color: #059669;">
                                        ${donation.status || 'completed'}
                                    </div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                                        ${new Date(donation.created_at).toLocaleString('ru-RU')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = `
                <div class="error">
                    <h3>❌ Ошибка загрузки донатов</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadDonationsManagement()" style="margin-top: 15px;">Попробовать снова</button>
                </div>
            `;
        }
    }

    // Загрузка модерации комментариев
    async function loadCommentsModeration() {
        const content = document.getElementById('comments-content');
        if (!content) return;

        content.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Загрузка комментариев...
            </div>
        `;

        try {
            let comments = [];

            if (isSupabaseMode && window.supabase) {
                const { data, error } = await window.supabase
                    .from('comments')
                    .select(`
                        *,
                        user:users(username),
                        manga:manga(title)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                comments = data || [];
            } else {
                // Fallback к localStorage
                const allManga = window.MangaAPI ? await window.MangaAPI.getAllManga() : [];
                comments = [];
                
                allManga.forEach(manga => {
                    const mangaComments = JSON.parse(localStorage.getItem(`comments_${manga.id}`) || '[]');
                    mangaComments.forEach(comment => {
                        comments.push({
                            ...comment,
                            user: { username: comment.authorName },
                            manga: { title: manga.title },
                            is_moderated: true,
                            likes: comment.likes || 0,
                            content: comment.text,
                            created_at: comment.createdAt
                        });
                    });
                });
                
                comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }

            if (comments.length === 0) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <h3>💬 Комментарии не найдены</h3>
                        <p>Комментарии пользователей будут отображаться здесь</p>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${comments.map(comment => `
                        <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
                            <div style="padding: 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.2rem;">
                                        ${(comment.user?.username || 'А').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style="font-weight: 600; color: #1e293b;">${comment.user?.username || 'Аноним'}</div>
                                        <div style="font-size: 0.75rem; color: #64748b;">
                                            ${comment.manga?.title || 'Неизвестный тайтл'} • Серия ${comment.episode_number || comment.episode || 1}
                                        </div>
                                    </div>
                                </div>
                                <div style="font-size: 0.75rem; color: #64748b;">${new Date(comment.created_at).toLocaleString('ru-RU')}</div>
                            </div>
                            <div style="padding: 16px; color: #1e293b; line-height: 1.5; border-bottom: 1px solid #e2e8f0;">
                                ${comment.content}
                            </div>
                            <div style="padding: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                                <div style="padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; ${comment.is_moderated ? 'background: rgba(16, 185, 129, 0.1); color: #059669;' : 'background: rgba(245, 158, 11, 0.1); color: #d97706;'}">
                                    ${comment.is_moderated ? '✅ Одобрен' : '⏳ На модерации'}
                                </div>
                                <span style="color: #64748b; font-size: 0.875rem;">👍 ${comment.likes}</span>
                                ${!comment.is_moderated ? `
                                    <button class="btn" style="background: #059669; color: white; font-size: 0.75rem; padding: 6px 12px;" onclick="approveComment('${comment.id}')">Одобрить</button>
                                    <button class="btn" style="background: #dc2626; color: white; font-size: 0.75rem; padding: 6px 12px;" onclick="rejectComment('${comment.id}')">Отклонить</button>
                                ` : ''}
                                <button class="btn" style="background: #dc2626; color: white; font-size: 0.75rem; padding: 6px 12px;" onclick="deleteComment('${comment.id}')">Удалить</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = `
                <div class="error">
                    <h3>❌ Ошибка загрузки комментариев</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadCommentsModeration()" style="margin-top: 15px;">Попробовать снова</button>
                </div>
            `;
        }
    }

    // Одобрение комментария
    async function approveComment(commentId) {
        try {
            if (isSupabaseMode && window.supabase) {
                const { error } = await window.supabase
                    .from('comments')
                    .update({ is_moderated: true })
                    .eq('id', commentId);

                if (error) throw error;
            }

            showNotification('Комментарий одобрен', 'success');
            loadCommentsModeration();
        } catch (error) {
            showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    // Отклонение комментария
    async function rejectComment(commentId) {
        try {
            if (isSupabaseMode && window.supabase) {
                const { error } = await window.supabase
                    .from('comments')
                    .update({ is_moderated: false })
                    .eq('id', commentId);

                if (error) throw error;
            }

            showNotification('Комментарий отклонен', 'warning');
            loadCommentsModeration();
        } catch (error) {
            showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    // Удаление комментария
    async function deleteComment(commentId) {
        if (!confirm('Удалить комментарий?')) return;

        try {
            if (isSupabaseMode && window.supabase) {
                const { error } = await window.supabase
                    .from('comments')
                    .delete()
                    .eq('id', commentId);

                if (error) throw error;
            }

            showNotification('Комментарий удален', 'success');
            loadCommentsModeration();
        } catch (error) {
            showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    // Выход из админки
    async function adminLogout() {
        try {
            if (isSupabaseMode && window.supabase) {
                await window.supabase.auth.signOut();
            }
            
            localStorage.removeItem('admin_user');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('admin_user');
            window.location.href = 'index.html';
        }
    }

    // Показ уведомления
    function showNotification(message, type = 'success') {
        let notification = document.getElementById('notification');
        if (!notification) return;

        const colors = {
            success: '#059669',
            error: '#dc2626',
            warning: '#d97706'
        };

        notification.style.background = colors[type] || colors.success;
        notification.textContent = message;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Заглушки для функций (будут реализованы позже)
    function showAddMangaForm() {
        showNotification('Функция добавления манги будет реализована в следующем обновлении', 'warning');
    }

    function editManga(id) {
        showNotification('Функция редактирования будет реализована в следующем обновлении', 'warning');
    }

    function deleteManga(id) {
        if (confirm('Удалить тайтл?')) {
            showNotification('Функция удаления будет реализована в следующем обновлении', 'warning');
        }
    }

    function editUser(id) {
        showNotification('Функция редактирования пользователя будет реализована в следующем обновлении', 'warning');
    }

    function toggleUserBan(id, isBanned) {
        const action = isBanned ? 'разбанить' : 'забанить';
        if (confirm(`${action} пользователя?`)) {
            showNotification(`Функция ${action} будет реализована в следующем обновлении`, 'warning');
        }
    }

    // Экспорт функций
    window.switchSection = switchSection;
    window.adminLogout = adminLogout;
    window.approveComment = approveComment;
    window.rejectComment = rejectComment;
    window.deleteComment = deleteComment;
    window.showAddMangaForm = showAddMangaForm;
    window.editManga = editManga;
    window.deleteManga = deleteManga;
    window.editUser = editUser;
    window.toggleUserBan = toggleUserBan;

    // Инициализация при загрузке
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('🔧 Инициализация админ панели...');
        
        // Ждем немного для загрузки других систем
        setTimeout(async () => {
            const hasAccess = await checkAdminAccess();
            if (hasAccess) {
                initializeAdminPanel();
            }
        }, 500);
    });

    console.log('🔧 Admin Panel загружена');

})();