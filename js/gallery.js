/**
 * Gallery filter & Lightbox functionality
 */

export function initGallery() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-filter');
        
        filterBtns.forEach(b => {
          b.classList.remove('bg-brand-red', 'text-white', 'shadow-md');
          b.classList.add('bg-white', 'text-on-surface-variant', 'hover:bg-surface-container');
        });
        
        btn.classList.remove('bg-white', 'text-on-surface-variant', 'hover:bg-surface-container');
        btn.classList.add('bg-brand-red', 'text-white', 'shadow-md');

        galleryItems.forEach(item => {
          const itemCat = item.getAttribute('data-category') || '';
          const categories = itemCat.split(' ');
          if (category === 'all' || categories.includes(category)) {
            item.style.display = 'block';
            setTimeout(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            }, 50);
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
              item.style.display = 'none';
            }, 300);
          }
        });
      });
    });
  }

  // Lightbox click handlers
  document.addEventListener('click', (e) => {
    const lightboxTrigger = e.target.closest('[data-lightbox-src]');
    if (lightboxTrigger) {
      e.preventDefault();
      const imgSrc = lightboxTrigger.getAttribute('data-lightbox-src');
      const caption = lightboxTrigger.getAttribute('data-lightbox-caption') || '';
      openLightbox(imgSrc, caption);
    }
  });
}

export function openLightbox(src, caption) {
  let lightbox = document.getElementById('lightboxModal');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'lightboxModal';
    lightbox.className = 'modal-backdrop fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4';
    lightbox.innerHTML = `
      <div class="relative max-w-4xl w-full flex flex-col items-center">
        <button class="absolute -top-12 right-0 text-white hover:text-red-400 p-2 rounded-full transition-colors" onclick="this.closest('.modal-backdrop').classList.remove('active'); document.body.style.overflow=''">
          <span class="material-symbols-outlined text-3xl">close</span>
        </button>
        <img id="lightboxImg" src="" alt="Lightbox Image" class="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl border border-white/10" />
        <p id="lightboxCaption" class="text-white text-center font-medium mt-4 text-lg bg-black/50 px-6 py-2 rounded-full"></p>
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  const imgEl = lightbox.querySelector('#lightboxImg');
  const captionEl = lightbox.querySelector('#lightboxCaption');

  if (imgEl) imgEl.src = src;
  if (captionEl) captionEl.textContent = caption;

  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}
