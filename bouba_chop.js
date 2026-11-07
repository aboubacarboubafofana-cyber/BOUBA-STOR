(function() {
    // 1. INJECTION DU CSS (Couleurs BOUBA STOR & Vitalité)
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --bouba-noir: #000000;
            --bouba-or: #FFD700;
            --bouba-vert: #00FF00;
            --bouba-violet: #4B0082;
            --bouba-blanc: #FFFFFF;
        }

        /* Bouton flottant Générosité / Attirance */
        .bouba-fab {
            position: fixed;
            bottom: 80px; /* Au-dessus de ta barre de navigation */
            right: 20px;
            background: linear-gradient(135deg, var(--bouba-or), #FFA500);
            color: var(--bouba-noir);
            border: 2px solid var(--bouba-vert);
            border-radius: 50px;
            padding: 12px 20px;
            font-weight: bold;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
            z-index: 9999;
            animation: pulse-vitalite 2s infinite;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .bouba-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 0 25px var(--bouba-vert);
        }

        @keyframes pulse-vitalite {
            0% { box-shadow: 0 0 10px var(--bouba-or); }
            50% { box-shadow: 0 0 25px var(--bouba-vert); }
            100% { box-shadow: 0 0 10px var(--bouba-or); }
        }

        /* Conteneur principal de la boutique */
        .bouba-shop-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: var(--bouba-noir);
            z-index: 10000;
            display: none;
            flex-direction: column;
            overflow-y: auto;
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        .bouba-shop-overlay.active {
            display: flex;
            opacity: 1;
        }

        /* Header Boutique */
        .bouba-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 2px solid var(--bouba-or);
            background: var(--bouba-noir);
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .bouba-title {
            color: var(--bouba-or);
            font-size: 20px;
            font-weight: bold;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .bouba-close-btn {
            background: var(--bouba-or);
            color: var(--bouba-noir);
            border: none;
            padding: 8px 15px;
            border-radius: 20px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
        }
        .bouba-close-btn:hover { background: var(--bouba-vert); }

        /* Barre de recherche Jumia-Like */
        .bouba-search-container {
            padding: 15px;
            display: flex;
            gap: 10px;
        }
        .bouba-search {
            flex: 1;
            padding: 12px 20px;
            border-radius: 30px;
            border: 2px solid var(--bouba-or);
            background: transparent;
            color: var(--bouba-blanc);
            outline: none;
        }
        .bouba-search::placeholder { color: #888; }

        /* Grille de produits */
        .bouba-products-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            padding: 15px;
            padding-bottom: 100px;
        }

        /* Carte Produit (Sensibilité & Design) */
        .bouba-card {
            background: #111;
            border: 1px solid var(--bouba-or);
            border-radius: 15px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: transform 0.3s ease, border-color 0.3s ease;
        }
        .bouba-card:hover {
            transform: translateY(-5px);
            border-color: var(--bouba-vert);
        }
        .bouba-card-img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        .bouba-card-content {
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .bouba-card-title {
            color: var(--bouba-blanc);
            font-size: 14px;
            margin: 0;
        }
        .bouba-card-price {
            color: var(--bouba-or);
            font-weight: bold;
            font-size: 16px;
            margin: 5px 0;
        }
        .bouba-btn-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            margin-top: 5px;
        }
        .bouba-btn-mini {
            background: transparent;
            color: var(--bouba-or);
            border: 1px solid var(--bouba-or);
            border-radius: 5px;
            padding: 5px;
            font-size: 10px;
            cursor: pointer;
            text-align: center;
        }
        .bouba-btn-mini:hover { background: var(--bouba-or); color: var(--bouba-noir); }
        
        .bouba-btn-add {
            background: var(--bouba-or);
            color: var(--bouba-noir);
            border: none;
            border-radius: 8px;
            padding: 10px;
            font-weight: bold;
            margin-top: 10px;
            cursor: pointer;
            width: 100%;
            transition: background 0.3s;
        }
        .bouba-btn-add:hover {
            background: var(--bouba-vert);
            box-shadow: 0 0 10px var(--bouba-vert);
        }

        /* Notification Panier (Vitalité) */
        .bouba-toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: var(--bouba-vert);
            color: var(--bouba-noir);
            padding: 10px 20px;
            border-radius: 30px;
            font-weight: bold;
            transition: transform 0.3s ease;
            z-index: 10001;
        }
        .bouba-toast.show { transform: translateX(-50%) translateY(0); }

        /* Badge Panier */
        .bouba-cart-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: red;
            color: white;
            border-radius: 50%;
            padding: 2px 6px;
            font-size: 12px;
        }
    `;
    document.head.appendChild(style);

    // 2. DONNÉES DES PRODUITS (Simulation Jumia)
    const produits = [
        { id: 1, nom: "Ensemble 2 pièce xxl/ blanc et gris", prix: "10 000 F", img: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=400&auto=format&fit=crop" },
        { id: 2, nom: "Ensemble 2 pièce / haut et pantalon / xxl / Marón", prix: "12 000 F", img: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=400&auto=format&fit=crop" },
        { id: 3, nom: "Chemise d'été fleurie", prix: "8 500 F", img: "https://images.unsplash.com/photo-1598033129183-c4f50c7176c9?q=80&w=400&auto=format&fit=crop" },
        { id: 4, nom: "Costume moderne homme", prix: "25 000 F", img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=400&auto=format&fit=crop" }
    ];

    // 3. INJECTION DU HTML
    const appContainer = document.createElement('div');
    appContainer.innerHTML = `
        <!-- Bouton Générosité / Attirance -->
        <button id="btn-open-bouba" class="bouba-fab">
            <span style="font-size: 20px;">🎁</span> ✨ Boutique
        </button>

        <!-- Interface Boutique -->
        <div id="bouba-shop" class="bouba-shop-overlay">
            <div class="bouba-header">
                <h2 class="bouba-title"><span>👑</span> BOUBA STOR</h2>
                <div style="position:relative;">
                    🛒 <span id="bouba-cart-count" class="bouba-cart-badge">0</span>
                </div>
                <button id="btn-close-bouba" class="bouba-close-btn">Fermer ✕</button>
            </div>
            
            <div class="bouba-search-container">
                <input type="text" id="bouba-search-input" class="bouba-search" placeholder="🔍 Chercher un article...">
            </div>

            <div id="bouba-product-list" class="bouba-products-grid">
                <!-- Les produits seront injectés ici par JS -->
            </div>
        </div>

        <!-- Notification -->
        <div id="bouba-toast" class="bouba-toast">Article ajouté au panier !</div>
    `;
    document.body.appendChild(appContainer);

    // 4. LOGIQUE JAVASCRIPT
    const btnOpen = document.getElementById('btn-open-bouba');
    const btnClose = document.getElementById('btn-close-bouba');
    const shopOverlay = document.getElementById('bouba-shop');
    const productList = document.getElementById('bouba-product-list');
    const searchInput = document.getElementById('bouba-search-input');
    const cartCount = document.getElementById('bouba-cart-count');
    const toast = document.getElementById('bouba-toast');
    
    let panier = 0;

    // Ouvrir / Fermer
    btnOpen.addEventListener('click', () => {
        shopOverlay.classList.add('active');
        shopOverlay.style.display = 'flex';
        setTimeout(() => shopOverlay.style.opacity = '1', 10);
    });

    btnClose.addEventListener('click', () => {
        shopOverlay.style.opacity = '0';
        setTimeout(() => {
            shopOverlay.classList.remove('active');
            shopOverlay.style.display = 'none';
        }, 400);
    });

    // Afficher les produits
    function afficherProduits(filtre = "") {
        productList.innerHTML = "";
        const produitsFiltres = produits.filter(p => p.nom.toLowerCase().includes(filtre.toLowerCase()));

        produitsFiltres.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'bouba-card';
            card.innerHTML = `
                <img src="${prod.img}" class="bouba-card-img" alt="${prod.nom}">
                <div class="bouba-card-content">
                    <h3 class="bouba-card-title">${prod.nom}</h3>
                    <p class="bouba-card-price">${prod.prix}</p>
                    
                    <div class="bouba-btn-group">
                        <button class="bouba-btn-mini">🤝 Offre</button>
                        <button class="bouba-btn-mini">🎁 Offrir</button>
                        <button class="bouba-btn-mini">⚖️ Comparer</button>
                        <button class="bouba-btn-mini">❓ Taille</button>
                    </div>

                    <button class="bouba-btn-add" data-id="${prod.id}">🛒 Ajouter</button>
                </div>
            `;
            productList.appendChild(card);
        });

        // Événements "Ajouter au panier"
        document.querySelectorAll('.bouba-btn-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                panier++;
                cartCount.innerText = panier;
                
                // Animation de vitalité
                e.target.style.transform = "scale(0.9)";
                setTimeout(() => e.target.style.transform = "scale(1)", 150);

                // Afficher le toast
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2000);
            });
        });
    }

    // Écouteur pour la recherche (Fonctionnalité Jumia)
    searchInput.addEventListener('input', (e) => {
        afficherProduits(e.target.value);
    });

    // Initialisation
    afficherProduits();

})();