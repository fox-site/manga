// Система многоязычности для Light Fox Manga
(function() {
    'use strict';

    // Переводы для всех языков
    const TRANSLATIONS = {
        ru: {
            // Навигация
            'nav.home': 'Главная',
            'nav.catalog': 'Каталог',
            'nav.cabinet': 'Кабинет',
            'nav.subscriptions': 'Подписка',
            'nav.random': 'Случайное',
            'nav.profile': 'Профиль',
            'nav.news': 'Новости',
            
            // Главная страница
            'home.hero.title': 'Добро пожаловать в Light Fox Manga!',
            'home.hot.title': 'Горячие новинки',
            'home.popular.title': 'Популярное',
            'home.news.title': 'Новости',
            'home.updates.title': 'Последние обновления',
            'home.view.all': 'Смотреть все',
            
            // Каталог
            'catalog.search.placeholder': 'Поиск по названию манги...',
            'catalog.sort.popularity': 'По популярности',
            'catalog.sort.rating': 'По рейтингу',
            'catalog.sort.updated': 'По дате обновления',
            'catalog.sort.alphabet': 'По алфавиту',
            'catalog.filters': 'Фильтры',
            'catalog.genres': 'Жанры',
            'catalog.categories': 'Категории',
            'catalog.status': 'Статус',
            'catalog.clear.filters': 'Очистить фильтры',
            'catalog.no.results': 'Ничего не найдено',
            'catalog.auth.required': 'Требуется авторизация',
            'catalog.auth.message': 'Войдите в аккаунт для просмотра полного каталога',
            
            // Плеер
            'player.episode': 'Серия',
            'player.of': 'из',
            'player.unavailable': 'недоступна',
            'player.select.episode': 'Выбор серии',
            'player.notifications': 'Уведомления',
            'player.unsubscribe': 'Отписаться',
            'player.favorite': 'Избранное',
            'player.watching': 'Смотрю',
            'player.want.watch': 'Хочу',
            'player.completed': 'Досмотрел',
            'player.stopped': 'Остановился',
            'player.cabinet': 'В кабинет',
            'player.support.project': 'Ускорить выход тайтла',
            'player.donate': 'Поддержать проект',
            'player.comments': 'Комментарии',
            'player.add.comment': 'Отправить комментарий',
            'player.comment.placeholder': 'Поделитесь своими впечатлениями о серии...',
            
            // Кабинет
            'cabinet.title': 'Личный кабинет',
            'cabinet.subtitle': 'Управляйте своими тайтлами и поддерживайте любимые серии',
            'cabinet.favorites': 'Избранное',
            'cabinet.watching': 'Смотрю',
            'cabinet.want.watch': 'Хочу посмотреть',
            'cabinet.completed': 'Досмотрел',
            'cabinet.notifications': 'Уведомления',
            'cabinet.subscription': 'Подписка',
            'cabinet.profile': 'Профиль',
            'cabinet.support.projects': 'Поддержать проекты',
            
            // Подписки
            'subs.title': 'Премиум подписки',
            'subs.subtitle': 'Откройте безграничный мир манги и аниме!',
            'subs.free': 'Любители Манги',
            'subs.basic': 'Любители Пика',
            'subs.premium': 'Орден Шейхов',
            'subs.vip': 'Лисямбы',
            'subs.popular': 'Популярный',
            'subs.select': 'Выбрать план',
            'subs.free.start': 'Начать бесплатно',
            
            // Авторизация
            'auth.welcome': 'Добро пожаловать!',
            'auth.login': 'Вход в аккаунт',
            'auth.register': 'Регистрация',
            'auth.email': 'Электронная почта',
            'auth.password': 'Пароль',
            'auth.username': 'Имя пользователя',
            'auth.confirm.password': 'Подтвердите пароль',
            'auth.remember': 'Запомнить меня',
            'auth.forgot.password': 'Забыли пароль?',
            'auth.create.account': 'Создать аккаунт',
            'auth.have.account': 'Уже есть аккаунт?',
            'auth.login.btn': 'Войти',
            'auth.register.btn': 'Создать аккаунт',
            
            // Общие
            'common.loading': 'Загрузка...',
            'common.error': 'Ошибка',
            'common.success': 'Успешно',
            'common.cancel': 'Отмена',
            'common.save': 'Сохранить',
            'common.delete': 'Удалить',
            'common.edit': 'Редактировать',
            'common.back': 'Назад',
            'common.close': 'Закрыть',
            'common.logout': 'Выйти',
            'common.dark.theme': 'Темная тема'
        },
        
        ua: {
            // Навигация
            'nav.home': 'Головна',
            'nav.catalog': 'Каталог',
            'nav.cabinet': 'Кабінет',
            'nav.subscriptions': 'Підписка',
            'nav.random': 'Випадкове',
            'nav.profile': 'Профіль',
            'nav.news': 'Новини',
            
            // Главная страница
            'home.hero.title': 'Ласкаво просимо до Light Fox Manga!',
            'home.hot.title': 'Гарячі новинки',
            'home.popular.title': 'Популярне',
            'home.news.title': 'Новини',
            'home.updates.title': 'Останні оновлення',
            'home.view.all': 'Дивитися все',
            
            // Каталог
            'catalog.search.placeholder': 'Пошук за назвою манги...',
            'catalog.sort.popularity': 'За популярністю',
            'catalog.sort.rating': 'За рейтингом',
            'catalog.sort.updated': 'За датою оновлення',
            'catalog.sort.alphabet': 'За алфавітом',
            'catalog.filters': 'Фільтри',
            'catalog.genres': 'Жанри',
            'catalog.categories': 'Категорії',
            'catalog.status': 'Статус',
            'catalog.clear.filters': 'Очистити фільтри',
            'catalog.no.results': 'Нічого не знайдено',
            'catalog.auth.required': 'Потрібна авторизація',
            'catalog.auth.message': 'Увійдіть в акаунт для перегляду повного каталогу',
            
            // Плеер
            'player.episode': 'Серія',
            'player.of': 'з',
            'player.unavailable': 'недоступна',
            'player.select.episode': 'Вибір серії',
            'player.notifications': 'Сповіщення',
            'player.unsubscribe': 'Відписатися',
            'player.favorite': 'Улюблене',
            'player.watching': 'Дивлюся',
            'player.want.watch': 'Хочу',
            'player.completed': 'Подивився',
            'player.stopped': 'Зупинився',
            'player.cabinet': 'В кабінет',
            'player.support.project': 'Прискорити вихід тайтла',
            'player.donate': 'Підтримати проект',
            'player.comments': 'Коментарі',
            'player.add.comment': 'Відправити коментар',
            'player.comment.placeholder': 'Поділіться враженнями про серію...',
            
            // Кабинет
            'cabinet.title': 'Особистий кабінет',
            'cabinet.subtitle': 'Керуйте своїми тайтлами та підтримуйте улюблені серії',
            'cabinet.favorites': 'Улюблене',
            'cabinet.watching': 'Дивлюся',
            'cabinet.want.watch': 'Хочу подивитися',
            'cabinet.completed': 'Подивився',
            'cabinet.notifications': 'Сповіщення',
            'cabinet.subscription': 'Підписка',
            'cabinet.profile': 'Профіль',
            'cabinet.support.projects': 'Підтримати проекти',
            
            // Подписки
            'subs.title': 'Преміум підписки',
            'subs.subtitle': 'Відкрийте безмежний світ манги та аніме!',
            'subs.free': 'Любителі Манги',
            'subs.basic': 'Любителі Піку',
            'subs.premium': 'Орден Шейхів',
            'subs.vip': 'Лисямби',
            'subs.popular': 'Популярний',
            'subs.select': 'Вибрати план',
            'subs.free.start': 'Почати безкоштовно',
            
            // Авторизация
            'auth.welcome': 'Ласкаво просимо!',
            'auth.login': 'Вхід в акаунт',
            'auth.register': 'Реєстрація',
            'auth.email': 'Електронна пошта',
            'auth.password': 'Пароль',
            'auth.username': 'Ім\'я користувача',
            'auth.confirm.password': 'Підтвердіть пароль',
            'auth.remember': 'Запам\'ятати мене',
            'auth.forgot.password': 'Забули пароль?',
            'auth.create.account': 'Створити акаунт',
            'auth.have.account': 'Вже є акаунт?',
            'auth.login.btn': 'Увійти',
            'auth.register.btn': 'Створити акаунт',
            
            // Общие
            'common.loading': 'Завантаження...',
            'common.error': 'Помилка',
            'common.success': 'Успішно',
            'common.cancel': 'Скасувати',
            'common.save': 'Зберегти',
            'common.delete': 'Видалити',
            'common.edit': 'Редагувати',
            'common.back': 'Назад',
            'common.close': 'Закрити',
            'common.logout': 'Вийти',
            'common.dark.theme': 'Темна тема'
        },
        
        en: {
            // Navigation
            'nav.home': 'Home',
            'nav.catalog': 'Catalog',
            'nav.cabinet': 'Cabinet',
            'nav.subscriptions': 'Subscription',
            'nav.random': 'Random',
            'nav.profile': 'Profile',
            'nav.news': 'News',
            
            // Home page
            'home.hero.title': 'Welcome to Light Fox Manga!',
            'home.hot.title': 'Hot New Releases',
            'home.popular.title': 'Popular',
            'home.news.title': 'News',
            'home.updates.title': 'Recent Updates',
            'home.view.all': 'View All',
            
            // Catalog
            'catalog.search.placeholder': 'Search manga titles...',
            'catalog.sort.popularity': 'By Popularity',
            'catalog.sort.rating': 'By Rating',
            'catalog.sort.updated': 'By Update Date',
            'catalog.sort.alphabet': 'Alphabetically',
            'catalog.filters': 'Filters',
            'catalog.genres': 'Genres',
            'catalog.categories': 'Categories',
            'catalog.status': 'Status',
            'catalog.clear.filters': 'Clear Filters',
            'catalog.no.results': 'No Results Found',
            'catalog.auth.required': 'Authorization Required',
            'catalog.auth.message': 'Login to view the full catalog',
            
            // Player
            'player.episode': 'Episode',
            'player.of': 'of',
            'player.unavailable': 'unavailable',
            'player.select.episode': 'Select Episode',
            'player.notifications': 'Notifications',
            'player.unsubscribe': 'Unsubscribe',
            'player.favorite': 'Favorite',
            'player.watching': 'Watching',
            'player.want.watch': 'Want to Watch',
            'player.completed': 'Completed',
            'player.stopped': 'Paused',
            'player.cabinet': 'To Cabinet',
            'player.support.project': 'Speed up title release',
            'player.donate': 'Support Project',
            'player.comments': 'Comments',
            'player.add.comment': 'Post Comment',
            'player.comment.placeholder': 'Share your thoughts about this episode...',
            
            // Cabinet
            'cabinet.title': 'Personal Cabinet',
            'cabinet.subtitle': 'Manage your titles and support favorite series',
            'cabinet.favorites': 'Favorites',
            'cabinet.watching': 'Watching',
            'cabinet.want.watch': 'Want to Watch',
            'cabinet.completed': 'Completed',
            'cabinet.notifications': 'Notifications',
            'cabinet.subscription': 'Subscription',
            'cabinet.profile': 'Profile',
            'cabinet.support.projects': 'Support Projects',
            
            // Subscriptions
            'subs.title': 'Premium Subscriptions',
            'subs.subtitle': 'Unlock the limitless world of manga and anime!',
            'subs.free': 'Manga Lovers',
            'subs.basic': 'Peak Lovers',
            'subs.premium': 'Sheikh Order',
            'subs.vip': 'Foxes',
            'subs.popular': 'Popular',
            'subs.select': 'Select Plan',
            'subs.free.start': 'Start Free',
            
            // Authorization
            'auth.welcome': 'Welcome!',
            'auth.login': 'Login',
            'auth.register': 'Registration',
            'auth.email': 'Email',
            'auth.password': 'Password',
            'auth.username': 'Username',
            'auth.confirm.password': 'Confirm Password',
            'auth.remember': 'Remember Me',
            'auth.forgot.password': 'Forgot Password?',
            'auth.create.account': 'Create Account',
            'auth.have.account': 'Already have an account?',
            'auth.login.btn': 'Login',
            'auth.register.btn': 'Create Account',
            
            // Common
            'common.loading': 'Loading...',
            'common.error': 'Error',
            'common.success': 'Success',
            'common.cancel': 'Cancel',
            'common.save': 'Save',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.back': 'Back',
            'common.close': 'Close',
            'common.logout': 'Logout',
            'common.dark.theme': 'Dark Theme'
        }
    };

    class LanguageSystem {
        constructor() {
            this.currentLanguage = this.loadLanguage();
            this.translations = TRANSLATIONS;
            this.initializeSystem();
        }

        // Загрузка сохраненного языка
        loadLanguage() {
            const saved = localStorage.getItem('language');
            if (saved && this.translations[saved]) {
                return saved;
            }
            
            // Определяем по браузеру
            const browserLang = navigator.language || navigator.languages[0] || 'en';
            
            if (browserLang.startsWith('ru')) return 'ru';
            if (browserLang.startsWith('uk')) return 'ua';
            
            return 'en'; // По умолчанию английский
        }

        // Инициализация системы
        initializeSystem() {
            this.updateLanguage(this.currentLanguage);
            this.setupLanguageSelectors();
            console.log(`🌍 Язык установлен: ${this.currentLanguage}`);
        }

        // Настройка селекторов языка
        setupLanguageSelectors() {
            const selectors = document.querySelectorAll('#langSwitch, #mobileLangSwitch');
            selectors.forEach(selector => {
                if (selector) {
                    selector.value = this.currentLanguage;
                    selector.addEventListener('change', (e) => {
                        this.updateLanguage(e.target.value);
                    });
                }
            });
        }

        // Обновление языка
        updateLanguage(lang) {
            if (!this.translations[lang]) {
                console.warn(`Язык ${lang} не поддерживается`);
                return;
            }

            this.currentLanguage = lang;
            localStorage.setItem('language', lang);
            
            // Обновляем все селекторы
            const selectors = document.querySelectorAll('#langSwitch, #mobileLangSwitch');
            selectors.forEach(selector => {
                if (selector) selector.value = lang;
            });
            
            // Переводим страницу
            this.translatePage();
            
            // Уведомляем об изменении
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: lang }
            }));
        }

        // Перевод страницы
        translatePage() {
            // Переводим элементы с data-translate
            document.querySelectorAll('[data-translate]').forEach(element => {
                const key = element.getAttribute('data-translate');
                const translation = this.getTranslation(key);
                
                if (translation) {
                    if (element.tagName === 'INPUT' && element.type !== 'submit') {
                        element.placeholder = translation;
                    } else {
                        element.textContent = translation;
                    }
                }
            });

            // Переводим элементы с data-translate-html (для HTML контента)
            document.querySelectorAll('[data-translate-html]').forEach(element => {
                const key = element.getAttribute('data-translate-html');
                const translation = this.getTranslation(key);
                
                if (translation) {
                    element.innerHTML = translation;
                }
            });
        }

        // Получение перевода
        getTranslation(key) {
            const langData = this.translations[this.currentLanguage];
            return langData ? langData[key] : key;
        }

        // Получение текущего языка
        getCurrentLanguage() {
            return this.currentLanguage;
        }

        // Добавление нового перевода
        addTranslation(lang, key, value) {
            if (!this.translations[lang]) {
                this.translations[lang] = {};
            }
            this.translations[lang][key] = value;
        }
    }

    // Создаем глобальный экземпляр
    window.LanguageSystem = new LanguageSystem();

    // Функция для быстрого перевода
    window.t = (key) => window.LanguageSystem.getTranslation(key);

    console.log('🌍 Система многоязычности загружена');

})();