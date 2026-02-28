/**
 * @jest-environment jsdom
 */
const { initApp } = require('./script');

describe('Frontend Script', () => {
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('FAQ Accordion', () => {
        it('should toggle faq items on click', () => {
            document.body.innerHTML = `
        <div class="faq-item">
          <button class="faq-question">Q1 <span class="faq-icon">+</span></button>
          <div class="faq-answer">Ans1</div>
        </div>
        <div class="faq-item">
          <button class="faq-question">Q2 <span class="faq-icon">+</span></button>
          <div class="faq-answer">Ans2</div>
        </div>
      `;

            initApp();

            const items = document.querySelectorAll('.faq-item');
            const q1 = items[0].querySelector('.faq-question');
            const q2 = items[1].querySelector('.faq-question');

            // Open first
            q1.click();
            expect(items[0].classList.contains('open')).toBe(true);
            expect(items[0].querySelector('.faq-icon').textContent).toBe('×');

            // Open second, should close first
            q2.click();
            expect(items[1].classList.contains('open')).toBe(true);
            expect(items[0].classList.contains('open')).toBe(false);
            expect(items[0].querySelector('.faq-icon').textContent).toBe('+');
        });
    });

    describe('Email Form', () => {
        it('should submit email and update button state', async () => {
            document.body.innerHTML = `
        <form class="email-form">
            <input class="email-input" value="test@test.com" />
            <button class="btn-get-started">Get Started</button>
        </form>
      `;

            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ message: 'Sent' }),
                })
            );
            global.alert = jest.fn();

            initApp();

            const form = document.querySelector('.email-form');
            const button = form.querySelector('.btn-get-started');

            // We need to wait for the async handler, so we can wrap the event dispatch
            const submitEvent = new Event('submit');
            await form.dispatchEvent(submitEvent);

            expect(button.disabled).toBe(true);
            expect(button.innerText).toBe('Sending...');

            // Wait for promise resolution (microtasks)
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(global.fetch).toHaveBeenCalledWith('/api/send-welcome-email', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ email: 'test@test.com' })
            }));
            expect(button.disabled).toBe(false);
            expect(button.innerText).toBe('Get Started');
            expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Success'));
        });
    });
});
