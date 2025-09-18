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
  let productsGrid, allProducts = [];
  try {
    productsGrid = document.getElementById("productsGrid");
  } catch (e) {
    console.error("Erreur récupération productsGrid :", e);
  }

  function renderProductsGrid(products) {
    try {
      if (!productsGrid) return;
      productsGrid.innerHTML = "";
      if (!Array.isArray(products) || products.length === 0) {
        productsGrid.innerHTML = "<p style='grid-column:1/-1;text-align:center;color:#888'>Aucun produit trouvé.</p>";
        return;
      }
      products.forEach(product => {
        // Validation des données produit
        if (!product || typeof product !== "object") return;
        const nom = product.nom || "Produit";
        const categorie = product.categorie || "Autre";
        const prix = product.prix || "Prix non disponible";
        const image = product.image || "placeholder.svg";
        const card = document.createElement("div");
        card.className = "product-card";
        card.setAttribute("data-category", categorie);
        card.innerHTML = `
          <div class="product-image">
            <img src="${image}" alt="${nom}" loading="lazy">
          </div>
          <div class="product-info">
            <span class="product-category">${categorie}</span>
            <h3 class="product-name">${nom}</h3>
            <div class="product-price">${prix}</div>
            <button type="button" class="product-btn" aria-label="Commander ${nom}">🛒 Commander</button>
          </div>
        `;
        productsGrid.appendChild(card);
      });
    } catch (e) {
      if (productsGrid) {
        productsGrid.innerHTML = "<p style='color:#d32f2f'>Erreur d'affichage des produits.</p>";
      }
      console.error("Erreur renderProductsGrid :", e);
    }
  }

  function setupCategoryFilter(products) {
    try {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const cat = btn.getAttribute('data-category');
          if (!cat) {
            renderProductsGrid(products);
            return;
          }
          const filtered = cat === "tous"
            ? products
            : products.filter(p =>
                normalizeCategory(p?.categorie) === normalizeCategory(cat)
              );
          renderProductsGrid(filtered);
        });
      });
    } catch (e) {
      console.error("Erreur setupCategoryFilter :", e);
    }
  }

  try {
    fetch("produits.json")
      .then(res => {
        if (!res.ok) throw new Error("Erreur HTTP " + res.status);
        return res.json();
      })
      .then(products => {
        if (!Array.isArray(products)) throw new Error("Format de produits invalide");
        allProducts = products;
        renderProductsGrid(allProducts);
        setupCategoryFilter(allProducts);
      })
      .catch(e => {
        if (productsGrid) {
          productsGrid.innerHTML = "<p style='color:#d32f2f'>Erreur de chargement des produits.</p>";
        }
        console.error("Erreur fetch produits :", e);
      });
  } catch (e) {
    if (productsGrid) {
      productsGrid.innerHTML = "<p style='color:#d32f2f'>Erreur de chargement des produits.</p>";
    }
    console.error("Erreur fetch produits (try) :", e);
  }

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

  // === PANIER (état ouvert/fermé propre, fermé par défaut) ===
  try {
    const cartPanel = document.getElementById("cart-panel");
    const openCartBtn = document.getElementById("openCart");
    const closeCartBtn = document.getElementById("closeCart");
    const cartList = document.getElementById("cart-list");
    const cartTotal = document.getElementById("cart-total");
    const cartWhatsappBtn = document.getElementById("cart-whatsapp");

    let cart = [];
    let isCartOpen = false;

    // Fermer le panier par défaut au chargement
    function closeCart() {
      if (cartPanel) {
        cartPanel.classList.remove("open");
        cartPanel.setAttribute("aria-hidden", "true");
        isCartOpen = false;
      }
    }
    function openCart() {
      if (cartPanel) {
        cartPanel.classList.add("open");
        cartPanel.setAttribute("aria-hidden", "false");
        isCartOpen = true;
      }
    }
    closeCart();

    function updateCart() {
      try {
        if (!cartList || !cartTotal || !cartWhatsappBtn) return;

        cartList.innerHTML = "";
        if (!Array.isArray(cart) || cart.length === 0) {
          cartList.innerHTML = "<li style='text-align:center;color:#888'>Votre panier est vide.</li>";
          cartTotal.textContent = "";
          cartWhatsappBtn.style.display = "none";
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

        cartTotal.classList.add("updated");
        cartTotal.textContent = `Total : ${total.toLocaleString()} F`;
        setTimeout(() => cartTotal.classList.remove("updated"), 500);

        cartWhatsappBtn.style.display = "block";

        if (openCartBtn) {
          openCartBtn.classList.add("has-items");
          openCartBtn.classList.add("notification");
          setTimeout(() => openCartBtn.classList.remove("notification"), 600);
        }
      } catch (e) {
        console.error("Erreur updateCart :", e);
      }
    }

    // Gestion des boutons "Commander"
    document.body.addEventListener("click", (e) => {
      try {
        const prodBtn = e.target.closest(".product-btn");
        if (prodBtn) {
          e.preventDefault();
          const card = prodBtn.closest(".product-card");
          if (!card) return;

          const name = card.querySelector(".product-name")?.textContent || "Produit";
          const price = card.querySelector(".product-price")?.textContent || "Prix non disponible";

          prodBtn.style.transform = "scale(0.95)";
          prodBtn.style.background = "#25d366";
          prodBtn.textContent = "✓ Ajouté !";

          setTimeout(() => {
            prodBtn.style.transform = "";
            prodBtn.style.background = "";
            prodBtn.innerHTML = "🛒 Commander";
          }, 1000);

          const existingIndex = cart.findIndex(item => item.name === name);
          if (existingIndex >= 0) {
            cart[existingIndex].qty += 1;
          } else {
            cart.push({ name, price, qty: 1 });
          }

          updateCart();
          openCart();

          // Animation d'apparition du panier
          if (cartPanel) {
            cartPanel.style.animation = "slideInRight 0.3s ease-out";
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
      } catch (e) {
        console.error("Erreur ajout panier :", e);
      }
    });

    // Ouvrir le panier
    if (openCartBtn && cartPanel) {
      openCartBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openCart();
      });
    }

    // Fermer le panier
    if (closeCartBtn && cartPanel) {
      closeCartBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeCart();
      });
    }

    // Fermer le panier en cliquant à l'extérieur
    document.addEventListener("click", (e) => {
      try {
        if (
          isCartOpen &&
          cartPanel &&
          !cartPanel.contains(e.target) &&
          !openCartBtn?.contains(e.target)
        ) {
          closeCart();
        }
      } catch (e) {
        console.error("Erreur fermeture panier extérieur :", e);
      }
    });

    // Supprimer un article du panier
    document.body.addEventListener("click", (e) => {
      try {
        const removeBtn = e.target.closest(".cart-remove");
        if (removeBtn) {
          const idx = parseInt(removeBtn.getAttribute("data-idx"));
          if (!isNaN(idx) && idx >= 0 && idx < cart.length) {
            cart.splice(idx, 1);
            updateCart();
          }
        }
      } catch (e) {
        console.error("Erreur suppression article panier :", e);
      }
    });

    // Commande WhatsApp (depuis le panneau panier uniquement)
    if (cartWhatsappBtn) {
      cartWhatsappBtn.addEventListener("click", () => {
        try {
          if (!Array.isArray(cart) || cart.length === 0) return;

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
        } catch (e) {
          console.error("Erreur commande WhatsApp :", e);
        }
      });
    }

    // Initialiser l'affichage du panier
    updateCart();
    closeCart();
  } catch (e) {
    console.error("Erreur panier :", e);
  }

  // === CARROUSEL ACTUALITÉS (robuste, index, auto-play) ===
  try {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentSlide = 0;
    let autoPlayInterval = null;

    function showSlide(index) {
      try {
        if (!slides.length || !indicators.length) return;
        // Clamp index
        index = Math.max(0, Math.min(index, slides.length - 1));
        currentSlide = index;
        slides.forEach((slide, i) => {
          slide.classList.toggle('active', i === index);
        });
        indicators.forEach((indicator, i) => {
          indicator.classList.toggle('active', i === index);
        });
      } catch (e) {
        console.error("Erreur showSlide :", e);
      }
    }

    function nextSlide() {
      if (!slides.length) return;
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }

    function prevSlide() {
      if (!slides.length) return;
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(currentSlide);
    }

    // Navigation boutons
    if (nextBtn) nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextSlide();
    });
    if (prevBtn) prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevSlide();
    });

    // Indicateurs
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        showSlide(index);
      });
    });

    // Auto-play (évite fuite mémoire)
    function startAutoPlay() {
      if (autoPlayInterval) clearInterval(autoPlayInterval);
      autoPlayInterval = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    function stopAutoPlay() {
      if (autoPlayInterval) clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }

    // Pause auto-play au survol/carrousel focus
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
      carouselContainer.addEventListener('mouseenter', stopAutoPlay);
      carouselContainer.addEventListener('mouseleave', startAutoPlay);
      carouselContainer.addEventListener('focusin', stopAutoPlay);
      carouselContainer.addEventListener('focusout', startAutoPlay);
    }

    // Initialiser le carrousel
    showSlide(0);
    startAutoPlay();

    // Nettoyage à la destruction (bonne pratique)
    window.addEventListener('beforeunload', () => {
      stopAutoPlay();
    });
  } catch (e) {
    console.error("Erreur carrousel :", e);
  }

  // === ZOOM IMAGE PRODUIT ===
  try {
    const modal = document.getElementById("image-zoom-modal");
    const zoomedImage = document.getElementById("zoomed-image");

    document.body.addEventListener("click", (e) => {
      try {
        const img = e.target.closest(".product-image img");
        if (img && modal && zoomedImage) {
          e.preventDefault();
          zoomedImage.src = img.src;
          zoomedImage.alt = img.alt;
          modal.classList.add("open");
          modal.setAttribute("aria-hidden", "false");
        }
      } catch (e) {
        console.error("Erreur ouverture zoom image :", e);
      }
    });

    if (modal) {
      modal.addEventListener("click", () => {
        try {
          modal.classList.remove("open");
          modal.setAttribute("aria-hidden", "true");
        } catch (e) {
          console.error("Erreur fermeture zoom image :", e);
        }
      });
    }

    // Fermer avec Escape
    document.addEventListener("keydown", (e) => {
      try {
        if (e.key === "Escape" && modal?.classList.contains("open")) {
          modal.classList.remove("open");
          modal.setAttribute("aria-hidden", "true");
        }
      } catch (e) {
        console.error("Erreur fermeture zoom image (Escape) :", e);
      }
    });
  } catch (e) {
    console.error("Erreur zoom image :", e);
  }
});