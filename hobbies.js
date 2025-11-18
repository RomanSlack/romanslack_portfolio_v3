let hobbiesData = [];

// Shuffle array function
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

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

        // Combine and bias text items toward the top
        const shuffledImages = shuffleArray(imageItems);
        const shuffledText = shuffleArray(textItems);

        // Place some text items at the beginning (biased toward top)
        const topTextCount = Math.min(Math.ceil(shuffledText.length * 0.6), shuffledText.length);
        const topText = shuffledText.slice(0, topTextCount);
        const bottomText = shuffledText.slice(topTextCount);

        // Interleave text among first ~40% of images
        const topImageCount = Math.ceil(shuffledImages.length * 0.4);
        const topImages = shuffledImages.slice(0, topImageCount);
        const bottomImages = shuffledImages.slice(topImageCount);

        // Mix top items together
        const topItems = shuffleArray([...topText, ...topImages]);

        // Combine with remaining items
        hobbiesData = [...topItems, ...shuffleArray([...bottomText, ...bottomImages])];

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
    element.className = `hobby-item hobby-${item.type}`;

    if (item.size) {
        element.classList.add(`hobby-size-${item.size}`);
    }

    if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt;
        img.className = 'hobby-image';
        img.loading = 'lazy';
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
