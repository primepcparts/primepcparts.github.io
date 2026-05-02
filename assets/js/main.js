// assets/js/main.js - ROBUST VERSION (Handles empty rows)
const CONFIG = {
  whatsappNumber: "918275433068"
};

let allData = [];
let currentPage = 1;
const itemsPerPage = 6;

function initProductPage(sheetName, containerId, imageFolder, detailsPage = false) {
  const sheetUrl = `https://opensheet.elk.sh/1iUhbStYP6d63-AFyalNRyLUAhsEhDf7JF0pzKoqYK6M/${sheetName}`;

  fetch(sheetUrl)
    .then(r => r.json())
    .then(rawData => {
      allData = rawData.filter(item => 
        item && 
        item.Name && 
        item.Name.trim() !== "" &&
        item.Price && 
        !isNaN(parseFloat(item.Price))
      );

      if (!allData.length) {
        document.getElementById(containerId).innerHTML = `<p class="text-center py-4" style="color:#aaa;">No products available.</p>`;
        return;
      }

      allData.sort((a, b) => {
        const sa = parseInt(a.Quantity || 0) > 0 ? 1 : 0;
        const sb = parseInt(b.Quantity || 0) > 0 ? 1 : 0;
        return sb - sa || parseFloat(a.Price) - parseFloat(b.Price);
      });

      renderPage(1, containerId, imageFolder, detailsPage);
    })
    .catch(err => console.error("Failed to load sheet:", err));
}

async function renderCards(data, start, end, containerId, imageFolder, detailsPage) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!data.length) {
    container.innerHTML = `<p class="text-center py-4" style="color:#aaa;">No items match your filters.</p>`;
    return;
  }

  for (let i = start; i < end; i++) {
    const item = data[i];
    if (!item || !item.Name) continue;

    const photos = item.PhotoFolder ? await getLocalImagePaths(item.PhotoFolder, imageFolder) : [];

    let imgHtml = '';
    if (photos.length > 0) {
      imgHtml = `<img src="${photos[0]}" class="card-img-top" alt="${item.Name}" onclick="openFS(${JSON.stringify(photos)}, 0)">`;
    } else {
      imgHtml = `<div class="card-icon-placeholder" style="height:180px;background:#1e2a44;display:flex;align-items:center;justify-content:center;"><i class="fas fa-image fa-3x" style="color:#555"></i></div>`;
    }

    const inStock = parseInt(item.Quantity || 0) > 0;
    const actionHtml = inStock 
      ? `<div class="form-group"><label>Qty:</label><select class="form-control" id="qty-${i}">${genQtyOpts(item.Quantity)}</select></div>
         <button class="btn-buy" onclick="buyItem('${item.Name}','${item.Price}',${i})"><i class="fab fa-whatsapp me-1"></i>Buy It</button>`
      : `<button class="btn-inquiry" onclick="placeInquiry('${item.Name}','${item.Price}')"><i class="fas fa-bell me-1"></i>Notify Me</button>`;

    container.insertAdjacentHTML('beforeend', `
      <div class="col-6 col-md-4">
        <div class="card">
          ${imgHtml}
          <div class="card-body">
            <h5 class="card-title" onclick="${detailsPage ? `viewDetails('${encodeURIComponent(item.Name)}')` : ''}" 
                style="${detailsPage ? 'cursor:pointer;' : 'cursor:default;color:#fff;'}">
              ${item.Name}
            </h5>
            <p class="card-text"><strong>₹${item.Price}</strong></p>
            <p class="card-text">
              <i class="fas fa-circle me-1" style="font-size:0.55rem;color:${inStock?'#4ade80':'#f87171'}"></i>
              <span class="${inStock ? 'stock-in' : 'stock-out'}">${inStock ? 'In Stock' : 'Out of Stock'}</span>
            </p>
            ${actionHtml}
          </div>
        </div>
      </div>
    `);
  }
}

// Other functions (same as before)
function renderPage(page, containerId, imageFolder, detailsPage) {
  currentPage = page;
  const filtered = applyFiltersLogic();
  const start = (page - 1) * itemsPerPage;
  renderCards(filtered, start, start + itemsPerPage, containerId, imageFolder, detailsPage);
  renderPagination(filtered.length);
}

function applyFiltersLogic() {
  const nm = document.getElementById('filter-name')?.value.toLowerCase() || '';
  const mn = parseFloat(document.getElementById('filter-price-min')?.value) || 0;
  const mx = parseFloat(document.getElementById('filter-price-max')?.value) || Infinity;
  const st = document.getElementById('filter-stock')?.value || 'all';

  return allData.filter(item => {
    const n = (item.Name || '').toLowerCase();
    const p = parseFloat(item.Price) || 0;
    const q = parseInt(item.Quantity) || 0;
    return n.includes(nm) && p >= mn && p <= mx &&
      (st === 'all' || (st === 'in-stock' && q > 0) || (st === 'out-of-stock' && q === 0));
  });
}

function applyFilters() { renderPage(1); }

function renderPagination(total) {
  const pg = document.getElementById('pagination');
  if (!pg) return;
  pg.innerHTML = '';
  const pages = Math.ceil(total / itemsPerPage);
  for (let i = 1; i <= pages; i++) {
    pg.insertAdjacentHTML('beforeend', `<li class="page-item${i===currentPage?' active':''}"><a class="page-link" href="#" onclick="renderPage(${i});return false;">${i}</a></li>`);
  }
}

async function getLocalImagePaths(folder, baseFolder) {
  const paths = [];
  for (let i = 1; i <= 5; i++) {
    const p = `assets/img/${baseFolder}/${folder}/photo${i}.jpeg`;
    try {
      const r = await fetch(p);
      if (r.ok) paths.push(p);
    } catch(e) {}
  }
  return paths;
}

function genQtyOpts(max) {
  let o = '';
  for (let i = 1; i <= Math.min(parseInt(max)||1, 10); i++) o += `<option value="${i}">${i}</option>`;
  return o;
}

function openFS(photos, idx) {
  if (!photos || !photos.length) return;
  const modal = document.getElementById('fullScreenModal');
  const img = document.getElementById('fullScreenImage');
  img.src = photos[idx];
  modal.style.display = 'flex';
}

function buyItem(name, price, idx) {
  const qty = document.getElementById(`qty-${idx}`)?.value || 1;
  const msg = `*PrimePcParts*\nItem: ${name}\nPrice: ₹${price}\nQty: ${qty}`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

function placeInquiry(name, price) {
  const msg = `*PrimePcParts - Inquiry*\nItem: ${name}\nPrice: ₹${price}\nOut of stock.`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

function viewDetails(encodedName) {
  window.location.href = `gpu-details.html?name=${encodedName}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('backToTop');
  if (btn) {
    window.addEventListener('scroll', () => btn.style.display = window.scrollY > 300 ? 'flex' : 'none');
  }
});