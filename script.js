// Polyfill IntersectionObserver (IE11/Safari)
(function() {
    if (!('IntersectionObserver' in window)) {
        window.IntersectionObserver = function() {
            this.observe = function() {};
            this.unobserve = function() {};
            this.disconnect = function() {};
        };
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // === MENU MOBILE AVEC ARIA & NAVIGATION CLAVIER ===
    try {
        const menuToggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        if (menuToggle && navLinks) {
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-controls', 'nav-links');
            menuToggle.addEventListener('click', () => {
                const isOpen = navLinks.classList.toggle('open');
                menuToggle.classList.toggle('open');
                document.body.classList.toggle('menu-open', isOpen);
                menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                if (isOpen) navLinks.querySelector('a')?.focus();
            });
            // Navigation clavier (fermer menu avec ESC)
            document.addEventListener('keydown', (e) => {
                if (navLinks.classList.contains('open') && e.key === 'Escape') {
                    navLinks.classList.remove('open');
                    menuToggle.classList.remove('open');
                    document.body.classList.remove('menu-open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    menuToggle.focus();
                }
            });
            // Délégation : fermer menu au clic sur un lien
            navLinks.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    navLinks.classList.remove('open');
                    menuToggle.classList.remove('open');
                    document.body.classList.remove('menu-open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    } catch (e) { console.error('Erreur menu mobile :', e); }

    // === DÉFILEMENT FLUIDE ===
    try {
        document.body.addEventListener('click', function(e) {
            if (e.target.matches('a[href^="#"]')) {
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    } catch (e) { console.error('Erreur scroll fluide :', e); }

    // === CHANGEMENT COULEUR HEADER (avec debounce) ===
    try {
        const header = document.getElementById('header');
        let scrollTimeout;
        function onScroll() {
            if (!header) return;
            header.style.background = window.scrollY > 100
                ? 'rgba(46, 91, 186, 0.95)'
                : '#2E5BBA';
        }
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(onScroll, 50);
        });
    } catch (e) { console.error('Erreur header sticky :', e); }

    // === FILTRAGE PRODUITS (délégation) ===
    try {
        const filterContainer = document.querySelector('.category-filters');
        const productCards = document.querySelectorAll('.product-card');
        if (filterContainer && productCards.length > 0) {
            filterContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-btn')) {
                    filterContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    const category = e.target.getAttribute('data-category');
                    productCards.forEach(card => {
                        const matches = category === 'tous' || card.getAttribute('data-category') === category;
                        card.style.display = matches ? 'flex' : 'none';
                    });
                }
            });
        }
    } catch (e) { console.error('Erreur filtres produits :', e); }

    // === ANIMATIONS AVEC INTERSECTION OBSERVER + Fallback ===
    try {
        const animatedEls = document.querySelectorAll('.product-card, .service-card, .info-card, .review-card');
        if (animatedEls.length > 0) {
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) entry.target.classList.add('animate');
                    });
                }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
                animatedEls.forEach(el => observer.observe(el));
            } else {
                animatedEls.forEach(el => el.classList.add('animate'));
            }
        }
    } catch (e) { console.error('Erreur animations :', e); }

    // === CAROUSEL AVEC SWIPE, PAUSE SUR FOCUS/SURVOL, ACCESSIBILITÉ ===
    try {
        const slides = document.querySelectorAll('.carousel-slide');
        const indicators = document.querySelectorAll('.indicator');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const slidesContainer = document.getElementById('carouselSlides');
        
        if (slides.length > 0 && indicators.length > 0) {
            let current = 0, interval, isPaused = false;

            function showSlide(index) {
                // Validation de l'index
                if (index < 0 || index >= slides.length) return;
                
                slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
                indicators.forEach((ind, i) => ind.classList.toggle('active', i === index));
                current = index;
            }
            
            function nextSlide() { 
                showSlide((current + 1) % slides.length); 
            }
            
            function prevSlide() { 
                showSlide((current - 1 + slides.length) % slides.length); 
            }
            
            function startAuto() {
                if (interval) clearInterval(interval);
                if (!isPaused) interval = setInterval(nextSlide, 3000);
            }
            
            function stopAuto() { 
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            }

            // Pause sur survol/focus
            if (slidesContainer) {
                slidesContainer.addEventListener('mouseenter', () => { 
                    isPaused = true; 
                    stopAuto(); 
                });
                slidesContainer.addEventListener('mouseleave', () => { 
                    isPaused = false; 
                    startAuto(); 
                });
                slidesContainer.addEventListener('focusin', () => { 
                    isPaused = true; 
                    stopAuto(); 
                });
                slidesContainer.addEventListener('focusout', () => { 
                    isPaused = false; 
                    startAuto(); 
                });
            }

            // Touch swipe
            let startX = null;
            if (slidesContainer) {
                slidesContainer.addEventListener('touchstart', e => { 
                    startX = e.touches[0].clientX; 
                }, { passive: true });
                
                slidesContainer.addEventListener('touchend', e => {
                    if (startX === null) return;
                    let dx = e.changedTouches[0].clientX - startX;
                    if (Math.abs(dx) > 50) {
                        if (dx < 0) nextSlide();
                        else prevSlide();
                        stopAuto();
                        startAuto();
                    }
                    startX = null;
                }, { passive: true });
            }

            // Indicateurs et boutons
            indicators.forEach((ind, i) => {
                ind.addEventListener('click', () => { 
                    showSlide(i); 
                    stopAuto(); 
                    startAuto(); 
                });
            });
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => { 
                    nextSlide(); 
                    stopAuto(); 
                    startAuto(); 
                });
            }
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => { 
                    prevSlide(); 
                    stopAuto(); 
                    startAuto(); 
                });
            }

            // Navigation clavier
            if (slidesContainer) {
                slidesContainer.setAttribute('tabindex', '0');
                slidesContainer.setAttribute('role', 'region');
                slidesContainer.setAttribute('aria-label', 'Carrousel d\'actualités');
                slidesContainer.addEventListener('keydown', e => {
                    if (e.key === 'ArrowRight') { 
                        e.preventDefault();
                        nextSlide(); 
                        stopAuto(); 
                        startAuto(); 
                    }
                    if (e.key === 'ArrowLeft') { 
                        e.preventDefault();
                        prevSlide(); 
                        stopAuto(); 
                        startAuto(); 
                    }
                });
            }

            // Initialisation
            showSlide(0);
            startAuto();
            
            // Nettoyage avant déchargement de la page
            window.addEventListener('beforeunload', () => {
                stopAuto();
            });
        }
    } catch (e) { console.error('Erreur carousel :', e); }

    // === PANIER WHATSAPP AVEC PERSISTANCE ET QUANTITÉ ===
    try {
        const cartPanel = document.getElementById('cart-panel');
        const openCartBtn = document.getElementById('openCart');
        const closeCartBtn = document.getElementById('closeCart');
        const cartList = document.getElementById('cart-list');
        const cartTotal = document.getElementById('cart-total');
        const cartWhatsappBtn = document.getElementById('cart-whatsapp');
        
        if (cartPanel && openCartBtn && closeCartBtn && cartList && cartTotal && cartWhatsappBtn) {
            // Fallback localStorage
            function getCart() {
                try {
                    const cartData = localStorage.getItem('pmc_cart');
                    return cartData ? JSON.parse(cartData) : [];
                } catch (e) { 
                    console.warn('Erreur lecture localStorage :', e);
                    return []; 
                }
            }
            
            function setCart(cart) {
                try {
                    localStorage.setItem('pmc_cart', JSON.stringify(cart));
                } catch (e) {
                    console.warn('Erreur sauvegarde localStorage :', e);
                }
            }
            
            let cart = getCart();

            // Ouvre/ferme le panier
            openCartBtn.addEventListener('click', () => { 
                cartPanel.style.display = 'flex'; 
                cartPanel.setAttribute('aria-hidden', 'false');
            });
            
            closeCartBtn.addEventListener('click', () => { 
                cartPanel.style.display = 'none'; 
                cartPanel.setAttribute('aria-hidden', 'true');
            });

            // Fermer le panier en cliquant en dehors
            cartPanel.addEventListener('click', (e) => {
                if (e.target === cartPanel) {
                    cartPanel.style.display = 'none';
                    cartPanel.setAttribute('aria-hidden', 'true');
                }
            });

            // Délégation pour ajout produit
            document.body.addEventListener('click', function(e) {
                if (e.target.classList.contains('product-btn')) {
                    e.preventDefault();
                    const card = e.target.closest('.product-card');
                    if (card) {
                        const name = card.querySelector('.product-name')?.textContent.trim() || '';
                        const price = card.querySelector('.product-price')?.textContent.trim() || '';
                        
                        if (name && price) {
                            // Gestion quantité
                            let found = cart.find(item => item.name === name && item.price === price);
                            if (found) {
                                found.qty += 1;
                            } else {
                                cart.push({ name, price, qty: 1 });
                            }
                            setCart(cart);
                            updateCart();
                            cartPanel.style.display = 'flex';
                            cartPanel.setAttribute('aria-hidden', 'false');
                        }
                    }
                }
            });

            // Met à jour l'affichage du panier
            function updateCart() {
                cart = getCart();
                cartList.innerHTML = '';
                
                if (cart.length === 0) {
                    cartList.innerHTML = '<li style="text-align:center;color:#888;">Votre panier est vide.</li>';
                    cartTotal.textContent = '';
                    cartWhatsappBtn.style.display = 'none';
                    return;
                }
                
                let total = 0;
                cart.forEach((item, idx) => {
                    let prixNum = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
                    total += prixNum * item.qty;
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${item.name} <span style="color:#2E5BBA;">${item.price}</span> x${item.qty}</span>
                        <button class="cart-remove" title="Retirer ${item.name}" data-idx="${idx}" aria-label="Retirer ${item.name}">&times;</button>
                    `;
                    cartList.appendChild(li);
                });
                
                cartTotal.textContent = `Total : ${total.toLocaleString()} F`;
                cartWhatsappBtn.style.display = 'block';
            }

            // Délégation pour retirer un produit
            cartList.addEventListener('click', function(e) {
                if (e.target.classList.contains('cart-remove')) {
                    const idx = parseInt(e.target.getAttribute('data-idx'));
                    if (!isNaN(idx) && cart[idx]) {
                        if (cart[idx].qty > 1) {
                            cart[idx].qty -= 1;
                        } else {
                            cart.splice(idx, 1);
                        }
                        setCart(cart);
                        updateCart();
                    }
                }
            });

            // Commander via WhatsApp
            cartWhatsappBtn.addEventListener('click', function() {
                if (cart.length === 0) return;
                
                let message = "Bonjour, je souhaite commander :\n\n";
                cart.forEach(item => {
                    message += `- ${item.name} ${item.price} x${item.qty}\n`;
                });
                message += "\nMerci de me confirmer la disponibilité et le prix total.";
                
                const whatsappURL = `https://wa.me/22678997603?text=${encodeURIComponent(message)}`;
                window.open(whatsappURL, '_blank', 'noopener,noreferrer');
            });

            // Initialisation
            updateCart();
            cartPanel.setAttribute('aria-hidden', 'true');
        }
    } catch (e) { console.error('Erreur panier WhatsApp :', e); }

    // === ZOOM IMAGE PRODUIT AU CLIC ===
    try {
        const modal = document.getElementById('image-zoom-modal');
        const zoomedImg = document.getElementById('zoomed-image');
        
        if (modal && zoomedImg) {
            // Fonction pour ouvrir le zoom
            function openZoom(imgSrc, imgAlt) {
                zoomedImg.src = imgSrc;
                zoomedImg.alt = imgAlt || 'Aperçu du produit';
                modal.style.display = 'flex';
                modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                modal.focus();
            }
            
            // Fonction pour fermer le zoom
            function closeZoom() {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
                zoomedImg.src = '';
                document.body.style.overflow = '';
            }

            document.body.addEventListener('click', function(e) {
                // Clic sur une image produit
                if (e.target.closest('.product-image img')) {
                    const img = e.target.closest('.product-image img');
                    if (img.src) {
                        openZoom(img.src, img.alt);
                    }
                }
                // Clic pour fermer le modal (sur le fond)
                if (e.target === modal) {
                    closeZoom();
                }
            });
            
            // Fermer avec Echap
            document.addEventListener('keydown', function(e) {
                if (modal.style.display === 'flex' && e.key === 'Escape') {
                    closeZoom();
                }
            });

            // Initialisation
            modal.setAttribute('aria-hidden', 'true');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-label', 'Image agrandie');
        }
    } catch (e) { console.error('Erreur zoom image produit :', e); }

    // === LAZY LOADING IMAGES (fallback) ===
    try {
        if ('loading' in HTMLImageElement.prototype) {
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            lazyImages.forEach(img => {
                img.loading = 'lazy';
            });
        } else {
            // Fallback pour navigateurs non compatibles
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            if (lazyImages.length > 0 && 'IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.removeAttribute('data-src');
                            }
                            imageObserver.unobserve(img);
                        }
                    });
                });
                lazyImages.forEach(img => imageObserver.observe(img));
            }
        }
    } catch (e) { console.error('Erreur lazy loading :', e); }

    // === SERVICE WORKER POUR OFFLINE ===
    try {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('SW enregistré avec succès:', registration.scope);
                    })
                    .catch(registrationError => {
                        console.log('Échec enregistrement SW:', registrationError);
                    });
            });
        }
    } catch (e) { console.error('Erreur service worker :', e); }

    // === PERFORMANCE ET OPTIMISATIONS ===
    try {
        // Préchargement des images importantes
        const criticalImages = [
            'images/infos/logo.webp'
        ];
        
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });

        // Debounce pour le redimensionnement
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Actions de redimensionnement si nécessaire
                console.log('Fenêtre redimensionnée');
            }, 250);
        });

    } catch (e) { console.error('Erreur optimisations :', e); }

    console.log('PMC - Site initialisé avec succès');
});
