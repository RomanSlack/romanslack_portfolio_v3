let hobbiesData = [];

// Load hobbies from JSON and images from folder
async function loadHobbies() {
    try {
        // Load text items from JSON
        const textResponse = await fetch('hobbies.json');
        const textItems = await textResponse.json();

        // Load image list from generated JSON
        const imagesResponse = await fetch('hobbies_images.json');
        const imagePaths = await imagesResponse.json();

        // Convert image paths to items
        const imageItems = imagePaths.map((path, index) => ({
            type: 'image',
            src: path,
            alt: `Hobby image ${index + 1}`
        }));

        // Combine text and images
        hobbiesData = [...textItems, ...imageItems];

        renderMasonryGrid(hobbiesData);
    } catch (error) {
        console.error('Error loading hobbies:', error);
    }
}

// Render masonry grid
function renderMasonryGrid(items) {
    const grid = document.getElementById('hobbiesGrid');
    grid.innerHTML = '';

    items.forEach(item => {
        const element = createGridItem(item);
        grid.appendChild(element);
    });
}

// Create a grid item element
function createGridItem(item) {
    const element = document.createElement('div');
    element.className = `hobby-item hobby-${item.type} hobby-size-${item.size}`;
    element.dataset.id = item.id;

    if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt;
        img.className = 'hobby-image';
        img.loading = 'lazy';

        // Load image to determine natural dimensions
        img.onload = function() {
            const aspectRatio = this.naturalWidth / this.naturalHeight;
            const isWide = aspectRatio > 1.3;
            const isTall = aspectRatio < 0.7;
            const isLarge = this.naturalWidth > 800 || this.naturalHeight > 800;

            // Determine grid span based on image dimensions
            element.classList.remove('hobby-size-small', 'hobby-size-medium', 'hobby-size-large');

            if (isLarge && (isWide || isTall)) {
                element.classList.add('hobby-size-large');
            } else if (isWide || isTall) {
                element.classList.add('hobby-size-medium');
            } else {
                element.classList.add('hobby-size-small');
            }
        };

        element.appendChild(img);
    } else if (item.type === 'text') {
        const textContainer = document.createElement('div');
        textContainer.className = 'hobby-text-container';

        const text = document.createElement('h2');
        text.className = 'hobby-text';
        text.textContent = item.content;

        textContainer.appendChild(text);
        element.appendChild(textContainer);
    }

    return element;
}

// Initialize
loadHobbies();
