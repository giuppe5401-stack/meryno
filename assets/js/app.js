
(function(){
  function euro(n){return '€'+Number(n).toFixed(2).replace('.',',');}
  async function loadProducts(selector){
    const el = document.querySelector(selector);
    if(!el) return;
    const src = el.getAttribute('data-source');
    const res = await fetch(src);
    const items = await res.json();
    // Featured: first 4
    const subset = el.id==='featured-products' ? items.slice(0,4) : items;
    el.innerHTML = subset.map(p => `
      <article class="product-card">
        <div class="ph" role="img" aria-label="${p.name}"></div>
        <div class="body">
          <h3>${p.name}</h3>
          <p class="muted">${p.short}</p>
          <p class="price">${euro(p.price)}</p>
          <div style="display:flex;gap:8px">
            <a class="btn" href="prodotto.html#${p.id}">Dettagli</a>
            <button class="btn btn-fill" data-add="${p.id}">Aggiungi</button>
          </div>
        </div>
      </article>
    `).join('');
    el.addEventListener('click', e=>{
      const id = e.target && e.target.getAttribute('data-add');
      if(id){ addToCart(id, 1, items); }
    });
  }

  function getCart(){ try{return JSON.parse(localStorage.getItem('cart')||'[]');}catch(e){return []}}
  function setCart(c){ localStorage.setItem('cart', JSON.stringify(c)); updateCartCount(); }
  function updateCartCount(){ const c = getCart().reduce((s,i)=>s+i.qty,0); const el = document.getElementById('cart-count'); if(el) el.textContent = c; }
  function addToCart(id, qty, items){
    const cart = getCart();
    const found = cart.find(x=>x.id===id);
    if(found){ found.qty += qty; } else {
      const p = items.find(x=>x.id===id); if(!p) return;
      cart.push({id, name:p.name, price:p.price, qty});
    }
    setCart(cart);
    alert('Aggiunto al carrello');
  }

  async function hydrateProductDetail(){
    const el = document.getElementById('product-detail'); if(!el) return;
    const id = location.hash.replace('#','');
    const items = await (await fetch('data/products.json')).json();
    const p = items.find(x=>x.id===id) || items[0];
    document.getElementById('p-name').textContent = p.name;
    document.getElementById('p-desc').textContent = p.long || p.short;
    document.getElementById('p-price').textContent = euro(p.price);
    document.getElementById('add-to-cart').onclick = ()=>{
      const qty = Number(document.getElementById('p-qty').value)||1;
      const cart = getCart();
      const f = cart.find(x=>x.id===p.id);
      if(f){ f.qty += qty; } else { cart.push({id:p.id, name:p.name, price:p.price, qty}); }
      setCart(cart);
      alert('Aggiunto al carrello');
    };
  }

  function renderCart(){
    const tbody = document.getElementById('cart-rows'); if(!tbody) return;
    const cart = getCart();
    tbody.innerHTML = cart.map((i,idx)=>`
      <tr>
        <td>${i.name}</td>
        <td>${euro(i.price)}</td>
        <td><input type="number" min="1" value="${i.qty}" data-idx="${idx}"></td>
        <td>${euro(i.price*i.qty)}</td>
        <td><button class="btn" data-del="${idx}">✕</button></td>
      </tr>`).join('');
    const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
    const t = document.getElementById('cart-total'); if(t) t.textContent = 'Totale: '+euro(total);
    tbody.oninput = (e)=>{
      const i = e.target.getAttribute('data-idx'); if(i==null) return;
      const cart = getCart(); cart[i].qty = Number(e.target.value)||1; setCart(cart); renderCart();
    };
    tbody.onclick = (e)=>{
      const i = e.target.getAttribute('data-del'); if(i==null) return;
      const cart = getCart(); cart.splice(Number(i),1); setCart(cart); renderCart();
    };
  }

  // Filters (basic)
  async function initCatalogFilters(){
    const list = document.getElementById('product-list'); if(!list) return;
    const src = list.getAttribute('data-source');
    let items = await (await fetch(src)).json();
    function draw(arr){
      list.innerHTML = arr.map(p=>`
        <article class="product-card">
          <div class="ph" role="img" aria-label="${p.name}"></div>
          <div class="body">
            <h3>${p.name}</h3>
            <p class="muted">${p.short}</p>
            <p class="price">${euro(p.price)}</p>
            <div style="display:flex;gap:8px">
              <a class="btn" href="prodotto.html#${p.id}">Dettagli</a>
              <button class="btn btn-fill" data-add="${p.id}">Aggiungi</button>
            </div>
          </div>
        </article>`).join('');
    }
    draw(items);
    document.getElementById('apply-filters').onclick = ()=>{
      const cat = document.getElementById('f-category').value;
      const max = Number(document.getElementById('f-price').value||Infinity);
      const arr = items.filter(p => (!cat||p.category===cat) && p.price<=max);
      draw(arr);
    };
    list.addEventListener('click', e=>{
      const id = e.target && e.target.getAttribute('data-add'); if(!id) return;
      addToCart(id,1,items);
    });
  }

  // boot
  document.addEventListener('DOMContentLoaded', function(){
    updateCartCount();
    loadProducts('#featured-products');
    hydrateProductDetail();
    renderCart();
    initCatalogFilters();
  });
})();