// Utilitaire : normaliser une catégorie (tolérant aux apostrophes, espaces, majuscules)
const normalizeCategory = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/['"`\u2019]/g, "") // enlever apostrophes typographiques
    .replace(/[^a-z0-9]+/g, "_") // remplacer séparateurs par underscore
    .replace(/^_+|_+$/g, ""); // supprimer underscores aux bords

document.addEventListener("DOMContentLoaded", () => {
  // === MENU MOBILE AVEC ARIA & NAVIGATION CLAVIER ===
  try {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    if (menuToggle && navLinks) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-controls", "nav-links");
      menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        menuToggle.classList.toggle("open");
        document.body.classList.toggle("menu-open", isOpen);
        menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (isOpen) navLinks.querySelector("a")?.focus();
      });
      document.addEventListener("keydown", (e) => {
        if (navLinks.classList.contains("open") && e.key === "Escape") {
          navLinks.classList.remove("open");
          menuToggle.classList.remove("open");
          document.body.classList.remove("menu-open");
          menuToggle.setAttribute("aria-expanded", "false");
          menuToggle.focus();
        }
      });
      navLinks.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (link) {
          navLinks.classList.remove("open");
          menuToggle.classList.remove("open");
          document.body.classList.remove("menu-open");
          menuToggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  } catch (e) {
    console.error("Erreur menu mobile :", e);
  }

  // === DÉFILEMENT FLUIDE ===
  try {
    document.body.addEventListener("click", (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  } catch (e) {
    console.error("Erreur scroll fluide :", e);
  }

  // === CHANGEMENT COULEUR HEADER (avec debounce) ===
  try {
    const header = document.getElementById("header");
    let scrollTimeout;
    function onScroll() {
      if (!header) return;
      header.style.background = window.scrollY > 100 ? "rgba(46, 91, 186, 0.95)" : "#2E5BBA";
    }
    window.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(onScroll, 50);
    });
  } catch (e) {
    console.error("Erreur header sticky :", e);
  }

  // === PRODUITS EN GRILLE AVEC FILTRE ===
  const productsGrid = document.getElementById("productsGrid");
  let allProducts = [];

  function renderProductsGrid(products) {
    if (!productsGrid) return;
    productsGrid.innerHTML = "";
    if (!products || products.length === 0) {
      productsGrid.innerHTML = "<p style='grid-column:1/-1;text-align:center;color:#888'>Aucun produit trouvé.</p>";
      return;
    }
    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.setAttribute("data-category", product.categorie || "");
      card.innerHTML = `
        <div class="product-image">
          <img src="${product.image}" alt="${product.nom || ''}" loading="lazy">
        </div>
        <div class="product-info">
          <span class="product-category">${product.categorie || ''}</span>
          <h3 class="product-name">${product.nom || ''}</h3>
          <div class="product-price">${product.prix || ''}</div>
          <button type="button" class="product-btn" aria-label="Commander ${product.nom || ''}">🛒 Commander</button>
        </div>
      `;
      productsGrid.appendChild(card);
    });
  }

  function setupCategoryFilter(products) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-category');
        const filtered = cat === "tous"
          ? products
          : products.filter(p => normalizeCategory(p.categorie) === normalizeCategory(cat));
        renderProductsGrid(filtered);
      });
    });
  }

  fetch("produits.json")
    .then(res => {
      if (!res.ok) throw new Error("Erreur HTTP " + res.status);
      return res.json();
    })
    .then(products => {
      allProducts = products;
      renderProductsGrid(allProducts);
      setupCategoryFilter(allProducts);
    })
    .catch(e => {
      if (productsGrid) {
        productsGrid.innerHTML = "<p style='color:#d32f2f'>Erreur de chargement des produits.</p>";
      }
      console.error(e);
    });

  // === DROPDOWN FILTRES CATEGORIES ===
  try {
    const dropdownBtn = document.getElementById("dropdownMenuBtn");
    const dropdownContainer = dropdownBtn?.parentElement;
    if (dropdownBtn && dropdownContainer) {
      dropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownContainer.classList.toggle("open");
        dropdownBtn.setAttribute("aria-expanded", dropdownContainer.classList.contains("open"));
      });
      document.addEventListener("click", () => {
        dropdownContainer.classList.remove("open");
        dropdownBtn.setAttribute("aria-expanded", "false");
      });
    }
  } catch (e) {
    console.error("Erreur dropdown filtres :", e);
  }

  // === PANIER WHATSAPP (Version simplifiée sans localStorage) ===
  try {
    const cartPanel = document.getElementById("cart-panel");
    const openCartBtn = document.getElementById("openCart");
    const closeCartBtn = document.getElementById("closeCart");
    const cartList = document.getElementById("cart-list");
    const cartTotal = document.getElementById("cart-total");
    const cartWhatsappBtn = document.getElementById("cart-whatsapp");

    // Utiliser une variable en mémoire au lieu de localStorage
    let cart = [];

    function updateCart() {
      if (!cartList || !cartTotal || !cartWhatsappBtn) return;

      cartList.innerHTML = "";
      if (cart.length === 0) {
        cartList.innerHTML = "<li style='text-align:center;color:#888'>Votre panier est vide.</li>";
        cartTotal.textContent = "";
        cartWhatsappBtn.style.display = "none";
        // Retirer l'indicateur du bouton panier
        if (openCartBtn) {
          openCartBtn.classList.remove("has-items");
        }
        return;
      }

      let total = 0;
      cart.forEach((item, idx) => {
        const prixNum = parseInt((item.price || "").replace(/[^\d]/g, "")) || 0;
        total += prixNum * item.qty;
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${item.name} <span style="color:#2E5BBA">${item.price}</span> x${item.qty}</span>
          <button class="cart-remove" type="button" data-idx="${idx}" aria-label="Retirer ${item.name}">×</button>
        `;
        cartList.appendChild(li);
      });

      // Animation du total
      cartTotal.classList.add("updated");
      cartTotal.textContent = `Total : ${total.toLocaleString()} F`;
      setTimeout(() => cartTotal.classList.remove("updated"), 500);

      cartWhatsappBtn.style.display = "block";

      // Ajouter l'indicateur au bouton panier avec animation
      if (openCartBtn) {
        openCartBtn.classList.add("has-items");
        openCartBtn.classList.add("notification");
        setTimeout(() => openCartBtn.classList.remove("notification"), 600);
      }
    }

    // Gestion des boutons "Commander"
    document.body.addEventListener("click", (e) => {
      const prodBtn = e.target.closest(".product-btn");
      if (prodBtn) {
        e.preventDefault();
        const card = prodBtn.closest(".product-card");
        if (!card) return;

        const name = card.querySelector(".product-name")?.textContent || "Produit";
        const price = card.querySelector(".product-price")?.textContent || "Prix non disponible";

        // Animation du bouton pour feedback visuel
        prodBtn.style.transform = "scale(0.95)";
        prodBtn.style.background = "#25d366";
        prodBtn.textContent = "✓ Ajouté !";

        setTimeout(() => {
          prodBtn.style.transform = "";
          prodBtn.style.background = "";
          prodBtn.innerHTML = "🛒 Commander";
        }, 1000);

        // Vérifier si le produit existe déjà dans le panier
        const existingIndex = cart.findIndex(item => item.name === name);
        if (existingIndex >= 0) {
          cart[existingIndex].qty += 1;
        } else {
          cart.push({ name, price, qty: 1 });
        }

        updateCart();

        // Ouvrir automatiquement le panier avec animation
        if (cartPanel) {
          cartPanel.classList.add("open");
          // Animation d'apparition du panier
          cartPanel.style.animation = "slideInRight 0.3s ease-out";
          // Faire clignoter le nouvel article ajouté
          setTimeout(() => {
            const lastItem = cartList.querySelector("li:last-child");
            if (lastItem) {
              lastItem.style.background = "#e8f5e8";
              lastItem.style.transition = "background 0.5s";
              setTimeout(() => {
                lastItem.style.background = "";
              }, 1500);
            }
          }, 100);
        }
      }
    });

    // Ouvrir le panier
    if (openCartBtn && cartPanel) {
      openCartBtn.addEventListener("click", () => {
        cartPanel.classList.add("open");
      });
    }

    // Fermer le panier
    if (closeCartBtn && cartPanel) {
      closeCartBtn.addEventListener("click", () => {
        cartPanel.classList.remove("open");
      });
    }

    // Supprimer un article du panier
    document.body.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".cart-remove");
      if (removeBtn) {
        const idx = parseInt(removeBtn.getAttribute("data-idx"));
        if (!isNaN(idx) && idx >= 0 && idx < cart.length) {
          cart.splice(idx, 1);
          updateCart();
        }
      }
    });

    // Commande WhatsApp
    if (cartWhatsappBtn) {
      cartWhatsappBtn.addEventListener("click", () => {
        if (cart.length === 0) return;

        let message = "Bonjour, je souhaite commander :\n\n";
        let total = 0;

        cart.forEach(item => {
          const prixNum = parseInt((item.price || "").replace(/[^\d]/g, "")) || 0;
          total += prixNum * item.qty;
          message += `• ${item.name} - ${item.price} x${item.qty}\n`;
        });

        message += `\nTotal : ${total.toLocaleString()} F\n\nMerci !`;

        const phoneNumber = "22678997603";
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
      });
    }

    // Fermer le panier en cliquant à l'extérieur
    document.addEventListener("click", (e) => {
      if (cartPanel && !cartPanel.contains(e.target) && !openCartBtn?.contains(e.target)) {
        cartPanel.classList.remove("open");
      }
    });

    // Initialiser l'affichage du panier
    updateCart();
  } catch (e) {
    console.error("Erreur panier :", e);
  }

  // === CARROUSEL ACTUALITÉS ===
  try {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentSlide = 0;

    function showSlide(index) {
      if (!slides.length) return;
      // Masquer toutes les slides
      slides.forEach(slide => slide.classList.remove('active'));
      indicators.forEach(indicator => indicator.classList.remove('active'));
      // Afficher la slide courante
      if (slides[index]) {
        slides[index].classList.add('active');
      }
      if (indicators[index]) {
        indicators[index].classList.add('active');
      }
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }

    function prevSlide() {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(currentSlide);
    }

    // Boutons de navigation
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Indicateurs
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        currentSlide = index;
        showSlide(currentSlide);
      });
    });

    // Auto-play (optionnel)
    setInterval(nextSlide, 5000); // Change de slide toutes les 5 secondes

    // Initialiser le carrousel
    showSlide(0);
  } catch (e) {
    console.error("Erreur carrousel :", e);
  }

  // === ZOOM IMAGE PRODUIT ===
  try {
    const modal = document.getElementById("image-zoom-modal");
    const zoomedImage = document.getElementById("zoomed-image");

    document.body.addEventListener("click", (e) => {
      const img = e.target.closest(".product-image img");
      if (img && modal && zoomedImage) {
        e.preventDefault();
        zoomedImage.src = img.src;
        zoomedImage.alt = img.alt;
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
      }
    });

    if (modal) {
      modal.addEventListener("click", () => {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      });
    }

    // Fermer avec Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal?.classList.contains("open")) {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  } catch (e) {
    console.error("Erreur zoom image :", e);
  }
});