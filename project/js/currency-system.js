// Система региональных валют для Light Fox Manga
(function() {
    'use strict';

    // Конфигурация валют по регионам
    const CURRENCY_CONFIG = {
        'RU': { symbol: '₽', rate: 1, name: 'рубль' },
        'UA': { symbol: '$', rate: 0.027, name: 'доллар' },
        'KZ': { symbol: '$', rate: 0.0022, name: 'доллар' },
        'BY': { symbol: '$', rate: 0.031, name: 'доллар' },
        'US': { symbol: '$', rate: 0.011, name: 'доллар' },
        'DEFAULT': { symbol: '$', rate: 0.011, name: 'доллар' }
    };

    class CurrencySystem {
        constructor() {
            this.currentRegion = this.detectRegion();
            this.currentCurrency = CURRENCY_CONFIG[this.currentRegion] || CURRENCY_CONFIG.DEFAULT;
            this.initializeSystem();
        }

        // Определение региона пользователя
        detectRegion() {
            // Сначала проверяем сохраненный регион
            const savedRegion = localStorage.getItem('user_region');
            if (savedRegion && CURRENCY_CONFIG[savedRegion]) {
                return savedRegion;
            }

            // Определяем по языку браузера
            const language = navigator.language || navigator.languages[0] || 'en';
            
            if (language.startsWith('ru')) return 'RU';
            if (language.startsWith('uk')) return 'UA';
            if (language.startsWith('kk')) return 'KZ';
            if (language.startsWith('be')) return 'BY';
            
            // Определяем по часовому поясу
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            if (timezone.includes('Moscow') || timezone.includes('Europe/Moscow')) return 'RU';
            if (timezone.includes('Kiev') || timezone.includes('Europe/Kiev')) return 'UA';
            if (timezone.includes('Almaty') || timezone.includes('Asia/Almaty')) return 'KZ';
            if (timezone.includes('Minsk') || timezone.includes('Europe/Minsk')) return 'BY';
            
            return 'DEFAULT';
        }

        // Инициализация системы
        initializeSystem() {
            // Сохраняем определенный регион
            localStorage.setItem('user_region', this.currentRegion);
            
            // Уведомляем о готовности системы
            window.dispatchEvent(new CustomEvent('currencySystemReady', {
                detail: { 
                    region: this.currentRegion,
                    currency: this.currentCurrency
                }
            }));
            
            console.log(`💰 Валютная система: ${this.currentRegion} (${this.currentCurrency.symbol})`);
        }

        // Конвертация суммы
        convertAmount(rubleAmount) {
            if (this.currentRegion === 'RU') {
                return Math.round(rubleAmount);
            }
            
            const converted = rubleAmount * this.currentCurrency.rate;
            return Math.round(converted);
        }

        // Форматирование суммы для отображения
        formatAmount(rubleAmount) {
            const converted = this.convertAmount(rubleAmount);
            return `${converted.toLocaleString()}${this.currentCurrency.symbol}`;
        }

        // Получение текущей валюты
        getCurrentCurrency() {
            return this.currentCurrency;
        }

        // Получение региона
        getCurrentRegion() {
            return this.currentRegion;
        }

        // Ручная смена региона
        setRegion(region) {
            if (CURRENCY_CONFIG[region]) {
                this.currentRegion = region;
                this.currentCurrency = CURRENCY_CONFIG[region];
                localStorage.setItem('user_region', region);
                
                // Обновляем все суммы на странице
                this.updateAllAmounts();
                
                console.log(`💰 Регион изменен: ${region} (${this.currentCurrency.symbol})`);
            }
        }

        // Обновление всех сумм на странице
        updateAllAmounts() {
            // Обновляем донаты
            document.querySelectorAll('[data-amount]').forEach(element => {
                const rubleAmount = parseInt(element.dataset.amount);
                if (!isNaN(rubleAmount)) {
                    element.textContent = this.formatAmount(rubleAmount);
                }
            });

            // Обновляем цены подписок
            document.querySelectorAll('[data-price]').forEach(element => {
                const rublePrice = parseInt(element.dataset.price);
                if (!isNaN(rublePrice)) {
                    element.textContent = this.formatAmount(rublePrice);
                }
            });

            // Уведомляем об обновлении
            window.dispatchEvent(new CustomEvent('currencyUpdated', {
                detail: { 
                    region: this.currentRegion,
                    currency: this.currentCurrency
                }
            }));
        }

        // Конвертация обратно в рубли (для сохранения)
        convertToRubles(localAmount) {
            if (this.currentRegion === 'RU') {
                return localAmount;
            }
            
            return Math.round(localAmount / this.currentCurrency.rate);
        }
    }

    // Создаем глобальный экземпляр
    window.CurrencySystem = new CurrencySystem();

    console.log('💰 Система региональных валют загружена');

})();