// Function to construct local image paths
function getLocalImagePaths(folderName) {
  // Assuming the folder structure is: /img/{folderName}/photo1.jpg, /img/{folderName}/photo2.jpg, etc.
  const basePath = `/img/gpu/${folderName}/`;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp']; // Add more extensions if needed
  const imagePaths = [];

  // Generate image paths dynamically
  for (let i = 1; i <= 10; i++) { // Adjust the limit based on the maximum number of photos per folder
    for (const ext of imageExtensions) {
      const imagePath = `${basePath}photo${i}${ext}`;
      imagePaths.push(imagePath);
    }
  }

  return imagePaths;
}

// Function to sanitize the carousel ID
function sanitizeId(id) {
  // Replace invalid characters (e.g., +) with a hyphen
  return id.replace(/[^a-zA-Z0-9-_]/g, '-');
}

// Function to generate quantity options for the dropdown
function generateQuantityOptions(maxQuantity) {
  let options = '';
  for (let i = 1; i <= maxQuantity; i++) {
    options += `<option value="${i}">${i}</option>`;
  }
  return options;
}

// Function to handle "Buy It" button click
function buyItem(itemName, itemPrice, maxQuantity, index) {
  // Get the selected quantity from the dropdown
  const quantityDropdown = document.getElementById(`quantity-${index}`);
  const selectedQuantity = quantityDropdown.value;

  // Redirect to the order details page with item details as URL parameters
  window.location.href = `order-details.html?name=${encodeURIComponent(itemName)}&price=${encodeURIComponent(itemPrice)}&quantity=${encodeURIComponent(selectedQuantity)}`;
}

// Function to open full-screen carousel
function openFullScreenCarousel(photos, startIndex) {
  const carouselInner = document.getElementById('fullScreenCarouselInner');
  carouselInner.innerHTML = photos.map((photo, index) => `
    <div class="carousel-item ${index === startIndex ? 'active' : ''}">
      <img src="${photo}" class="d-block w-100" alt="Gallery Image ${index + 1}">
    </div>
  `).join('');

  const fullScreenCarouselModal = new bootstrap.Modal(document.getElementById('fullScreenCarouselModal'));
  fullScreenCarouselModal.show();
}

// Fetch data from Google Sheet using OpenSheet.elk.sh
const sheetUrl = 'https://opensheet.elk.sh/1iUhbStYP6d63-AFyalNRyLUAhsEhDf7JF0pzKoqYK6M/Sheet1';

fetch(sheetUrl)
  .then(response => response.json())
  .then(data => {
    console.log("Fetched data:", data); // Debugging: Log fetched data
    const container = document.getElementById('graphics-cards-container');
    data.forEach((item, index) => {
      // Get the folder name from the Google Sheet
      const folderName = item.PhotoFolder;

      // Construct local image paths based on the folder name
      const photos = getLocalImagePaths(folderName);

      let carouselHtml = '';
      if (photos.length > 1) {
        const carouselId = sanitizeId(`carousel-${item.Name.replace(/\s+/g, '-')}-${index}`); // Sanitize the ID
        carouselHtml = `
          <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
              ${photos.map((photo, photoIndex) => `
                <div class="carousel-item ${photoIndex === 0 ? 'active' : ''}">
                  <img src="${photo}" class="d-block w-100 card-img-top" alt="${item.Name} Photo ${photoIndex + 1}" onclick="openFullScreenCarousel(${JSON.stringify(photos)}, ${photoIndex})">
                </div>
              `).join('')}
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>
          </div>
        `;
      } else if (photos.length === 1) {
        carouselHtml = `<img src="${photos[0]}" class="card-img-top" alt="${item.Name}" onclick="openFullScreenCarousel(${JSON.stringify(photos)}, 0)">`;
      }

      const cardHtml = `
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">${item.Name}</h5> <!-- Card name moved to the top -->
              ${carouselHtml} <!-- Images come after the name -->
              <p class="card-text"><strong>Price:</strong> ₹${item.Price}</p> <!-- Updated to display price in Rupees -->
              <div class="form-group">
                <label for="quantity-${index}"><strong>Select Quantity:</strong></label>
                <select class="form-control" id="quantity-${index}">
                  ${generateQuantityOptions(item.Quantity)}
                </select>
              </div>
              <button class="btn btn-buy" onclick="buyItem('${item.Name}', '${item.Price}', ${item.Quantity}, ${index})">Buy It</button>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', cardHtml);
    });
  })
  .catch(error => console.error('Error fetching data:', error));