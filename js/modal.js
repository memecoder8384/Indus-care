/**
 * Modal Handling Module
 */

export function initModals() {
  // Global modal open handlers
  document.addEventListener('click', (e) => {
    // Open Donate Modal
    const donateBtn = e.target.closest('[data-open-modal="donate"]');
    if (donateBtn) {
      e.preventDefault();
      openModal('donateModal');
      return;
    }

    // Open Request Blood Modal
    const requestBtn = e.target.closest('[data-open-modal="requestBlood"]') || e.target.closest('[data-open-modal="request"]');
    if (requestBtn) {
      e.preventDefault();
      openModal('requestBloodModal');
      return;
    }

    // Open Volunteer Modal
    const volunteerBtn = e.target.closest('[data-open-modal="volunteer"]');
    if (volunteerBtn) {
      e.preventDefault();
      openModal('volunteerModal');
      return;
    }

    // Open Map Modal
    const mapBtn = e.target.closest('[data-open-map]');
    if (mapBtn) {
      e.preventDefault();
      const locationName = mapBtn.getAttribute('data-location-name') || 'Blood Centre';
      const mapUrl = mapBtn.getAttribute('data-map-url') || '';
      openMapModal(locationName, mapUrl);
      return;
    }

    // Close Modal trigger
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      const modal = closeBtn.closest('.modal-backdrop');
      if (modal) closeModal(modal.id);
      return;
    }

    // Backdrop click close
    if (e.target.classList.contains('modal-backdrop')) {
      closeModal(e.target.id);
    }
  });

  // ESC key close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-backdrop.active');
      if (activeModal) {
        closeModal(activeModal.id);
      }
    }
  });
}

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  // Temporarily disable smooth scrolling to instantly jump to top (y=0) before locking overflow
  const originalScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  document.body.style.scrollBehavior = 'auto';

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.documentElement.style.scrollBehavior = originalScrollBehavior;
  document.body.style.scrollBehavior = '';

  // Reset internal scroll container
  modal.scrollTop = 0;
  const content = modal.querySelector('.modal-content');
  if (content) content.scrollTop = 0;

  modal.classList.remove('hidden');
  modal.classList.add('active');
  modal.style.setProperty('display', 'flex', 'important');
  modal.style.setProperty('visibility', 'visible', 'important');
  modal.style.setProperty('opacity', '1', 'important');
  modal.style.setProperty('pointer-events', 'auto', 'important');
  modal.style.setProperty('position', 'fixed', 'important');
  modal.style.setProperty('top', '0', 'important');
  modal.style.setProperty('left', '0', 'important');
  modal.style.setProperty('width', '100%', 'important');
  modal.style.setProperty('height', '100%', 'important');
  modal.style.setProperty('z-index', '99999', 'important');

  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    modal.scrollTop = 0;
    if (content) content.scrollTop = 0;
  });
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  modal.classList.add('hidden');
  modal.style.setProperty('display', 'none', 'important');
  modal.style.setProperty('visibility', 'hidden', 'important');
  modal.style.setProperty('opacity', '0', 'important');
  modal.style.setProperty('pointer-events', 'none', 'important');
  document.body.style.overflow = '';
}

export function openMapModal(title, embedUrl) {
  const modal = document.getElementById('mapModal');
  if (!modal) return;
  
  const titleEl = modal.querySelector('#mapModalTitle');
  const iframeEl = modal.querySelector('#mapModalIframe');
  
  if (titleEl) titleEl.textContent = title;
  if (iframeEl && embedUrl) {
    iframeEl.src = embedUrl;
  }
  
  openModal('mapModal');
}
