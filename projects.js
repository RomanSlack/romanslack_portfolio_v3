let projectsData = [];

// Load projects from JSON
async function loadProjects() {
    try {
        const response = await fetch('projects.json');
        projectsData = await response.json();
        renderProjects(projectsData);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Render projects to the grid
function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '';

    projects.forEach(project => {
        const card = createProjectCard(project);
        grid.appendChild(card);
    });
}

// Create a project card element
function createProjectCard(project) {
    const card = document.createElement('a');
    card.href = project.link || '#';
    card.className = 'project-card';
    card.dataset.order = project.id;

    // All links open in new tab
    if (project.link && project.link !== '#') {
        card.target = '_blank';
    }

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'project-image-wrapper';

    // Create image
    const img = document.createElement('img');
    img.src = project.image || 'images/roman_rectangular_landing.jpg';
    img.alt = project.title;
    img.className = 'project-image';

    // Create project info overlay
    const projectInfo = document.createElement('div');
    projectInfo.className = 'project-info';

    // Create title
    const title = document.createElement('h3');
    title.className = 'project-title';
    title.textContent = project.title;

    // Create description
    const description = document.createElement('p');
    description.className = 'project-description';
    description.textContent = project.description;

    projectInfo.appendChild(title);
    projectInfo.appendChild(description);

    // Create date if exists
    if (project.date) {
        const date = document.createElement('p');
        date.className = 'project-date';
        date.textContent = project.date;
        projectInfo.appendChild(date);
    }

    // Add link icon in bottom right if there's a link
    if (project.link && project.link !== '#') {
        const linkIcon = document.createElement('div');
        linkIcon.className = 'project-link-icon';

        // Determine if it's GitHub or web link
        const isGitHub = project.link.includes('github.com');

        if (isGitHub) {
            linkIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
            `;
        } else {
            linkIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
            `;
        }

        projectInfo.appendChild(linkIcon);
    }

    imageWrapper.appendChild(img);
    imageWrapper.appendChild(projectInfo);
    card.appendChild(imageWrapper);

    return card;
}

// Save scroll position before navigating
document.addEventListener('click', (e) => {
    if (e.target.closest('.project-card')) {
        sessionStorage.setItem('projectsScrollPosition', window.scrollY);
    }
});

// Restore scroll position when returning
window.addEventListener('load', () => {
    const scrollPos = sessionStorage.getItem('projectsScrollPosition');
    if (scrollPos) {
        window.scrollTo(0, parseInt(scrollPos));
        sessionStorage.removeItem('projectsScrollPosition');
    }
});

// Filter functionality
const filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        let sortedProjects = [...projectsData];

        if (filter === 'timeline') {
            // Sort by date (most recent first)
            sortedProjects.sort((a, b) => {
                // Handle empty dates
                if (!a.date && !b.date) return a.id - b.id;
                if (!a.date) return 1;
                if (!b.date) return -1;

                // Parse dates in MM-YYYY format
                const dateA = parseProjectDate(a.date);
                const dateB = parseProjectDate(b.date);

                return dateB - dateA; // Most recent first
            });
        } else {
            // Relevancy/Standout - use original order from JSON (by id)
            sortedProjects.sort((a, b) => a.id - b.id);
        }

        renderProjects(sortedProjects);
    });
});

// Helper function to parse project dates
function parseProjectDate(dateStr) {
    if (!dateStr) return 0;
    const parts = dateStr.split('-');
    if (parts.length === 2) {
        const month = parseInt(parts[0]) || 0;
        const year = parseInt(parts[1]) || 0;
        return year * 12 + month;
    }
    return 0;
}

// Initialize
loadProjects();
