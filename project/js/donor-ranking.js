// Система рейтинга доноров для Light Fox Manga
(function() {
    'use strict';

    class DonorRankingSystem {
        constructor() {
            this.rankings = this.loadRankings();
            this.initializeSystem();
        }

        // Загрузка рейтингов
        loadRankings() {
            try {
                return JSON.parse(localStorage.getItem('donor_rankings') || '{}');
            } catch (e) {
                return {};
            }
        }

        // Сохранение рейтингов
        saveRankings() {
            localStorage.setItem('donor_rankings', JSON.stringify(this.rankings));
        }

        // Обновление рейтинга пользователя
        updateUserDonation(userId, amount, mangaTitle) {
            if (!this.rankings[userId]) {
                this.rankings[userId] = {
                    totalDonated: 0,
                    donationCount: 0,
                    firstDonation: new Date().toISOString(),
                    lastDonation: new Date().toISOString(),
                    favoriteManga: {},
                    donationHistory: []
                };
            }

            const userRanking = this.rankings[userId];
            userRanking.totalDonated += amount;
            userRanking.donationCount += 1;
            userRanking.lastDonation = new Date().toISOString();

            // Обновляем любимую мангу
            if (!userRanking.favoriteManga[mangaTitle]) {
                userRanking.favoriteManga[mangaTitle] = 0;
            }
            userRanking.favoriteManga[mangaTitle] += amount;

            // Добавляем в историю
            userRanking.donationHistory.push({
                amount: amount,
                mangaTitle: mangaTitle,
                timestamp: new Date().toISOString()
            });

            this.saveRankings();
            this.updateUserRank(userId);
        }

        // Обновление ранга пользователя
        updateUserRank(userId) {
            const topDonors = this.getTopDonors();
            const userPosition = topDonors.findIndex(donor => donor.userId === userId) + 1;
            
            if (userPosition > 0 && userPosition <= 10) {
                const rank = this.getRankInfo(userPosition);
                
                // Обновляем профиль пользователя
                if (window.ProfileSystem) {
                    const profile = window.ProfileSystem.getCurrentUserProfile();
                    if (profile && profile.id === userId) {
                        window.ProfileSystem.updateProfile({
                            donorRank: userPosition,
                            donorBadge: rank.badge,
                            donorTitle: rank.title
                        });
                    }
                }
            }
        }

        // Получение информации о ранге
        getRankInfo(position) {
            const ranks = {
                1: { 
                    badge: '👑', 
                    title: 'Алмазный Донор', 
                    color: '#e3f2fd',
                    borderColor: '#2196f3',
                    glowColor: 'rgba(33, 150, 243, 0.5)'
                },
                2: { 
                    badge: '🥇', 
                    title: 'Золотой Донор', 
                    color: '#fff8e1',
                    borderColor: '#ffc107',
                    glowColor: 'rgba(255, 193, 7, 0.5)'
                },
                3: { 
                    badge: '🥈', 
                    title: 'Серебряный Донор', 
                    color: '#f3e5f5',
                    borderColor: '#9c27b0',
                    glowColor: 'rgba(156, 39, 176, 0.5)'
                },
                4: { 
                    badge: '🥉', 
                    title: 'Бронзовый Донор', 
                    color: '#efebe9',
                    borderColor: '#795548',
                    glowColor: 'rgba(121, 85, 72, 0.5)'
                }
            };

            if (position <= 4) {
                return ranks[position];
            } else if (position <= 10) {
                return {
                    badge: '⭐',
                    title: `Топ-${position} Донор`,
                    color: '#f1f8e9',
                    borderColor: '#8bc34a',
                    glowColor: 'rgba(139, 195, 74, 0.5)'
                };
            }

            return null;
        }

        // Получение топ доноров
        getTopDonors(limit = 10) {
            const donors = [];

            Object.keys(this.rankings).forEach(userId => {
                const ranking = this.rankings[userId];
                const user = this.getUserInfo(userId);
                
                if (user && ranking.totalDonated > 0) {
                    donors.push({
                        userId: userId,
                        username: user.username || user.name || 'Пользователь',
                        email: user.email,
                        avatar: user.avatar,
                        totalDonated: ranking.totalDonated,
                        donationCount: ranking.donationCount,
                        firstDonation: ranking.firstDonation,
                        lastDonation: ranking.lastDonation,
                        daysSinceDonation: this.getDaysSince(ranking.lastDonation),
                        favoriteManga: this.getFavoriteManga(ranking.favoriteManga)
                    });
                }
            });

            return donors
                .sort((a, b) => b.totalDonated - a.totalDonated)
                .slice(0, limit)
                .map((donor, index) => ({
                    ...donor,
                    position: index + 1,
                    rank: this.getRankInfo(index + 1)
                }));
        }

        // Получение информации о пользователе
        getUserInfo(userId) {
            // Из системы авторизации
            if (window.AuthSystem) {
                const user = window.AuthSystem.users.find(u => u.id === userId);
                if (user) return user;
            }

            // Из системы профилей
            if (window.ProfileSystem && window.ProfileSystem._system) {
                const profile = window.ProfileSystem._system.profiles[userId];
                if (profile) return profile;
            }

            // Fallback из currentUser
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (currentUser && currentUser.id === userId) {
                return currentUser;
            }

            return null;
        }

        // Получение любимой манги
        getFavoriteManga(favoriteManga) {
            if (!favoriteManga || Object.keys(favoriteManga).length === 0) {
                return null;
            }

            const sorted = Object.entries(favoriteManga)
                .sort(([,a], [,b]) => b - a);
            
            return {
                title: sorted[0][0],
                amount: sorted[0][1]
            };
        }

        // Получение дней с последнего доната
        getDaysSince(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            return Math.floor((now - date) / (1000 * 60 * 60 * 24));
        }

        // Получение ранга пользователя
        getUserRank(userId) {
            const topDonors = this.getTopDonors();
            const donor = topDonors.find(d => d.userId === userId);
            return donor ? donor.position : null;
        }

        // Создание HTML для аватара с рангом
        createRankedAvatar(userId, size = 'medium') {
            const user = this.getUserInfo(userId);
            if (!user) return '';

            const rank = this.getUserRank(userId);
            const rankInfo = rank ? this.getRankInfo(rank) : null;

            const sizes = {
                small: { avatar: 32, badge: 16 },
                medium: { avatar: 60, badge: 24 },
                large: { avatar: 120, badge: 32 }
            };

            const sizeConfig = sizes[size] || sizes.medium;

            const avatarStyle = rankInfo ? `
                border: 3px solid ${rankInfo.borderColor};
                box-shadow: 0 0 20px ${rankInfo.glowColor};
                background: ${rankInfo.color};
            ` : '';

            const badgeStyle = rankInfo ? `
                position: absolute;
                top: -8px;
                right: -8px;
                width: ${sizeConfig.badge}px;
                height: ${sizeConfig.badge}px;
                background: ${rankInfo.borderColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${sizeConfig.badge * 0.6}px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                animation: glow 2s ease-in-out infinite alternate;
            ` : '';

            return `
                <div style="position: relative; display: inline-block;">
                    <div style="
                        width: ${sizeConfig.avatar}px;
                        height: ${sizeConfig.avatar}px;
                        border-radius: 50%;
                        overflow: hidden;
                        ${avatarStyle}
                        transition: all 0.3s ease;
                    ">
                        ${user.avatar ? 
                            `<img src="${user.avatar}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover;">` :
                            `<div style="
                                width: 100%;
                                height: 100%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: 600;
                                font-size: ${sizeConfig.avatar * 0.4}px;
                                color: var(--primary-color);
                            ">${(user.username || 'П').charAt(0).toUpperCase()}</div>`
                        }
                    </div>
                    ${rankInfo ? `
                        <div style="${badgeStyle}" title="${rankInfo.title}">
                            ${rankInfo.badge}
                        </div>
                    ` : ''}
                </div>
                
                <style>
                    @keyframes glow {
                        from { box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
                        to { box-shadow: 0 4px 16px ${rankInfo?.glowColor || 'rgba(0,0,0,0.3)'}; }
                    }
                </style>
            `;
        }

        // Инициализация системы
        initializeSystem() {
            // Слушаем события донатов
            window.addEventListener('donationCompleted', (e) => {
                const { userId, amount, mangaTitle } = e.detail;
                this.updateUserDonation(userId, amount, mangaTitle);
            });

            console.log('🏆 Система рейтинга доноров загружена');
        }

        // Получение статистики пользователя
        getUserStats(userId) {
            const ranking = this.rankings[userId];
            if (!ranking) return null;

            const rank = this.getUserRank(userId);
            const rankInfo = rank ? this.getRankInfo(rank) : null;

            return {
                totalDonated: ranking.totalDonated,
                donationCount: ranking.donationCount,
                averageDonation: Math.round(ranking.totalDonated / ranking.donationCount),
                daysSinceFirst: this.getDaysSince(ranking.firstDonation),
                daysSinceLast: this.getDaysSince(ranking.lastDonation),
                rank: rank,
                rankInfo: rankInfo,
                favoriteManga: ranking.favoriteManga
            };
        }
    }

    // Создаем глобальный экземпляр
    window.DonorRankingSystem = new DonorRankingSystem();

    console.log('🏆 Система рейтинга доноров загружена');

})();