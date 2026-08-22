/**
 * Form validation and dual Supabase + Google Sheets submission handler
 */
import { getSupabase, isSupabaseConfigured } from './supabase.js';

const DONATE_SHEETS_URL = (import.meta.env && import.meta.env.VITE_GOOGLE_SHEETS_DONATE_URL) || 'https://script.google.com/macros/s/AKfycbz7KbPa5Sp-ihVILCN4xIzHAGOHo_iTkicv9N0zzInzZkYTpdJ06vkPleo21-iiZoPBJw/exec';
const REQUEST_SHEETS_URL = (import.meta.env && import.meta.env.VITE_GOOGLE_SHEETS_REQUEST_URL) || 'https://script.google.com/macros/s/AKfycbwJGSln7LPTByLaDP0WXUsnmoaqOW_mfRN-YNfOM03yW-78PnS8fnaKOtnrP8TNOqit/exec';
const DEFAULT_GOOGLE_SHEETS_URL = (import.meta.env && import.meta.env.VITE_GOOGLE_SHEETS_URL) || REQUEST_SHEETS_URL;

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
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="inline-block animate-spin mr-2">↻</span> Submitting...`;
      }

      try {
        const nameInput = form.querySelector('[name="name"]') || form.querySelector('[name="patient_name"]') || form.querySelector('[name="donor_name"]');
        const phoneInput = form.querySelector('[name="phone"]') || form.querySelector('[name="contact"]') || form.querySelector('[name="mobile"]');
        const emailInput = form.querySelector('[name="email"]');
        const bloodGroupInput = form.querySelector('[name="blood_group"]') || form.querySelector('[name="bloodGroup"]');
        const unitsInput = form.querySelector('[name="units"]') || form.querySelector('[name="units_required"]');
        const hospitalInput = form.querySelector('[name="hospital"]') || form.querySelector('[name="hospital_name"]');
        const urgencyInput = form.querySelector('[name="urgency"]') || form.querySelector('[name="urgency_level"]');
        const ageInput = form.querySelector('[name="age"]');
        const genderInput = form.querySelector('[name="gender"]');
        const prefCentreInput = form.querySelector('[name="preferred_centre"]') || form.querySelector('[name="centre"]') || form.querySelector('[name="center"]') || form.querySelector('[name="location"]');
        const prefDateInput = form.querySelector('[name="preferred_date"]') || form.querySelector('[name="date"]') || form.querySelector('[name="booking_date"]');
        const prefTimeInput = form.querySelector('[name="preferred_time"]') || form.querySelector('[name="time"]') || form.querySelector('[name="booking_time"]');
        const queryTypeInput = form.querySelector('[name="query_type"]') || form.querySelector('[name="subject"]');
        const messageInput = form.querySelector('[name="message"]') || form.querySelector('[name="notes"]') || form.querySelector('[name="details"]') || form.querySelector('[name="additional_notes"]') || form.querySelector('[name="remarks"]');

        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const bloodGroup = bloodGroupInput ? bloodGroupInput.value.trim() : '';
        const units = unitsInput ? unitsInput.value.trim() : '';
        const hospital = hospitalInput ? hospitalInput.value.trim() : '';
        const urgency = urgencyInput ? urgencyInput.value.trim() : '';
        const age = ageInput ? ageInput.value.trim() : '';
        const gender = genderInput ? genderInput.value.trim() : '';
        const preferredCentre = prefCentreInput ? prefCentreInput.value.trim() : '';
        const prefDate = prefDateInput ? prefDateInput.value.trim() : '';
        const prefTime = prefTimeInput ? prefTimeInput.value.trim() : '';
        const userNotes = messageInput ? messageInput.value.trim() : '';

        const formattedDate = prefDate ? (prefTime ? `${prefDate} (${prefTime})` : prefDate) : '';
        
        let queryType = queryTypeInput ? queryTypeInput.value.trim() : '';
        if (!queryType) {
          const modalId = form.closest('.modal-backdrop')?.id;
          if (modalId === 'requestBloodModal' || form.querySelector('[name="patient_name"]') || units || hospital) {
            queryType = 'Blood Request';
          } else if (modalId === 'donateModal' || form.querySelector('[name="donor_name"]') || age || gender) {
            queryType = 'Blood Donation';
          } else if (bloodGroup) {
            queryType = `Blood Donation (${bloodGroup})`;
          } else {
            queryType = 'General Inquiry';
          }
        }

        // Build detailed notes summary for display/database
        const details = [];
        if (bloodGroup) details.push(`Blood Group: ${bloodGroup}`);
        if (units) details.push(`Units: ${units}`);
        if (hospital) details.push(`Hospital: ${hospital}`);
        if (urgency) details.push(`Urgency: ${urgency}`);
        if (age) details.push(`Age: ${age}`);
        if (gender) details.push(`Gender: ${gender}`);
        if (preferredCentre) details.push(`Centre: ${preferredCentre}`);
        if (prefDate) details.push(`Date: ${prefDate}`);
        if (prefTime) details.push(`Time: ${prefTime}`);
        
        const fullMessage = details.length > 0
          ? (userNotes ? `${userNotes} \n[Details: ${details.join(' | ')}]` : `[Details: ${details.join(' | ')}]`)
          : userNotes;

        // 1. Optional Supabase backup logging
        if (isSupabaseConfigured()) {
          try {
            const supabase = await getSupabase();
            const supabasePayload = { status: 'pending' };
            if (email) supabasePayload.email = email;
            if (name) supabasePayload.name = name;
            if (phone) supabasePayload.phone = phone;
            if (queryType) supabasePayload.query_type = queryType;
            if (fullMessage) supabasePayload.message = fullMessage;

            await supabase.from('contact_queries').insert([supabasePayload]);
          } catch (supabaseErr) {
            console.warn('Supabase submission warning:', supabaseErr);
          }
        }

        const timestampStr = new Date().toLocaleString('en-IN');

        // 2. Send data to Google Sheets Web App
        const paramData = {
          // Exact Blood Request Sheet Headers (from Google Sheet)
          'Time/Date': formattedDate || timestampStr,
          'Name': name,
          'Contact no.': phone,
          'Blood group need': bloodGroup,
          'Units': units,
          'Hospital name/City': hospital,
          'Urgency level': urgency,
          'Patient notes/ Requirement details': userNotes,

          // Standard & Generic Sheet Headers
          Timestamp: timestampStr,
          'Query Type': queryType,
          Phone: phone,
          Email: email,
          'Blood Group': bloodGroup,
          'Units Required': units,
          'Hospital / Location': hospital,
          Urgency: urgency,
          Age: age,
          Gender: gender,
          'Preferred Centre': preferredCentre,
          'Preferred Date': formattedDate,
          'Message / Details': userNotes || fullMessage,
          Status: 'Pending',

          // Alias Keys
          'time/date': formattedDate || timestampStr,
          'Time / Date': formattedDate || timestampStr,
          contact_no: phone,
          contact: phone,
          blood_group_need: bloodGroup,
          hospital_name_city: hospital,
          urgency_level: urgency,
          patient_notes_requirement_details: userNotes,
          'Patient Notes': userNotes,
          patient_notes: userNotes,
          Centre: preferredCentre,
          centre: preferredCentre,
          Center: preferredCentre,
          center: preferredCentre,
          Location: preferredCentre || hospital,
          location: preferredCentre || hospital,
          Date: formattedDate || prefDate,
          date: formattedDate || prefDate,
          'Preferred Date': formattedDate || prefDate,
          preferred_date: prefDate,
          Message: userNotes,
          message: userNotes,
          Notes: userNotes,
          notes: userNotes,
          'Additional Notes': userNotes,
          Details: userNotes || fullMessage,
          details: userNotes || fullMessage,
          queryType: queryType,
          query_type: queryType,
          bloodGroup: bloodGroup,
          blood_group: bloodGroup,
          units: units,
          hospital: hospital,
          urgency: urgency,
          age: age,
          gender: gender,
          status: 'Pending'
        };

        // Dynamic URL selection based on query type (Donation vs Request vs General)
        let targetSheetsUrl = DEFAULT_GOOGLE_SHEETS_URL;
        if (queryType.toLowerCase().includes('donate') || queryType.toLowerCase().includes('donation') || form.closest('#donateModal')) {
          targetSheetsUrl = DONATE_SHEETS_URL;
        } else if (queryType.toLowerCase().includes('request') || form.closest('#requestBloodModal') || units || hospital) {
          targetSheetsUrl = REQUEST_SHEETS_URL;
        }

        const queryParams = new URLSearchParams(paramData).toString();
        const fullSheetsUrl = `${targetSheetsUrl}?${queryParams}`;

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
          showToast('Form submission encountered a network issue. Please try again.', 'error');
          return;
        }

        // Form submission completed
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
