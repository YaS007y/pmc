document.addEventListener('DOMContentLoaded', () => {
    // === MENU MOBILE ===
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') navLinks.classList.remove('active');
        });
    }

    // === DÉFILEMENT FLUIDE ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // === CHANGEMENT COULEUR HEADER ===
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.style.background = window.scrollY > 100
                ? 'rgba(46, 91, 186, 0.95)'
                : '#2E5BBA';
        });
    }

    // === FILTRAGE PRODUITS ===
    function initFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const productCards = document.querySelectorAll('.product-card');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const category = button.getAttribute('data-category');
                productCards.forEach(card => {
                    const matches = category === 'tous' || card.getAttribute('data-category') === category;
                    card.style.display = matches ? 'flex' : 'none';
                });
            });
        });
    }

    // === ANIMATIONS PRODUITS ===
    function initAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('animate');
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.product-card, .service-card, .info-card, .review-card')
            .forEach(el => observer.observe(el));
    }

    

    // === CAROUSEL AUTOMATIQUE ===
    function initCarousel() {
        const slides = document.querySelectorAll('.carousel-slide');
        const indicators = document.querySelectorAll('.indicator');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const slidesContainer = document.getElementById('carouselSlides');
        let current = 0;
        let interval;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            indicators.forEach((ind, i) => {
                ind.classList.toggle('active', i === index);
            });
            current = index;
        }

        function nextSlide() {
            showSlide((current + 1) % slides.length);
        }

        function prevSlide() {
            showSlide((current - 1 + slides.length) % slides.length);
        }

        function startAuto() {
            stopAuto();
            interval = setInterval(nextSlide, 2500); // vitesse augmentée (2,5 secondes)
        }

        function stopAuto() {
            if (interval) clearInterval(interval);
        }

        if (slides.length > 0 && indicators.length > 0) {
            indicators.forEach((ind, i) => {
                ind.addEventListener('click', () => {
                    showSlide(i);
                    stopAuto();
                    startAuto();
                });
            });
            if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); stopAuto(); startAuto(); });
            if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); stopAuto(); startAuto(); });
            if (slidesContainer) {
                slidesContainer.addEventListener('mouseenter', stopAuto);
                slidesContainer.addEventListener('mouseleave', startAuto);
            }
            showSlide(0);
            startAuto();
        }
    }

    // === PANIER WHATSAPP ===
    function initCartWhatsapp() {
        const cartPanel = document.getElementById('cart-panel');
        const openCartBtn = document.getElementById('openCart');
        const closeCartBtn = document.getElementById('closeCart');
        const cartList = document.getElementById('cart-list');
        const cartTotal = document.getElementById('cart-total');
        const cartWhatsappBtn = document.getElementById('cart-whatsapp');
        let cart = [];

        // Ouvre/ferme le panier
        openCartBtn.addEventListener('click', () => { cartPanel.style.display = 'flex'; });
        closeCartBtn.addEventListener('click', () => { cartPanel.style.display = 'none'; });

        // Ajoute un produit au panier
        document.querySelectorAll('.product-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const card = e.target.closest('.product-card');
                const name = card.querySelector('.product-name')?.textContent.trim() || '';
                const price = card.querySelector('.product-price')?.textContent.trim() || '';
                // Vérifie si le produit existe déjà (on ajoute plusieurs fois si voulu)
                cart.push({ name, price });
                updateCart();
                cartPanel.style.display = 'flex';
            });
        });

        // Met à jour l'affichage du panier
        function updateCart() {
            cartList.innerHTML = '';
            if (cart.length === 0) {
                cartList.innerHTML = '<li style="text-align:center;color:#888;">Votre panier est vide.</li>';
                cartTotal.textContent = '';
                cartWhatsappBtn.style.display = 'none';
                return;
            }
            let total = 0;
            cart.forEach((item, idx) => {
                // Extraction du prix numérique
                let prixNum = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
                total += prixNum;
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.name} <span style="color:#2E5BBA;">${item.price}</span></span>
                    <button class="cart-remove" title="Retirer" data-idx="${idx}">&times;</button>`;
                cartList.appendChild(li);
            });
            cartTotal.textContent = `Total : ${total.toLocaleString()} F`;
            cartWhatsappBtn.style.display = 'block';
        }

        // Retirer un produit du panier
        cartList.addEventListener('click', function(e) {
            if (e.target.classList.contains('cart-remove')) {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                cart.splice(idx, 1);
                updateCart();
            }
        });

        // Commander via WhatsApp
        cartWhatsappBtn.addEventListener('click', function() {
            if (cart.length === 0) return;
            let message = "Bonjour, je souhaite commander :\n";
            cart.forEach(item => {
                message += `- ${item.name} ${item.price}\n`;
            });
            message += "\nMerci de me confirmer la disponibilité.";
            const whatsappURL = `https://wa.me/22678997603?text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        });
    }

    // Initialisation des fonctionnalités
    initFilters();
    initAnimations();
    initCarousel();
    initCartWhatsapp();
});
