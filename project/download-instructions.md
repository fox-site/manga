# 🦊 Light Fox Manga - Инструкция по скачиванию

## 📦 Структура проекта:

```
light-fox-manga/
├── 📁 css/                    # Стили
│   ├── auth.css
│   ├── cabinet.css
│   ├── catalog.css
│   ├── index.css
│   ├── menu.css
│   ├── player.css
│   ├── subscriptions.css
│   └── admin.css
├── 📁 js/                     # JavaScript
│   ├── config.js
│   ├── supabase-init.js
│   ├── supabase-integration.js
│   ├── enhanced-auth.js
│   ├── compatibility-layer.js
│   ├── supabase-client.js
│   ├── supabase-manga.js
│   ├── supabase-auth.js
│   ├── supabase-comments.js
│   ├── admin.js
│   ├── data.js
│   ├── menu.js
│   ├── catalog.js
│   ├── player.js
│   ├── cabinet.js
│   ├── subscriptions.js
│   ├── index.js
│   ├── auth.js
│   ├── access-control.js
│   ├── currency-system.js
│   ├── donor-ranking.js
│   ├── language-system.js
│   ├── notifications-system.js
│   ├── payment-system.js
│   ├── profile-system.js
│   ├── rating-system.js
│   └── server-optimization.js
├── 📁 lib/                    # TypeScript библиотеки
│   ├── supabase.ts
│   ├── auth.ts
│   ├── manga.ts
│   ├── comments.ts
│   ├── ratings.ts
│   ├── donations.ts
│   ├── notifications.ts
│   └── user-lists.ts
├── 📁 supabase/               # База данных
│   ├── 📁 migrations/         # SQL миграции
│   │   ├── create_users_table.sql
│   │   ├── create_manga_table.sql
│   │   ├── create_episodes_table.sql
│   │   ├── create_comments_table.sql
│   │   ├── create_ratings_table.sql
│   │   ├── create_donations_table.sql
│   │   ├── create_notifications_table.sql
│   │   ├── create_subscriptions_table.sql
│   │   ├── create_user_lists_table.sql
│   │   └── insert_sample_data.sql
│   └── 📁 functions/          # Edge Functions
│       ├── geo-restriction/
│       ├── process-payment/
│       ├── send-notifications/
│       └── moderate-comments/
├── 📄 index.html              # Главная страница
├── 📄 catalog.html            # Каталог
├── 📄 player.html             # Видео плеер
├── 📄 cabinet.html            # Личный кабинет
├── 📄 subscriptions.html      # Подписки
├── 📄 registr.html            # Авторизация
├── 📄 admin2.html             # Админ панель
├── 📄 package.json            # Зависимости
├── 📄 vite.config.js          # Конфигурация Vite
├── 📄 .env                    # Переменные окружения
├── 📄 .env.example            # Пример настроек
└── 📄 README.md               # Документация
```

## 🚀 Запуск проекта:

### 1. Установка зависимостей:
```bash
npm install
```

### 2. Локальный запуск:
```bash
npm run dev
```

### 3. Открыть в браузере:
```
http://localhost:3000
```

### 4. Админ панель:
```
http://localhost:3000/admin2.html
Email: admin@lightfox.com
Пароль: admin123
```

## 🔧 Настройка Supabase:

1. Создайте проект на supabase.com
2. Скопируйте URL и ключи в .env файл
3. Миграции применятся автоматически
4. Геоблокировка активируется

## 🌍 Геоблокировка:
- 🚫 Южная Корея
- 🚫 Германия  
- 🚫 Китай
- 🚫 Япония

## 💡 Особенности:
- 📱 Адаптивный дизайн
- 🌙 Темная/светлая тема
- 🌍 Многоязычность (RU/UA/EN)
- 💰 Региональные валюты
- 🔔 Real-time уведомления
- 💳 Stripe платежи