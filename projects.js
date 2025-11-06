// Save scroll position before navigating
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
        sessionStorage.setItem('projectsScrollPosition', window.scrollY);
    });
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
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        if (filter === 'timeline') {
            // Sort by data-order attribute (chronological)
            const grid = document.querySelector('.projects-grid');
            const cardsArray = Array.from(projectCards);
            cardsArray.sort((a, b) => {
                return parseInt(a.dataset.order) - parseInt(b.dataset.order);
            });
            cardsArray.forEach(card => grid.appendChild(card));
        } else {
            // Relevancy/Standout - restore original order (you can customize this)
            const grid = document.querySelector('.projects-grid');
            const cardsArray = Array.from(projectCards);
            cardsArray.sort((a, b) => {
                return parseInt(a.dataset.order) - parseInt(b.dataset.order);
            });
            cardsArray.forEach(card => grid.appendChild(card));
        }
    });
});
