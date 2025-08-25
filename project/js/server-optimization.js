// Система оптимизации для работы с сервером
(function() {
    'use strict';

    class ServerOptimization {
        constructor() {
            this.imageCache = new Map();
            this.dataCache = new Map();
            this.compressionEnabled = true;
            this.lazyLoadingEnabled = true;
            this.initializeOptimizations();
        }

        // Инициализация оптимизаций
        initializeOptimizations() {
            this.setupImageOptimization();
            this.setupDataCompression();
            this.setupLazyLoading();
            this.setupCaching();
            console.log('🚀 Оптимизация для сервера активирована');
        }

        // Оптимизация изображений
        setupImageOptimization() {
            // Автоматическое сжатие изображений при загрузке
            document.addEventListener('change', (e) => {
                if (e.target.type === 'file' && e.target.accept?.includes('image')) {
                    this.compressImage(e.target.files[0])
                        .then(compressed => {
                            // Заменяем файл сжатым
                            const dt = new DataTransfer();
                            dt.items.add(compressed);
                            e.target.files = dt.files;
                        })
                        .catch(console.error);
                }
            });

            // Ленивая загрузка изображений
            this.setupImageLazyLoading();
        }

        // Сжатие изображений
        compressImage(file, maxWidth = 800, maxHeight = 1200, quality = 0.8) {
            return new Promise((resolve, reject) => {
                if (!file || !file.type.startsWith('image/')) {
                    reject(new Error('Не является изображением'));
                    return;
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                img.onload = () => {
                    // Вычисляем новые размеры
                    let { width, height } = img;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }

                    // Устанавливаем размеры canvas
                    canvas.width = width;
                    canvas.height = height;

                    // Рисуем сжатое изображение
                    ctx.drawImage(img, 0, 0, width, height);

                    // Конвертируем в blob
                    canvas.toBlob(
                        (blob) => {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        quality
                    );
                };

                img.onerror = () => reject(new Error('Ошибка загрузки изображения'));
                img.src = URL.createObjectURL(file);
            });
        }

        // Ленивая загрузка изображений
        setupImageLazyLoading() {
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.removeAttribute('data-src');
                                imageObserver.unobserve(img);
                            }
                        }
                    });
                });

                // Наблюдаем за всеми изображениями с data-src
                document.addEventListener('DOMContentLoaded', () => {
                    document.querySelectorAll('img[data-src]').forEach(img => {
                        imageObserver.observe(img);
                    });
                });

                // Наблюдаем за динамически добавляемыми изображениями
                const mutationObserver = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                const lazyImages = node.querySelectorAll ? 
                                    node.querySelectorAll('img[data-src]') : [];
                                lazyImages.forEach(img => imageObserver.observe(img));
                            }
                        });
                    });
                });

                mutationObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        }

        // Сжатие данных для localStorage
        setupDataCompression() {
            // Простое сжатие JSON данных
            this.compressData = (data) => {
                try {
                    const jsonString = JSON.stringify(data);
                    // Простое сжатие: удаляем лишние пробелы и сокращаем ключи
                    return jsonString.replace(/\s+/g, ' ').trim();
                } catch (e) {
                    return data;
                }
            };

            this.decompressData = (compressedData) => {
                try {
                    return JSON.parse(compressedData);
                } catch (e) {
                    return compressedData;
                }
            };
        }

        // Кэширование данных
        setupCaching() {
            // Кэш для часто используемых данных
            this.getCachedData = (key, fetchFunction, ttl = 300000) => { // 5 минут TTL
                const cached = this.dataCache.get(key);
                const now = Date.now();

                if (cached && (now - cached.timestamp) < ttl) {
                    return cached.data;
                }

                const data = fetchFunction();
                this.dataCache.set(key, {
                    data: data,
                    timestamp: now
                });

                return data;
            };

            // Очистка старого кэша
            setInterval(() => {
                const now = Date.now();
                for (const [key, value] of this.dataCache.entries()) {
                    if (now - value.timestamp > 600000) { // 10 минут
                        this.dataCache.delete(key);
                    }
                }
            }, 300000); // Проверяем каждые 5 минут
        }

        // Оптимизация изображений для отображения
        optimizeImageUrl(url, width = 300, height = 450) {
            if (!url) return null;

            // Если это placeholder, оптимизируем размер
            if (url.includes('placeholder.com')) {
                return url.replace(/\/\d+x\d+\//, `/${width}x${height}/`);
            }

            // Для внешних изображений добавляем параметры сжатия
            if (url.includes('pexels.com') || url.includes('unsplash.com')) {
                const separator = url.includes('?') ? '&' : '?';
                return `${url}${separator}w=${width}&h=${height}&fit=crop&auto=compress`;
            }

            return url;
        }

        // Предзагрузка критических ресурсов
        preloadCriticalResources() {
            const criticalImages = [
                // Логотипы, иконки и другие критические изображения
            ];

            criticalImages.forEach(url => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = url;
                document.head.appendChild(link);
            });
        }

        // Оптимизация localStorage
        optimizeLocalStorage() {
            // Сжимаем большие объекты данных
            const largeKeys = ['lightfox_manga_data', 'lightfox_users', 'lightfox_donation_projects'];
            
            largeKeys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data && data.length > 10000) { // Больше 10KB
                    try {
                        const parsed = JSON.parse(data);
                        const compressed = this.compressData(parsed);
                        if (compressed.length < data.length) {
                            localStorage.setItem(key + '_compressed', compressed);
                            console.log(`📦 Сжато ${key}: ${data.length} → ${compressed.length} байт`);
                        }
                    } catch (e) {
                        console.warn('Ошибка сжатия данных:', e);
                    }
                }
            });
        }

        // Мониторинг производительности
        monitorPerformance() {
            // Отслеживаем время загрузки страниц
            window.addEventListener('load', () => {
                const loadTime = performance.now();
                console.log(`⚡ Страница загружена за ${loadTime.toFixed(2)}ms`);
                
                // Если загрузка медленная, показываем предупреждение
                if (loadTime > 3000) {
                    console.warn('⚠️ Медленная загрузка страницы. Рекомендуется оптимизация.');
                }
            });

            // Отслеживаем использование памяти
            if ('memory' in performance) {
                setInterval(() => {
                    const memory = performance.memory;
                    const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
                    const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
                    
                    if (usedMB > limitMB * 0.8) {
                        console.warn(`🧠 Высокое использование памяти: ${usedMB}MB / ${limitMB}MB`);
                        this.cleanupMemory();
                    }
                }, 60000); // Проверяем каждую минуту
            }
        }

        // Очистка памяти
        cleanupMemory() {
            // Очищаем старые кэши
            this.imageCache.clear();
            this.dataCache.clear();
            
            // Принудительная сборка мусора (если доступна)
            if (window.gc) {
                window.gc();
            }
            
            console.log('🧹 Память очищена');
        }

        // Подготовка данных для сервера
        prepareForServerDeployment() {
            console.log('🌐 Подготовка к деплою на сервер...');
            
            // Оптимизируем localStorage
            this.optimizeLocalStorage();
            
            // Предзагружаем критические ресурсы
            this.preloadCriticalResources();
            
            // Включаем мониторинг
            this.monitorPerformance();
            
            console.log('✅ Сайт готов к деплою на сервер!');
        }
    }

    // Создаем глобальный экземпляр
    window.ServerOptimization = new ServerOptimization();

    // Автоматическая подготовка при загрузке
    document.addEventListener('DOMContentLoaded', () => {
        window.ServerOptimization.prepareForServerDeployment();
    });

    console.log('🚀 Система оптимизации для сервера загружена');

})();