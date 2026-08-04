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
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
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
