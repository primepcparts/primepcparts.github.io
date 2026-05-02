// ================================================
// assets/js/main.js - Based on your original working code
// ================================================

const sheetUrl = 'https://opensheet.elk.sh/1iUhbStYP6d63-AFyalNRyLUAhsEhDf7JF0pzKoqYK6M/GPUs';
let allData = [];
const itemsPerPage = 6;
let currentPage = 1;

async function initGPUPage() {
  try {
    const response = await fetch(sheetUrl);
    const data = await response.json();

    allData = data.filter(item => {
      const isValid = item.Name && typeof item.Name === 'string' &&
                     item.Price && !isNaN(parseFloat(item.Price)) &&
                     item.Quantity !== undefined && !isNaN(parseInt(item.Quantity)) &&
                     item.PhotoFolder && typeof item.PhotoFolder === 'string';
      if (!isValid) console.warn('Invalid row:', item);
      return isValid;
    });

    if (allData.length === 0) {
      document.getElementById('graphics-cards-container').innerHTML = '<p class="text-center py-4" style="color:#aaa;">No graphics cards available.</p>';
      return;
    }

    allData.sort((a, b) => {
      const stockA = a.Quantity > 0 ? 1 : 0;
      const stockB = b.Quantity > 0 ? 1 : 0;
      if (stockA !== stockB) return stockB - stockA;
      return parseFloat(a.Price) - parseFloat(b.Price);
    });

    renderPage(1);
  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('graphics-cards-container').innerHTML = '<p class="text-center py-4" style="color:#f87171;">Error loading data. Please try again later.</p>';
  }
}

function renderCards(data, startIndex, endIndex) {
  const container = document.getElementById('graphics-cards-container');
  container.innerHTML = '';

  const slicedData = data.slice(startIndex, endIndex);

  slicedData.forEach(async (item, index) => {
    const globalIndex = startIndex + index;
    const photos = await getLocalImagePaths(item.PhotoFolder);

    let carouselHtml = '';
    if (photos.length > 1) {
      const carouselId = `carousel-${globalIndex}`;
      carouselHtml = `
        <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
          <div class="carousel-inner">
            ${photos.map((photo, pi) => `
              <div class="carousel-item ${pi === 0 ? 'active' : ''}">
                <img src="${photo}" class="d-block w-100 card-img-top" alt="${item.Name}" onclick="openFullScreenCarousel(${JSON.stringify(photos)}, ${pi})">
              </div>`).join('')}
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev"><span class="carousel-control-prev-icon"></span></button>
          <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next"><span class="carousel-control-next-icon"></span></button>
        </div>`;
    } else if (photos.length === 1) {
      carouselHtml = `<img src="${photos[0]}" class="card-img-top" alt="${item.Name}" onclick="openFullScreenCarousel(${JSON.stringify(photos)}, 0)">`;
    }

    const stockStatus = item.Quantity > 0 ? `<span class="stock-in">In Stock</span>` : `<span class="stock-out">Out of Stock</span>`;
    const actionHtml = item.Quantity > 0 ? `
      <div class="form-group">
        <label>Qty:</label>
        <select class="form-control" id="quantity-${globalIndex}">${generateQuantityOptions(item.Quantity)}</select>
      </div>
      <button class="btn-buy" onclick="buyItem('${item.Name}', '${item.Price}', ${globalIndex})">Buy It</button>` : `
      <button class="btn-inquiry" onclick="placeInquiry('${item.Name}', '${item.Price}')">Notify Me</button>`;

    container.insertAdjacentHTML('beforeend', `
      <div class="col-6 col-md-4">
        <div class="card">
          ${carouselHtml}
          <div class="card-body">
            <h5 class="card-title" onclick="viewGpuDetails('${encodeURIComponent(item.Name)}')">${item.Name}</h5>
            <p class="card-text"><strong>₹${item.Price}</strong></p>
            <p class="card-text">${stockStatus}</p>
            ${actionHtml}
          </div>
        </div>
      </div>
    `);
  });
}

function renderPage(page) {
  currentPage = page;
  const filteredData = applyFiltersLogic();
  const start = (page - 1) * itemsPerPage;
  renderCards(filteredData, start, start + itemsPerPage);
  renderPagination(filteredData.length);
}

function applyFiltersLogic() {
  const nameFilter = document.getElementById('filter-name').value.toLowerCase();
  const minPrice = parseFloat(document.getElementById('filter-price-min').value) || 0;
  const maxPrice = parseFloat(document.getElementById('filter-price-max').value) || Infinity;
  const stockFilter = document.getElementById('filter-stock').value;

  return allData.filter(item => {
    const matchesName = (item.Name || '').toLowerCase().includes(nameFilter);
    const price = parseFloat(item.Price) || 0;
    const matchesPrice = price >= minPrice && price <= maxPrice;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'in-stock' && item.Quantity > 0) ||
                        (stockFilter === 'out-of-stock' && item.Quantity === 0);
    return matchesName && matchesPrice && matchesStock;
  });
}

function applyFilters() {
  renderPage(1);
}

async function getLocalImagePaths(folderName) {
  const imagePaths = [];
  for (let i = 1; i <= 5; i++) {
    const path = `assets/img/gpu/${folderName}/photo${i}.jpeg`;
    try {
      const res = await fetch(path);
      if (res.ok) imagePaths.push(path);
    } catch (e) {}
  }
  return imagePaths.length ? imagePaths : ['assets/img/placeholder.jpg'];
}

function generateQuantityOptions(max) {
  let options = '';
  for (let i = 1; i <= Math.min(max, 10); i++) {
    options += `<option value="${i}">${i}</option>`;
  }
  return options;
}

function openFullScreenCarousel(photos, index) {
  const modal = document.getElementById('fullScreenModal');
  const img = document.getElementById('fullScreenImage');
  if (modal && img) {
    modal.style.display = 'flex';
    img.src = photos[index];
  }
}

function buyItem(name, price, index) {
  const qty = document.getElementById(`quantity-${index}`).value;
  const msg = `*PrimePcParts Purchase*\nItem: ${name}\nPrice: ₹${price}\nQty: ${qty}`;
  window.open(`https://wa.me/918275433068?text=${encodeURIComponent(msg)}`, '_blank');
}

function placeInquiry(name, price) {
  const msg = `*PrimePcParts Inquiry*\nItem: ${name}\nPrice: ₹${price}\nOut of stock.`;
  window.open(`https://wa.me/918275433068?text=${encodeURIComponent(msg)}`, '_blank');
}

function viewGpuDetails(name) {
  window.location.href = `gpu-details.html?name=${name}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ GPU Page JS Loaded");
  initGPUPage();
});