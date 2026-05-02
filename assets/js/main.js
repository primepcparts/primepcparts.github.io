// ================================================
// assets/js/main.js - FINAL WORKING VERSION
// ================================================

console.log("%c✅ PrimePcParts Main JS Loaded Successfully", "color: lime; font-weight: bold");

let allData = [];
let currentPage = 1;
const itemsPerPage = 6;

const CONFIG = {
  whatsappNumber: "918275433068"
};

// Initialize any product page
function initProductPage(sheetName, containerId, imageFolder = 'gpu', enableDetails = true) {
  const sheetUrl = `https://opensheet.elk.sh/1iUhbStYP6d63-AFyalNRyLUAhsEhDf7JF0pzKoqYK6M/${sheetName}`;

  fetch(sheetUrl)
    .then(r => r.json())
    .then(data => {
      allData = data.filter(item => item && item.Name && item.Price && !isNaN(parseFloat(item.Price)));

      if (allData.length === 0) {
        document.getElementById(containerId).innerHTML = `<p class="text-center py-5" style="color:#aaa;">No products available at the moment.</p>`;
        return;
      }

      allData.sort((a, b) => {
        const stockA = parseInt(a.Quantity || 0) > 0 ? 1 : 0;
        const stockB = parseInt(b.Quantity || 0) > 0 ? 1 : 0;
        return stockB - stockA || parseFloat(a.Price) - parseFloat(b.Price);
      });

      renderPage(1, containerId, imageFolder, enableDetails);
    })
    .catch(err => {
      console.error("Failed to load data:", err);
      document.getElementById(containerId).innerHTML = `<p class="text-center py-5" style="color:#f87171;">Unable to load products. Please refresh.</p>`;
    });
}

function renderPage(page, containerId, imageFolder, enableDetails) {
  currentPage = page;
  const filtered = applyFiltersLogic();
  const start = (page - 1) * itemsPerPage;
  renderCards(filtered, start, start + itemsPerPage, containerId, imageFolder, enableDetails);
  renderPagination(filtered.length);
}

function applyFiltersLogic() {
  const nameFilter = (document.getElementById('filter-name')?.value || '').toLowerCase();
  const minPrice = parseFloat(document.getElementById('filter-price-min')?.value) || 0;
  const maxPrice = parseFloat(document.getElementById('filter-price-max')?.value) || Infinity;
  const stockFilter = document.getElementById('filter-stock')?.value || 'all';

  return allData.filter(item => {
    const nameMatch = (item.Name || '').toLowerCase().includes(nameFilter);
    const price = parseFloat(item.Price) || 0;
    const priceMatch = price >= minPrice && price <= maxPrice;
    const stockMatch = stockFilter === 'all' || 
                      (stockFilter === 'in-stock' && parseInt(item.Quantity) > 0) ||
                      (stockFilter === 'out-of-stock' && parseInt(item.Quantity) === 0);
    return nameMatch && priceMatch && stockMatch;
  });
}

async function renderCards(data, start, end, containerId, imageFolder, enableDetails) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (data.length === 0) {
    container.innerHTML = `<p class="text-center py-4" style="color:#aaa;">No items match your filters.</p>`;
    return;
  }

  for (let i = start; i < end && i < data.length; i++) {
    const item = data[i];
    const photos = item.PhotoFolder ? await getLocalImagePaths(item.PhotoFolder, imageFolder) : [];

    let imgHtml = photos.length > 0 
      ? `<img src="${photos[0]}" class="card-img-top" alt="${item.Name}" onclick="openFS(${JSON.stringify(photos)},0)">`
      : `<div style="height:180px;background:#1e2a44;display:flex;align-items:center;justify-content:center;color:#555;"><i class="fas fa-image fa-3x"></i></div>`;

    const inStock = parseInt(item.Quantity || 0) > 0;

    const actionHtml = inStock 
      ? `<button class="btn-buy w-100" onclick="buyItem('${item.Name}','${item.Price}',${i})">Buy on WhatsApp</button>`
      : `<button class="btn-inquiry w-100" onclick="placeInquiry('${item.Name}','${item.Price}')">Notify Me</button>`;

    container.insertAdjacentHTML('beforeend', `
      <div class="col-6 col-md-4">
        <div class="card h-100">
          ${imgHtml}
          <div class="card-body">
            <h5 class="card-title" onclick="${enableDetails ? `viewDetails('${encodeURIComponent(item.Name)}')` : ''}" style="${enableDetails ? 'cursor:pointer' : 'cursor:default;color:#fff;'}">
              ${item.Name}
            </h5>
            <p class="card-text"><strong>₹${item.Price}</strong></p>
            <p class="card-text"><span class="${inStock ? 'stock-in' : 'stock-out'}">${inStock ? 'In Stock' : 'Out of Stock'}</span></p>
            ${actionHtml}
          </div>
        </div>
      </div>
    `);
  }
}

function renderPagination(total) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  pagination.innerHTML = '';
  const totalPages = Math.ceil(total / itemsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="renderPage(${i});return false;">${i}</a></li>`;
  }
}

async function getLocalImagePaths(folder, baseFolder) {
  const paths = [];
  for (let i = 1; i <= 5; i++) {
    const path = `assets/img/${baseFolder}/${folder}/photo${i}.jpeg`;
    try {
      const res = await fetch(path);
      if (res.ok) paths.push(path);
    } catch(e) {}
  }
  return paths;
}

function buyItem(name, price, idx) {
  const qty = document.getElementById(`qty-${idx}`) ? document.getElementById(`qty-${idx}`).value : 1;
  const msg = `I want to buy:\n${name}\nPrice: ₹${price}\nQty: ${qty}`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

function placeInquiry(name, price) {
  const msg = `I'm interested in ${name} (₹${price}). Please let me know when available.`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

function viewDetails(encodedName) {
  window.location.href = `gpu-details.html?name=${encodedName}`;
}

function openFS(photos, idx) {
  const modal = document.getElementById('fullScreenModal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('fullScreenImage').src = photos[idx];
  }
}

// Auto-initialize based on container ID
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('graphics-cards-container')) initProductPage('GPUs', 'graphics-cards-container', 'gpu', true);
  if (document.getElementById('psu-container')) initProductPage('PSUs', 'psu-container', 'psu', false);
  if (document.getElementById('cpus-container')) initProductPage('CPUs', 'cpus-container', 'cpu', true);
  if (document.getElementById('ram-container')) initProductPage('RAMs', 'ram-container', 'ram', false);
});