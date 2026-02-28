/**
 * Initializes the application logic once the DOM is fully loaded.
 */
function initApp() {
  const faqItems = document.querySelectorAll('.faq-item');

  /**
   * Initialize FAQ Accordion functionality.
   * Adds click listeners to toggle open/close states and update icons.
   */
  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
      // Check if this item is currently open
      const isOpen = item.classList.contains('open');

      // Close all other items to create an accordion effect
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove('open');
          const otherIcon = otherItem.querySelector('.faq-icon');
          if (otherIcon) otherIcon.textContent = '+';
        }
      });

      // Toggle the clicked item
      item.classList.toggle('open');

      // Update the toggle icon
      const icon = item.querySelector('.faq-icon');
      if (icon) {
        icon.textContent = isOpen ? '+' : '×'; // Plus to "X"
      }
    });
  });

  /**
   * Handle Email Form Submissions.
   * Intercepts form submit, sends API request, and handles UI feedback.
   */
  const emailForms = document.querySelectorAll('.email-form');

  emailForms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const input = form.querySelector('.email-input');
      const button = form.querySelector('.btn-get-started');
      const originalText = button.innerHTML;
      const email = input.value;

      if (!email) return;

      // Update button state to indicate loading
      button.disabled = true;
      button.innerText = 'Sending...';

      try {
        /**
         * @type {Response}
         */
        const response = await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          alert('Success! ' + data.message);
          input.value = '';
        } else {
          alert('Error: ' + (data.error || 'Something went wrong'));
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to send email. Please try again.');
      } finally {
        // Reset button state
        button.disabled = false;
        button.innerHTML = originalText;
      }
    });
  });
}

// Attach listener if in browser environment
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initApp);
}

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { initApp };
}
