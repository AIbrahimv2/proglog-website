// Theme toggle (light/dark)
(function setupThemeToggle() {
  const STORAGE_KEY = 'theme';
  const sunIcon = '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
  const moonIcon = '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  function getEffectiveTheme() {
    const explicit = document.documentElement.getAttribute('data-theme');
    if (explicit === 'dark' || explicit === 'light') return explicit;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.querySelectorAll('.nav-right').forEach(navRight => {
    if (navRight.querySelector('.theme-toggle')) return;

    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.type = 'button';
    button.setAttribute('aria-label', 'Toggle theme');
    button.innerHTML = sunIcon + moonIcon;

    const cta = navRight.querySelector('.nav-cta');
    if (cta) {
      navRight.insertBefore(button, cta);
    } else {
      navRight.prepend(button);
    }

    button.addEventListener('click', () => {
      const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  });
})();

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Close nav when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
    });
  });
}

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.parentElement;
    const isOpen = item.classList.contains('open');

    // Close all other items
    document.querySelectorAll('.faq-item.open').forEach(openItem => {
      openItem.classList.remove('open');
      openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });

    // Toggle current item
    if (!isOpen) {
      item.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});

// Contact form (submits via Formspree)
const contactForm = document.getElementById('contact-form');
const contactSuccess = document.getElementById('contact-success');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        contactForm.hidden = true;
        contactSuccess.hidden = false;
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      alert('Something went wrong. Please try emailing us directly at support@proglog.dev');
    }
  });
}

// Waitlist forms (submits to Loops)
document.querySelectorAll('.waitlist-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const emailInput = form.querySelector('input[type="email"]');
    const successEl = form.parentElement.querySelector('.waitlist-success');
    const errorEl = form.parentElement.querySelector('.waitlist-error');
    const originalText = submitBtn.textContent;

    const showError = (msg) => {
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.hidden = false;
      }
    };

    // Rate limit: 60 seconds between successful submissions
    const previousTimestamp = localStorage.getItem('loops-form-timestamp');
    const now = Date.now();
    if (previousTimestamp && Number(previousTimestamp) + 60000 > now) {
      showError('Too many signups, please try again in a minute.');
      return;
    }
    localStorage.setItem('loops-form-timestamp', String(now));

    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining...';
    if (errorEl) errorEl.hidden = true;

    try {
      const body = new URLSearchParams();
      body.append('userGroup', '');
      body.append('mailingLists', '');
      body.append('email', emailInput.value);

      const response = await fetch(form.action, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        form.hidden = true;
        if (successEl) successEl.hidden = false;
      } else {
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      // Allow retry on any failure (typo, network, etc.)
      localStorage.setItem('loops-form-timestamp', '');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      const isCloudflareBlock = error.message === 'Failed to fetch';
      showError(isCloudflareBlock
        ? 'Too many signups, please try again in a little while.'
        : (error.message || 'Something went wrong. Please try again.'));
    }
  });
});
