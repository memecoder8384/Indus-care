/**
 * Form validation and dual Supabase + Google Sheets submission handler
 */
import { supabase, isSupabaseConfigured } from './supabase.js';

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxyJPFhd66Tb7YMmgwNB0j8lHfIiqoJ61fHyhqfVIoCfbrQXNN_kGnHvUiCfaCV387N/exec';

export function initFormValidation() {
  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!form.hasAttribute('data-validate')) return;
    
    e.preventDefault();
    let isValid = true;

    // Reset previous errors
    form.querySelectorAll('.error-msg').forEach(el => el.remove());
    form.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));

    // Validate required inputs
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
      const value = input.value.trim();
      
      if (!value) {
        isValid = false;
        showFieldError(input, 'This field is required');
      } else if (input.type === 'email' && !validateEmail(value)) {
        isValid = false;
        showFieldError(input, 'Please enter a valid email address');
      } else if (input.type === 'tel' && !validatePhone(value)) {
        isValid = false;
        showFieldError(input, 'Please enter a valid 10-digit phone number');
      }
    });

    if (isValid) {
      if (!isSupabaseConfigured()) {
        showToast('Please set your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the .env file.', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="inline-block animate-spin mr-2">↻</span> Submitting...`;
      }

      try {
        const nameInput = form.querySelector('[name="name"]');
        const phoneInput = form.querySelector('[name="phone"]');
        const emailInput = form.querySelector('[name="email"]');
        const bloodGroupInput = form.querySelector('[name="blood_group"]');
        const prefDateInput = form.querySelector('[name="preferred_date"]');
        const prefTimeInput = form.querySelector('[name="preferred_time"]');
        const queryTypeInput = form.querySelector('[name="query_type"]') || form.querySelector('[name="subject"]');
        const messageInput = form.querySelector('[name="message"]');

        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const bloodGroup = bloodGroupInput ? bloodGroupInput.value.trim() : '';
        const prefDate = prefDateInput ? prefDateInput.value.trim() : '';
        const prefTime = prefTimeInput ? prefTimeInput.value.trim() : '';
        
        let queryType = queryTypeInput ? queryTypeInput.value.trim() : '';
        if (!queryType && bloodGroup) {
          queryType = `Blood Donation (${bloodGroup})`;
        } else if (!queryType) {
          queryType = 'Blood Donation Request';
        }

        let userNotes = messageInput ? messageInput.value.trim() : '';
        const details = [];
        if (bloodGroup) details.push(`Blood Group: ${bloodGroup}`);
        if (prefDate) details.push(`Preferred Date: ${prefDate}`);
        if (prefTime) details.push(`Preferred Time: ${prefTime}`);
        
        const message = details.length > 0
          ? (userNotes ? `${userNotes} \n[Appointment Details: ${details.join(' | ')}]` : `[Appointment Details: ${details.join(' | ')}]`)
          : userNotes;

        // 1. Insert into Supabase contact_queries table first
        const supabasePayload = {
          status: 'pending'
        };
        if (email) supabasePayload.email = email;
        if (name) supabasePayload.name = name;
        if (phone) supabasePayload.phone = phone;
        if (queryType) supabasePayload.query_type = queryType;
        if (message) supabasePayload.message = message;

        const { error: supabaseError } = await supabase
          .from('contact_queries')
          .insert([supabasePayload]);

        if (supabaseError) {
          console.error('Supabase submission error:', supabaseError);
          showToast(supabaseError.message || 'Supabase submission failed. Please try again.', 'error');
          return;
        }

        // 2. Send data to Google Sheets Web App
        // Passing both URL Query Parameters (for e.parameter) AND JSON body (for e.postData.contents)
        const paramData = {
          Name: name,
          name: name,
          Phone: phone,
          phone: phone,
          Email: email,
          email: email,
          'Query Type': queryType,
          QueryType: queryType,
          queryType: queryType,
          query_type: queryType,
          Subject: queryType,
          subject: queryType,
          Message: message,
          message: message,
          Query: message,
          query: message,
          Status: 'pending',
          status: 'pending'
        };

        const queryParams = new URLSearchParams(paramData).toString();
        const fullSheetsUrl = `${GOOGLE_SHEETS_URL}?${queryParams}`;

        try {
          await fetch(fullSheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(paramData)
          });
        } catch (sheetsErr) {
          console.error('Google Sheets submission error:', sheetsErr);
          showToast('Saved to Supabase, but Google Sheets update encountered an issue.', 'error');
          return;
        }

        // Both operations completed
        form.reset();

        // Close modal if form is inside a modal backdrop
        const modal = form.closest('.modal-backdrop');
        if (modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }

        showToast(form.getAttribute('data-success-message') || 'Submission successful!', 'success');
      } catch (err) {
        console.error('Form submission exception:', err);
        showToast(err.message || 'An unexpected error occurred. Please try again.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    }
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[0-9+\-\s]{8,15}$/.test(phone);
}

function showFieldError(input, message) {
  input.classList.add('border-red-500');
  const errorEl = document.createElement('p');
  errorEl.className = 'error-msg text-xs text-red-600 mt-1 font-medium';
  errorEl.textContent = message;
  input.parentNode.appendChild(errorEl);
}

export function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const isError = type === 'error';
  const icon = isError ? 'error' : 'check_circle';
  const iconColor = isError ? 'text-red-400' : 'text-green-400';

  const toast = document.createElement('div');
  toast.className = 'toast bg-on-background text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-white/20 pointer-events-auto min-w-[300px]';
  toast.innerHTML = `
    <span class="material-symbols-outlined ${iconColor} text-2xl" style="font-variation-settings: 'FILL' 1;">${icon}</span>
    <span class="font-medium text-sm flex-1">${message}</span>
    <button class="text-white/60 hover:text-white" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined text-sm">close</span>
    </button>
  `;

  toastContainer.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}
