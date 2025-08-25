// Система оплаты для Light Fox Manga
(function() {
    'use strict';

    class PaymentSystem {
        constructor() {
            this.pendingPayments = this.loadPendingPayments();
            this.paymentHistory = this.loadPaymentHistory();
        }

        // Загрузка ожидающих платежей
        loadPendingPayments() {
            try {
                return JSON.parse(localStorage.getItem('pending_payments') || '[]');
            } catch (e) {
                return [];
            }
        }

        // Сохранение ожидающих платежей
        savePendingPayments() {
            localStorage.setItem('pending_payments', JSON.stringify(this.pendingPayments));
        }

        // Загрузка истории платежей
        loadPaymentHistory() {
            try {
                return JSON.parse(localStorage.getItem('payment_history') || '[]');
            } catch (e) {
                return [];
            }
        }

        // Сохранение истории платежей
        savePaymentHistory() {
            localStorage.setItem('payment_history', JSON.stringify(this.paymentHistory));
        }

        // Создание платежа для доната
        createDonationPayment(mangaId, amount, mangaTitle) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) {
                throw new Error('Пользователь не авторизован');
            }

            const payment = {
                id: 'payment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                type: 'donation',
                userId: currentUser.id,
                mangaId: mangaId,
                mangaTitle: mangaTitle,
                amount: amount,
                currency: window.CurrencySystem ? window.CurrencySystem.getCurrentCurrency().symbol : '₽',
                status: 'pending',
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 минут
            };

            this.pendingPayments.push(payment);
            this.savePendingPayments();

            return payment;
        }

        // Создание платежа для подписки
        createSubscriptionPayment(planType, planData) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) {
                throw new Error('Пользователь не авторизован');
            }

            const payment = {
                id: 'payment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                type: 'subscription',
                userId: currentUser.id,
                planType: planType,
                planName: planData.name,
                amount: planData.price,
                currency: window.CurrencySystem ? window.CurrencySystem.getCurrentCurrency().symbol : '₽',
                status: 'pending',
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 минут
            };

            this.pendingPayments.push(payment);
            this.savePendingPayments();

            return payment;
        }

        // Симуляция перехода на страницу оплаты
        redirectToPayment(paymentId) {
            const payment = this.pendingPayments.find(p => p.id === paymentId);
            if (!payment) {
                throw new Error('Платеж не найден');
            }

            // Создаем страницу оплаты
            this.showPaymentPage(payment);
        }

        // Показ страницы оплаты
        showPaymentPage(payment) {
            const paymentModal = document.createElement('div');
            paymentModal.id = 'paymentModal';
            paymentModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            `;

            const currencySymbol = payment.currency;
            const displayAmount = payment.amount;

            paymentModal.innerHTML = `
                <div style="
                    background: var(--card-bg);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 500px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                ">
                    <div style="font-size: 4rem; margin-bottom: 20px;">💳</div>
                    <h2 style="color: var(--text-color); margin-bottom: 10px;">Оплата</h2>
                    <p style="color: var(--secondary-color); margin-bottom: 30px;">
                        ${payment.type === 'donation' ? 
                            `Донат для "${payment.mangaTitle}"` : 
                            `Подписка "${payment.planName}"`
                        }
                    </p>
                    
                    <div style="
                        background: var(--bg-color);
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 30px;
                        border: 2px solid var(--primary-color);
                    ">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">
                            ${displayAmount}${currencySymbol}
                        </div>
                        <div style="color: var(--secondary-color); font-size: 0.9rem;">
                            К оплате
                        </div>
                    </div>

                    <div style="
                        background: rgba(16, 185, 129, 0.1);
                        border: 1px solid rgba(16, 185, 129, 0.3);
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 20px;
                        font-size: 0.9rem;
                        color: var(--text-color);
                    ">
                        🔒 Это демо-версия. В реальной версии здесь будет интеграция с платежной системой.
                    </div>

                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button onclick="window.PaymentSystem.confirmPayment('${payment.id}')" style="
                            background: var(--primary-color);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">
                            ✅ Подтвердить оплату
                        </button>
                        <button onclick="window.PaymentSystem.cancelPayment('${payment.id}')" style="
                            background: var(--border-color);
                            color: var(--secondary-color);
                            border: none;
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">
                            ❌ Отмена
                        </button>
                    </div>

                    <div style="margin-top: 20px; font-size: 0.8rem; color: var(--secondary-color);">
                        Платеж истекает через 15 минут
                    </div>
                </div>
            `;

            document.body.appendChild(paymentModal);

            // Автоматическое закрытие через 15 минут
            setTimeout(() => {
                this.cancelPayment(payment.id);
            }, 15 * 60 * 1000);
        }

        // Подтверждение платежа
        confirmPayment(paymentId) {
            const payment = this.pendingPayments.find(p => p.id === paymentId);
            if (!payment) {
                this.showNotification('Платеж не найден', 'error');
                return;
            }

            // Обновляем статус
            payment.status = 'completed';
            payment.completedAt = new Date().toISOString();

            // Применяем платеж
            if (payment.type === 'donation') {
                this.processDonation(payment);
            } else if (payment.type === 'subscription') {
                this.processSubscription(payment);
            }

            // Перемещаем в историю
            this.paymentHistory.push(payment);
            this.pendingPayments = this.pendingPayments.filter(p => p.id !== paymentId);
            
            this.savePendingPayments();
            this.savePaymentHistory();

            // Закрываем модал
            this.closePaymentModal();

            this.showNotification('Оплата прошла успешно!', 'success');
        }

        // Отмена платежа
        cancelPayment(paymentId) {
            const payment = this.pendingPayments.find(p => p.id === paymentId);
            if (payment) {
                payment.status = 'cancelled';
                payment.cancelledAt = new Date().toISOString();
                
                this.pendingPayments = this.pendingPayments.filter(p => p.id !== paymentId);
                this.savePendingPayments();
            }

            this.closePaymentModal();
            this.showNotification('Платеж отменен', 'warning');
        }

        // Обработка доната
        processDonation(payment) {
            if (!window.MangaAPI) return;

            const manga = window.MangaAPI.getMangaById(payment.mangaId);
            if (manga) {
                // Конвертируем в рубли для сохранения
                let amountInRubles = payment.amount;
                if (window.CurrencySystem && window.CurrencySystem.getCurrentRegion() !== 'RU') {
                    amountInRubles = window.CurrencySystem.convertToRubles(payment.amount);
                }

                const newTotal = Math.min(
                    (manga.currentDonations || 0) + amountInRubles, 
                    manga.donationGoal || 10000
                );
                
                window.MangaAPI.updateManga(payment.mangaId, {
                    currentDonations: newTotal
                });

                // Сохраняем в историю донатов пользователя
                const donationHistory = JSON.parse(localStorage.getItem('donationHistory') || '[]');
                donationHistory.push({
                    mangaId: payment.mangaId,
                    mangaTitle: payment.mangaTitle,
                    amount: amountInRubles,
                    originalAmount: payment.amount,
                    currency: payment.currency,
                    timestamp: payment.completedAt,
                    paymentId: payment.id
                });
                localStorage.setItem('donationHistory', JSON.stringify(donationHistory));

                // Обновляем статистику пользователя
                if (window.ProfileSystem) {
                    window.ProfileSystem.updateStats('totalDonations', amountInRubles);
                }
                
                // Обновляем рейтинг донора
                if (window.DonorRankingSystem) {
                    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
                    if (currentUser) {
                        window.DonorRankingSystem.updateUserDonation(
                            currentUser.id, 
                            amountInRubles, 
                            payment.mangaTitle
                        );
                    }
                }
                
                // Уведомляем о завершении доната
                window.dispatchEvent(new CustomEvent('donationCompleted', {
                    detail: { 
                        userId: JSON.parse(localStorage.getItem('currentUser') || 'null')?.id,
                        amount: amountInRubles, 
                        mangaTitle: payment.mangaTitle 
                    }
                }));
            }
        }

        // Обработка подписки
        processSubscription(payment) {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 месяц

            const subscription = {
                planType: payment.planType,
                planName: payment.planName,
                tier: payment.planType.charAt(0).toUpperCase() + payment.planType.slice(1),
                price: payment.amount,
                currency: payment.currency,
                activatedAt: payment.completedAt,
                expiresAt: expiresAt.toISOString(),
                paymentId: payment.id
            };

            localStorage.setItem('userSubscription', JSON.stringify(subscription));
        }

        // Закрытие модала оплаты
        closePaymentModal() {
            const modal = document.getElementById('paymentModal');
            if (modal) {
                modal.remove();
            }
        }

        // Показ уведомления
        showNotification(message, type = 'success') {
            if (window.showNotification) {
                window.showNotification(message, type);
            } else {
                alert(message);
            }
        }

        // Очистка истекших платежей
        cleanExpiredPayments() {
            const now = new Date();
            this.pendingPayments = this.pendingPayments.filter(payment => {
                return new Date(payment.expiresAt) > now;
            });
            this.savePendingPayments();
        }

        // Получение истории платежей пользователя
        getUserPaymentHistory() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return [];

            return this.paymentHistory.filter(payment => payment.userId === currentUser.id);
        }
    }

    // Создаем глобальный экземпляр
    window.PaymentSystem = new PaymentSystem();

    // Автоочистка истекших платежей
    setInterval(() => {
        window.PaymentSystem.cleanExpiredPayments();
    }, 60000); // Каждую минуту

    console.log('💳 Система оплаты загружена');

})();