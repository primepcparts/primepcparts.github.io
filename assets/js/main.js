// assets/js/main.js
const CONFIG = {
  whatsappNumber: "918275433068"
};

let allData = [];
let currentPage = 1;
const itemsPerPage = 6;

function initProductPage(sheetName, containerId, imageFolder, detailsPage = null) {
  const sheetUrl = `https://opensheet.elk.sh/1iUhbStYP6d63-AFyalNRyLUAhsEhDf7JF0pzKoqYK6M/${sheetName}`;

  fetch(sheetUrl)
    .then(r => r.json())
    .then(data => {
      allData = data.filter(item =>
        item.Name && item.Price && !isNaN(parseFloat(item.Price)) &&
        item.Quantity !== undefined && item.PhotoFolder
      );

      if (!allData.length) {
        document.getElementById(containerId).innerHTML =
          `<p class="text-center py-4" style="color:#aaa;">No products available right now.</p>`;
        return;
      }

      allData.sort((a, b) => {
        const sa = a.Quantity > 0 ? 1 : 0;
        const sb = b.Quantity > 0 ? 1 : 0;
        return sb - sa || parseFloat(a.Price) - parseFloat(b.Price);
      });

      renderPage(1, containerId, imageFolder, detailsPage);
    })
    .catch(() => {
      document.getElementById(containerId).innerHTML =
        `<p class="text-center py-4" style="color:#f87171;">Error loading data.</p>`;
    });
}

async function renderCards(data, start, end, containerId, imageFolder, detailsPage) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (!data.length) {
    container.innerHTML = `<p class="text-center py-4" style="color:#aaa;">No items match your filters.</p>`;
    return;
  }

  for (let i = start; i < end; i++) {
    const item = data[i];
    const photos = await getLocalImagePaths(item.PhotoFolder, imageFolder);

    let imgHtml = '';
    if (photos.length > 1) {
      const cid = `c-${i}`;
      imgHtml = `<div id="${cid}" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-inner">${photos.map((p, pi) => `
          <div class="carousel-item ${pi === 0 ? 'active' : ''}">
            <img src="${p}" class="d-block w-100 card-img-top" alt="${item.Name}" onclick="openFS(${JSON.stringify(photos)},${pi})">
          </div>`).join('')}
        </div>
        <button class="carousel-control-prev" type="button" data-bs-target="#${cid}" data-bs-slide="prev"><span class="carousel-control-prev-icon"></span></button>
        <button class="carousel-control-next" type="button" data-bs-target="#${cid}" data-bs-slide="next"><span class="carousel-control-next-icon"></span></button>
      </div>`;
    } else if (photos.length === 1) {
      imgHtml = `<img src="${photos[0]}" class="card-img-top" alt="${item.Name}" onclick="openFS(${JSON.stringify(photos)},0)">`;
    }

    const inStock = parseInt(item.Quantity) > 0;
    const actionHtml = inStock
      ? `<div class="form-group"><label>Qty:</label><select class="form-control" id="qty-${i}">${genQtyOpts(item.Quantity)}</select></div>
         <button class="btn-buy" onclick="buyItem('${item.Name}','${item.Price}',${i})"><i class="fab fa-whatsapp me-1"></i>Buy It</button>`
      : `<button class="btn-inquiry" onclick="placeInquiry('${item.Name}','${item.Price}')"><i class="fas fa-bell me-1"></i>Notify Me</button>`;

    container.insertAdjacentHTML('beforeend', `
  <div class="col-6 col-md-4">
    <div class="card">
      ${imgHtml}
      <div class="card-body">
        <h5 class="card-title" 
            onclick="${detailsPage ? `viewDetails('${encodeURIComponent(item.Name)}')` : ''}"
            style="${detailsPage ? 'cursor:pointer;' : 'cursor:default;color:#fff;'}">
          ${item.Name}
        </h5>
        <p class="card-text"><i class="fas fa-tag me-1" style="color:var(--accent);font-size:0.75rem;"></i><strong>₹${item.Price}</strong></p>
        <p class="card-text">
          <i class="fas fa-circle me-1" style="font-size:0.55rem;color:${inStock ? '#4ade80' : '#f87171'};"></i>
          <span class="${inStock ? 'stock-in' : 'stock-out'}">${inStock ? 'In Stock' : 'Out of Stock'}</span>
        </p>
        ${actionHtml}
      </div>
    </div>
  </div>
`);
  }
}

function renderPage(page, containerId, imageFolder, detailsPage) {
  currentPage = page;
  const filtered = applyFiltersLogic();
  const start = (page - 1) * itemsPerPage;
  renderCards(filtered, start, start + itemsPerPage, containerId, imageFolder, detailsPage);
  renderPagination(filtered.length);
}

function applyFiltersLogic() {
  const nm = document.getElementById('filter-name').value.toLowerCase();
  const mn = parseFloat(document.getElementById('filter-price-min').value) || 0;
  const mx = parseFloat(document.getElementById('filter-price-max').value) || Infinity;
  const st = document.getElementById('filter-stock').value;

  return allData.filter(item => {
    const n = (item.Name || '').toLowerCase();
    const p = parseFloat(item.Price) || 0;
    const q = parseInt(item.Quantity) || 0;
    return n.includes(nm) && p >= mn && p <= mx &&
      (st === 'all' || (st === 'in-stock' && q > 0) || (st === 'out-of-stock' && q === 0));
  }).sort((a, b) => {
    const sa = a.Quantity > 0 ? 1 : 0;
    const sb = b.Quantity > 0 ? 1 : 0;
    return sb - sa || parseFloat(a.Price) - parseFloat(b.Price);
  });
}

function applyFilters() {
  renderPage(1);
}

function renderPagination(total) {
  const pages = Math.ceil(total / itemsPerPage);
  const pg = document.getElementById('pagination');
  pg.innerHTML = '';
  for (let i = 1; i <= pages; i++) {
    pg.insertAdjacentHTML('beforeend', `<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#" onclick="renderPage(${i});return false;">${i}</a></li>`);
  }
}

async function getLocalImagePaths(folder, baseFolder) {
  const paths = [];
  for (let i = 1; i <= 5; i++) {
    const p = `assets/img/${baseFolder}/${folder}/photo${i}.jpeg`;
    try {
      const r = await fetch(p);
      if (r.ok) paths.push(p);
    } catch (e) { }
  }
  return paths.length ? paths : ['assets/img/placeholder.jpg'];
}

function genQtyOpts(max) {
  let o = '';
  for (let i = 1; i <= Math.min(max, 10); i++) o += `<option value="${i}">${i}</option>`;
  return o;
}

function openFS(photos, idx) {
  const modal = document.getElementById('fullScreenModal');
  const img = document.getElementById('fullScreenImage');
  let ci = idx;
  img.src = photos[ci]; img.style.transform = 'scale(1)';
  modal.style.display = 'flex';

  modal.onclick = e => { if (e.target === modal) closeFullScreen(); };
  document.onkeydown = e => {
    if (e.key === 'ArrowRight') { ci = (ci + 1) % photos.length; img.src = photos[ci]; }
    else if (e.key === 'ArrowLeft') { ci = (ci - 1 + photos.length) % photos.length; img.src = photos[ci]; }
    else if (e.key === 'Escape') closeFullScreen();
  };
}

function closeFullScreen() {
  document.getElementById('fullScreenModal').style.display = 'none';
  document.onkeydown = null;
}

function zoomImage(e) {
  const img = document.getElementById('fullScreenImage');
  e.preventDefault();
  let s = parseFloat((img.style.transform || 'scale(1)').replace(/[^\d.]/g, '')) || 1;
  s = Math.min(Math.max(e.deltaY < 0 ? s * 1.1 : s / 1.1, 1), 5);
  img.style.transform = `scale(${s})`;
}

function buyItem(name, price, idx) {
  const qty = document.getElementById(`qty-${idx}`).value;
  const msg = `*PrimePcParts - Purchase Inquiry*\n\nItem: ${name}\nPrice: ₹${price}\nQuantity: ${qty}\nTotal: ₹${price * qty}\n\nPlease confirm my order.`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

function placeInquiry(name, price) {
  const msg = `*PrimePcParts - Stock Inquiry*\n\nItem: ${name}\nPrice: ₹${price}\n\nThis item is out of stock. Please notify me when available.`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

function viewDetails(encoded) {
  window.location.href = `gpu-details.html?name=${encoded}`;
}

// Back to Top
document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('backToTop');
  if (backBtn) {
    window.addEventListener('scroll', () => {
      backBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
    });
    backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
});

// Add this at the end of assets/js/main.js
function viewDetails(encodedName) {
  if (encodedName) {
    window.location.href = `gpu-details.html?name=${encodedName}`;
  }
}