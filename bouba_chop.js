document.addEventListener("DOMContentLoaded", function() {
    // Si le bouton existe déjà, on ne le recrée pas
    if (document.getElementById('btn-open-bouba')) return;

    const style = document.createElement('style');
    style.innerHTML = `
        /* BOUTON BOUTIQUE VITALITÉ */
        .bouba-fab {
            position: fixed; bottom: 85px; right: 15px;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000; border: 2px solid #00FF00; border-radius: 50px;
            padding: 10px 15px; font-weight: bold; font-size: 14px;
            display: flex; align-items: center; gap: 8px; cursor: pointer;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.8); z-index: 99999;
            animation: shop-pulse 1.5s infinite alternate;
            transition: all 0.1s;
        }
        .bouba-fab:active { transform: scale(0.9); box-shadow: 0 0 25px #00FF00; }
        @keyframes shop-pulse { 
            0% { box-shadow: 0 0 10px #FFD700; } 
            100% { box-shadow: 0 0 25px #00FF00, inset 0 0 10px #FFD700; } 
        }

        /* OVERLAY BOUTIQUE */
        .bouba-shop-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: #000; z-index: 100000; display: none;
            flex-direction: column; overflow-y: auto; opacity: 0; transition: opacity 0.2s;
        }
        .bouba-shop-overlay.active { display: flex; opacity: 1; }
        
        .bouba-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 2px solid #FFD700; }
        .bouba-title { color: #FFD700; font-size: 20px; margin: 0; text-shadow: 0 0 10px #FFD700; }
        .bouba-close-btn { background: #FFD700; color: #000; border: none; padding: 8px 15px; border-radius: 20px; font-weight: bold; }
        
        .bouba-search-container { padding: 15px; }
        .bouba-search { width: 100%; padding: 12px; border-radius: 30px; border: 2px solid #00FF00; background: #111; color: white; outline: none; }
        
        .bouba-products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 15px; padding-bottom: 100px; }
        .bouba-card { background: #111; border: 1px solid #FFD700; border-radius: 10px; overflow: hidden; }
        .bouba-card-img { width: 100%; height: 150px; object-fit: cover; }
        .bouba-card-content { padding: 10px; }
        .bouba-card-title { color: white; font-size: 12px; margin: 0; }
        .bouba-card-price { color: #FFD700; font-weight: bold; font-size: 14px; margin: 5px 0; }
        .bouba-btn-add { background: #00FF00; color: #000; border: none; border-radius: 5px; padding: 8px; font-weight: bold; width: 100%; margin-top: 5px; }
    `;
    document.head.appendChild(style);

    const produits = [
        { id: 1, nom: "Ensemble 2 pièce blanc", prix: "10 000 F", img: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=400" },
        { id: 2, nom: "Ensemble Marrón", prix: "12 000 F", img: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=400" }
    ];

    const appContainer = document.createElement('div');
    appContainer.innerHTML = `
        <button id="btn-open-bouba" class="bouba-fab">🎁 BOUTIQUE ✨</button>
        <div id="bouba-shop" class="bouba-shop-overlay">
            <div class="bouba-header">
                <h2 class="bouba-title">👑 BOUBA STOR</h2>
                <button id="btn-close-bouba" class="bouba-close-btn">Fermer ✕</button>
            </div>
            <div class="bouba-search-container">
                <input type="text" class="bouba-search" placeholder="🔍 Chercher un article...">
            </div>
            <div class="bouba-products-grid">
                ${produits.map(p => `
                    <div class="bouba-card">
                        <img src="${p.img}" class="bouba-card-img">
                        <div class="bouba-card-content">
                            <h3 class="bouba-card-title">${p.nom}</h3>
                            <p class="bouba-card-price">${p.prix}</p>
                            <button class="bouba-btn-add">Ajouter</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(appContainer);

    document.getElementById('btn-open-bouba').addEventListener('click', () => {
        document.getElementById('bouba-shop').classList.add('active');
    });
    document.getElementById('btn-close-bouba').addEventListener('click', () => {
        document.getElementById('bouba-shop').classList.remove('active');
    });
});
