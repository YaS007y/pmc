// utilitaire : normaliser une catégorie (tolérant aux apostrophes, espaces, majuscules)
const normalizeCategory = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/['"`\u2019]/g, "") // enlever apostrophes typographiques
    .replace(/[^a-z0-9]+/g, "_") // remplacer séparateurs par underscore
    .replace(/^_+|_+$/g, ""); // supprimer underscores aux bords

// Polyfill IntersectionObserver (amélioration du fallback — n'appelle pas observe immédiatement)
(() => {
  if (!("IntersectionObserver" in window)) {
    function throttle(fn, wait) {
      let last = 0, timer = null;
      return function (...args) {
        const now = Date.now();
        const remaining = wait - (now - last);
        if (remaining <= 0) {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          last = now;
          fn.apply(this, args);
        } else if (!timer) {
          timer = setTimeout(() => {
            last = Date.now();
            timer = null;
            fn.apply(this, args);
          }, remaining);
        }
      };
    }

    window.IntersectionObserver = function (callback, options = {}) {
      this._callback = callback;
      this._options = options;
      this._targets = new Set();

      const check = () => {
        if (!this._targets.size) return;
        const entries = [];
        this._targets.forEach((el) => {
          try {
            const rect = el.getBoundingClientRect();
            const vw = window.innerWidth || document.documentElement.clientWidth;
            const vh = window.innerHeight || document.documentElement.clientHeight;
            const margin = this._options.rootMargin || "0px";
            const marginValue = Number.parseInt(margin) || 0;
            const isIntersecting =
              rect.top < vh + marginValue &&
              rect.bottom > -marginValue &&
              rect.left < vw + marginValue &&
              rect.right > -marginValue;
            entries.push({
              target: el,
              isIntersecting: !!isIntersecting,
              intersectionRatio: isIntersecting ? 1 : 0,
            });
          } catch (e) {
            // l'élément peut être détaché — ignorer
          }
        });
        if (entries.length) {
          try {
            this._callback(entries, this);
          } catch (e) {
            /* noop */
          }
        }
      };

      const throttledCheck = throttle(check, 150);

      this._throttledCheck = throttledCheck;

      window.addEventListener("scroll", throttledCheck, { passive: true });
      window.addEventListener("resize", throttledCheck);

      this.observe = (el) => {
        if (!el) return;
        this._targets.add(el);
        throttledCheck();
      };
      this.unobserve = (el) => {
        this._targets.delete(el);
      };
      this.disconnect = () => {
        this._targets.clear();
        if (this._throttledCheck) {
          window.removeEventListener("scroll", this._throttledCheck);
          window.removeEventListener("resize", this._throttledCheck);
        }
      };
    };
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  // Cache pour éviter re-sélections DOM
  let productCardsCache = null;
  let imageObserver = null;
  let observer = null;

  const getProductCards = () => {
    if (!productCardsCache) {
      productCardsCache = Array.from(document.querySelectorAll(".product-card"));
    }
    return productCardsCache;
  };

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
      // Navigation clavier (fermer menu avec ESC)
      document.addEventListener("keydown", (e) => {
        if (navLinks.classList.contains("open") && e.key === "Escape") {
          navLinks.classList.remove("open");
          menuToggle.classList.remove("open");
          document.body.classList.remove("menu-open");
          menuToggle.setAttribute("aria-expanded", "false");
          menuToggle.focus();
        }
      });
      // Délégation : fermer menu au clic sur un lien
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

  // === FILTRAGE PRODUITS AVEC DROPDOWN (délégation) ===
  try {
    const filterContainer = document.querySelector(".category-filters");
    const dropdownContainer = document.querySelector(".filter-dropdown-container");
    const categoriesDropdown = dropdownContainer?.querySelector(".filter-dropdown-list");

    if (filterContainer) {
      filterContainer.addEventListener("click", (e) => {
        // Accepte .filter-btn (tous les boutons ont maintenant cette classe)
        const btn = e.target.closest(".filter-btn");
        if (btn && btn.hasAttribute("data-category")) {
          const rawCategory = btn.getAttribute("data-category") || "";
          const selected = normalizeCategory(rawCategory);

          // Active le bouton sélectionné
          filterContainer.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          // Filtre les produits
          getProductCards().forEach((card) => {
            const cardCatRaw = card.getAttribute("data-category") || card.dataset.category || "";
            const cardCat = normalizeCategory(cardCatRaw);
            const matches = selected === "tous" || selected === "" ? true : cardCat === selected;
            card.style.display = matches ? "" : "none";
          });

          // Ferme la dropdown si besoin
          if (btn.classList.contains("dropdown-item")) {
            dropdownContainer.classList.remove("open");
            categoriesDropdown.classList.remove("show");
          }
        }
      });
    }
  } catch (e) {
    console.error("Erreur filtre catalogue :", e);
  }

  // === ANIMATIONS AVEC INTERSECTION OBSERVER + FALLBACK ===
  try {
    const animatedEls = document.querySelectorAll(".product-card, .service-card, .info-card, .review-card");
    if (animatedEls.length > 0) {
      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) entry.target.classList.add("animate");
            });
          },
          { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );
        animatedEls.forEach((el) => observer.observe(el));
      } else {
        animatedEls.forEach((el) => el.classList.add("animate"));
      }
    }
  } catch (e) {
    console.error("Erreur animations :", e);
  }

  // === CARROUSEL AVEC GLISSEMENT, PAUSE SUR FOCUS/SURVOL, ACCESSIBILITÉ ===
  try {
    const slides = document.querySelectorAll(".carousel-slide");
    const indicators = document.querySelectorAll(".indicator");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const slidesContainer = document.getElementById("carouselSlides");

    if (slides.length > 0 && indicators.length > 0) {
      let current = 0, interval, isPaused = false;

      function showSlide(index) {
        if (index < 0 || index >= slides.length) return;
        slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
        indicators.forEach((ind, i) => ind.classList.toggle("active", i === index));
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

      if (slidesContainer) {
        slidesContainer.addEventListener("mouseenter", () => {
          isPaused = true;
          stopAuto();
        });
        slidesContainer.addEventListener("mouseleave", () => {
          isPaused = false;
          startAuto();
        });
        slidesContainer.addEventListener("focusin", () => {
          isPaused = true;
          stopAuto();
        });
        slidesContainer.addEventListener("focusout", () => {
          isPaused = false;
          startAuto();
        });
      }

      let startX = null;
      if (slidesContainer) {
        slidesContainer.addEventListener(
          "touchstart",
          (e) => {
            startX = e.touches[0].clientX;
          },
          { passive: true }
        );

        slidesContainer.addEventListener(
          "touchend",
          (e) => {
            if (startX === null) return;
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 50) {
              if (dx < 0) nextSlide();
              else prevSlide();
              stopAuto();
              startAuto();
            }
            startX = null;
          },
          { passive: true }
        );
      }

      indicators.forEach((ind, i) => {
        ind.addEventListener("click", () => {
          showSlide(i);
          stopAuto();
          startAuto();
        });
      });

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          nextSlide();
          stopAuto();
          startAuto();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          prevSlide();
          stopAuto();
          startAuto();
        });
      }

      if (slidesContainer) {
        slidesContainer.setAttribute("tabindex", "0");
        slidesContainer.setAttribute("role", "region");
        slidesContainer.setAttribute("aria-label", "Carrousel d'actualités");
        slidesContainer.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            nextSlide();
            stopAuto();
            startAuto();
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            prevSlide();
            stopAuto();
            startAuto();
          }
        });
      }

      showSlide(0);
      startAuto();

      window.addEventListener("beforeunload", () => {
        if (interval) clearInterval(interval);
      });
    }
  } catch (e) {
    console.error("Erreur carousel :", e);
  }

  // === PANIER WHATSAPP AVEC PERSISTANCE ET QUANTITÉ ===
  try {
    const cartPanel = document.getElementById("cart-panel");
    const openCartBtn = document.getElementById("openCart");
    const closeCartBtn = document.getElementById("closeCart");
    const cartList = document.getElementById("cart-list");
    const cartTotal = document.getElementById("cart-total");
    const cartWhatsappBtn = document.getElementById("cart-whatsapp");

    if (cartPanel && openCartBtn && closeCartBtn && cartList && cartTotal && cartWhatsappBtn) {
      function getCart() {
        try {
          const cartData = localStorage.getItem("pmc_cart");
          return cartData ? JSON.parse(cartData) : [];
        } catch (e) {
          console.warn("Erreur lecture localStorage :", e);
          return [];
        }
      }

      function setCart(cart) {
        try {
          localStorage.setItem("pmc_cart", JSON.stringify(cart));
        } catch (e) {
          console.warn("Erreur sauvegarde localStorage :", e);
        }
      }

      let cart = getCart();

      openCartBtn.addEventListener("click", () => {
        cartPanel.classList.add("open");
        cartPanel.setAttribute("aria-hidden", "false");
      });

      closeCartBtn.addEventListener("click", () => {
        cartPanel.classList.remove("open");
        cartPanel.setAttribute("aria-hidden", "true");
      });

      cartPanel.addEventListener("click", (e) => {
        if (e.target === cartPanel) {
          cartPanel.classList.remove("open");
          cartPanel.setAttribute("aria-hidden", "true");
        }
      });

      document.body.addEventListener("click", (e) => {
        const prodBtn = e.target.closest(".product-btn");
        if (prodBtn) {
          e.preventDefault();
          const card = prodBtn.closest(".product-card");
          if (card) {
            const nameEl = card.querySelector(".product-name");
            const priceEl = card.querySelector(".product-price");
            const name = nameEl?.textContent?.trim() || "";
            const price = priceEl?.textContent?.trim() || "";
            if (name && price) {
              const found = cart.find((item) => item.name === name && item.price === price);
              if (found) {
                found.qty += 1;
              } else {
                cart.push({ name, price, qty: 1 });
              }
              setCart(cart);
              updateCart();
              cartPanel.classList.add("open");
              cartPanel.setAttribute("aria-hidden", "false");
            }
          }
        }
      });

      function updateCart() {
        cart = getCart();
        while (cartList.firstChild) cartList.removeChild(cartList.firstChild);

        if (cart.length === 0) {
          const emptyLi = document.createElement("li");
          emptyLi.style.textAlign = "center";
          emptyLi.style.color = "#888";
          emptyLi.textContent = "Votre panier est vide.";
          cartList.appendChild(emptyLi);
          cartTotal.textContent = "";
          cartWhatsappBtn.style.display = "none";
          return;
        }

        let total = 0;
        cart.forEach((item, idx) => {
          const prixNum = Number.parseInt((item.price || "").replace(/[^\d]/g, "")) || 0;
          total += prixNum * item.qty;

          const li = document.createElement("li");

          const textSpan = document.createElement("span");
          textSpan.textContent = `${item.name} `;

          const priceSpan = document.createElement("span");
          priceSpan.style.color = "#2E5BBA";
          priceSpan.textContent = `${item.price}`;

          textSpan.appendChild(priceSpan);
          textSpan.appendChild(document.createTextNode(` x${item.qty}`));

          const remBtn = document.createElement("button");
          remBtn.className = "cart-remove";
          remBtn.type = "button";
          remBtn.setAttribute("title", `Retirer ${item.name}`);
          remBtn.setAttribute("data-idx", String(idx));
          remBtn.setAttribute("aria-label", `Retirer ${item.name}`);
          remBtn.textContent = "×";

          li.appendChild(textSpan);
          li.appendChild(remBtn);
          cartList.appendChild(li);
        });

        cartTotal.textContent = `Total : ${total.toLocaleString()} F`;
        cartWhatsappBtn.style.display = "block";
      }

      cartList.addEventListener("click", (e) => {
        const rem = e.target.closest(".cart-remove");
        if (rem) {
          const idx = Number.parseInt(rem.getAttribute("data-idx"));
          if (!isNaN(idx) && idx >= 0 && idx < cart.length && cart[idx]) {
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

      cartWhatsappBtn.addEventListener("click", () => {
        if (cart.length === 0) return;
        let message = "Bonjour, je souhaite commander :\n\n";
        cart.forEach((item) => {
          message += `- ${item.name} ${item.price} x${item.qty}\n`;
        });
        message += "\nMerci de me confirmer la disponibilité et le prix total.";
        const whatsappURL = `https://wa.me/22678997603?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, "_blank", "noopener,noreferrer");
      });

      updateCart();
      cartPanel.setAttribute("aria-hidden", "true");
      cartPanel.classList.remove("open");
    }
  } catch (e) {
    console.error("Erreur panier WhatsApp :", e);
  }

  // === CHARGEMENT PAISIBLE DES IMAGES (FALLBACK ROBUSTE) ===
  try {
    const lazySelector = 'img[loading="lazy"], img[data-src], img[data-srcset]';
    const lazyImages = document.querySelectorAll(lazySelector);

    if ("loading" in HTMLImageElement.prototype) {
      lazyImages.forEach((img) => {
        img.loading = "lazy";
      });
    } else {
      if (lazyImages.length > 0 && "IntersectionObserver" in window) {
        imageObserver = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute("data-src");
                }
                if (img.dataset.srcset) {
                  img.srcset = img.dataset.srcset;
                  img.removeAttribute("data-srcset");
                }
                obs.unobserve(img);
              }
            });
          },
          { rootMargin: "100px 0px" }
        );
        lazyImages.forEach((img) => imageObserver.observe(img));
      } else {
        lazyImages.forEach((img) => {
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute("data-srcset");
          }
        });
      }
    }
  } catch (e) {
    console.error("Erreur lazy loading :", e);
  }

  // === ZOOM IMAGE PRODUIT AU CLIC (piège de focus léger + nettoyage) ===
  try {
    const modal = document.getElementById("image-zoom-modal");
    const zoomedImg = document.getElementById("zoomed-image");
    let _lastFocusBeforeZoom = null;
    let _trapHandler = null;

    if (modal && zoomedImg) {
      if (!modal.hasAttribute("tabindex")) modal.setAttribute("tabindex", "-1");
      if (!modal.getAttribute("role")) modal.setAttribute("role", "dialog");
      if (!modal.getAttribute("aria-label")) modal.setAttribute("aria-label", "Image agrandie");

      const focusableSelector =
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
      const getFocusable = () => {
        return Array.from(modal.querySelectorAll(focusableSelector)).filter(
          (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length
        );
      };

      function trapFocus(e) {
        if (e.key !== "Tab") return;
        const focusable = getFocusable();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || active === modal) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }

      function openZoom(imgSrc, imgAlt) {
        try {
          _lastFocusBeforeZoom = document.activeElement;
        } catch (e) {
          _lastFocusBeforeZoom = null;
        }
        zoomedImg.src = imgSrc;
        zoomedImg.alt = imgAlt || "Aperçu du produit";
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        try {
          modal.focus();
        } catch (e) {
          /* noop */
        }
        _trapHandler = trapFocus;
        document.addEventListener("keydown", _trapHandler);
      }

      function closeZoom() {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        zoomedImg.src = "";
        document.body.style.overflow = "";
        try {
          if (_lastFocusBeforeZoom && typeof _lastFocusBeforeZoom.focus === "function") _lastFocusBeforeZoom.focus();
        } catch (e) {
          /* noop */
        }
        if (_trapHandler) {
          document.removeEventListener("keydown", _trapHandler);
          _trapHandler = null;
        }
      }

      document.body.addEventListener("click", (e) => {
        let imgEl = null;
        const clicked = e.target;
        if (
          clicked &&
          clicked.tagName &&
          clicked.tagName.toLowerCase() === "img" &&
          clicked.closest(".product-image")
        ) {
          imgEl = clicked;
        } else {
          const container = e.target.closest && e.target.closest(".product-image");
          if (container) imgEl = container.querySelector("img");
        }

        if (imgEl) {
          if (imgEl.src) openZoom(imgEl.src, imgEl.alt);
        }
        if (e.target === modal) closeZoom();
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("open")) {
          closeZoom();
        }
      });

      modal.setAttribute("aria-hidden", "true");
    }
  } catch (e) {
    console.error("Erreur zoom image produit :", e);
  }

  // === SERVICE WORKER POUR L'HORS-LIGNE (échec silencieux) ===
  try {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(() => {
          /* échouer silencieusement */
        });
      });
    }
  } catch (e) {
    console.error("Erreur service worker :", e);
  }

  // Cleanup global avant déchargement
  window.addEventListener("beforeunload", () => {
    if (observer && observer.disconnect) observer.disconnect();
    if (imageObserver && imageObserver.disconnect) imageObserver.disconnect();
  });
});
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
    // Correction : on retire le stopPropagation sur la liste pour permettre le filtrage
    // dropdownContainer.querySelector(".filter-dropdown-list").addEventListener("click", e => e.stopPropagation());
  }
} catch (e) {
  console.error("Erreur dropdown filtres :", e);
}
