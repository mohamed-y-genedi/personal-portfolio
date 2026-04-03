import { setLanguage, translations } from './i18n.js';
import { initTypeWriter, showToast } from './animations.js';

/*==================== MENU SHOW Y HIDDEN ====================*/
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

/*===== MENU SHOW =====*/
if(navToggle){
    navToggle.addEventListener('click', () =>{
        if(navMenu) navMenu.classList.toggle('show-menu')
    })
}

/*===== MENU HIDDEN =====*/
if(navClose){
    navClose.addEventListener('click', () =>{
        if(navMenu) navMenu.classList.remove('show-menu')
    })
}

/*==================== AUTO-CLOSE MOBILE MENU ====================*/
const navLinks = document.querySelectorAll('.nav__link');
const navMenuContainer = document.querySelector('.nav__menu');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navMenuContainer) {
            navMenuContainer.classList.remove('show-menu', 'active');
        }
    });
});

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.scrollY

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 80;
        const sectionId = current.getAttribute('id')

        const navSectionLink = document.querySelector('.nav__menu a[href*=' + sectionId + ']');
        if (navSectionLink) {
             if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
                navSectionLink.classList.add('active-link')
            }else{
                navSectionLink.classList.remove('active-link')
            }
        }
    })
}
window.addEventListener('scroll', scrollActive)

/*==================== CHANGE BACKGROUND HEADER ====================*/ 
function scrollHeader(){
    const nav = document.querySelector(".header");
    if(nav) {
        if(this.scrollY >= 80) nav.classList.add('scroll-header'); else nav.classList.remove('scroll-header')
    }
}
window.addEventListener('scroll', scrollHeader)

/*==================== SHOW SCROLL UP ====================*/ 
function scrollUp(){
    const scrollUp = document.getElementById('scroll-up');
    if(scrollUp) {
        if(this.scrollY >= 560) scrollUp.classList.add('show-scroll'); else scrollUp.classList.remove('show-scroll')
    }
}
window.addEventListener('scroll', scrollUp)

/*==================== DARK LIGHT THEME ====================*/ 
const themeButton = document.getElementById('theme-button')
const darkTheme = 'dark-theme'
const iconTheme = 'fa-sun'

const selectedTheme = localStorage.getItem('selected-theme')
const selectedIcon = localStorage.getItem('selected-icon')

const getCurrentTheme = () => document.body.classList.contains('light-theme') ? 'dark' : 'light'
const getCurrentIcon = () => themeButton && themeButton.classList.contains('fa-moon') ? 'fa-moon' : 'fa-sun'

if (selectedTheme && themeButton) {
  document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme)
  themeButton.classList[selectedIcon === 'fa-moon' ? 'add' : 'remove'](iconTheme)
}

if(themeButton) {
    themeButton.addEventListener('click', () => {
        document.body.classList.toggle('light-theme')
        themeButton.classList.toggle(iconTheme)
        
        localStorage.setItem('selected-theme', getCurrentTheme())
        localStorage.setItem('selected-icon', getCurrentIcon())
    })
}

/*==================== CONTACT FORM ===============*/
const contactForm = document.getElementById('contact-form'),
      contactName = document.getElementById('contact-name'),
      contactEmail = document.getElementById('contact-email'),
      contactMessage = document.getElementById('contact-message'),
      contactMessageDisplay = document.getElementById('contact-message-display')

// Helper for UI Feedback
function showFeedback(element, message, type) {
    if(!element) return;
    
    element.classList.remove('color-blue', 'color-red');
    
    if(type === 'success' || type === 'loading') {
        element.classList.add('color-blue');
    } else {
        element.classList.add('color-red');
    }
    
    element.textContent = message;

    if(type === 'success' || type === 'error') {
        setTimeout(() =>{
            element.textContent = ''
        }, 5000)
    }
}

const sendEmail = async (e) => {
    e.preventDefault();

    const nameVal = DOMPurify.sanitize(contactName.value.trim());
    const emailVal = DOMPurify.sanitize(contactEmail.value.trim());
    const messageVal = DOMPurify.sanitize(contactMessage.value.trim());
    const honeyInput = contactForm.querySelector('[name="_honey"]');
    const honeyVal = honeyInput ? honeyInput.value : '';

    // Honeypot anti-spam check
    if (honeyVal !== '') return;

    if (nameVal === '' || emailVal === '' || messageVal === '') {
        showFeedback(contactMessageDisplay, 'Write all the input fields 📩', 'error');
        return;
    }

    if (nameVal.length < 2) {
        showFeedback(contactMessageDisplay, 'Name must be at least 2 characters.', 'error');
        return;
    }

    if (messageVal.length < 10) {
        showFeedback(contactMessageDisplay, 'Message must be at least 10 characters.', 'error');
        return;
    }

    const submitBtn = contactForm.querySelector('button');
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Sending...';
    showFeedback(contactMessageDisplay, 'Sending...', 'loading');

    try {
        const response = await fetch('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ name: nameVal, email: emailVal, message: messageVal })
        });

        const data = await response.json();

        if (response.ok) {
            contactForm.reset();
            const currentLang = document.documentElement.getAttribute('lang') || 'en';
            const msg = currentLang === 'ar' ? 'تم إرسال رسالتك بنجاح! ✅' : 'Message sent successfully! ✅';
            showFeedback(contactMessageDisplay, msg, 'success');
        } else {
            if (response.status === 429) {
                throw new Error('Too many requests. Please try again later.');
            }
            const serverMsg = data.message || 'Failed to send message.';
            throw new Error(serverMsg);
        }

    } catch (error) {
        let errorMsg = 'OOPS! Something went wrong... 😔';

        if (error.message) errorMsg = error.message;
        if (error.message.includes('Failed to fetch')) {
            errorMsg = 'Server is not running 🔴';
        }
        showToast(errorMsg, 'error');
    } finally {
        submitBtn.classList.remove('loading');
        const currentLang = document.documentElement.getAttribute('lang') || 'en';
        if (translations && translations[currentLang] && translations[currentLang].send_message) {
            submitBtn.textContent = translations[currentLang].send_message;
        } else {
            submitBtn.textContent = 'Send Message';
        }
    }
}

if(contactForm) {
    contactForm.addEventListener('submit', sendEmail)
}



/*==================== CASE STUDY MODAL ====================*/
const d = document;

d.addEventListener('click', (e) => {
    const btn = e.target.closest('.case-study-btn');
    const closeBtn = e.target.closest('.modal__close');
    
    if(btn) {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const modal = d.getElementById(targetId);
        if(modal) {
            modal.classList.add('active-modal');
            d.body.style.overflow = 'hidden';
            setTimeout(() => {
                const close = modal.querySelector('.modal__close');
                if(close) close.focus();
            }, 100);
        }
    }
    
    if(closeBtn) {
        const modal = closeBtn.closest('.modal');
        closeModal(modal);
    }
    
    if(e.target.classList.contains('modal') || e.target.classList.contains('modal__overlay')) {
        const modal = e.target.closest('.modal');
        closeModal(modal);
    }
});

function closeModal(modal) {
    if(modal) {
        modal.classList.remove('active-modal');
        d.body.style.overflow = '';
    }
}

d.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
        const activeModal = d.querySelector('.modal.active-modal');
        closeModal(activeModal);
    }
});

/* ==================== CLICKABLE CONTACT CARDS ==================== */
const contactCards = document.querySelectorAll('.contact__card');
contactCards.forEach(card => {
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking the button directly (to avoid double action)
        if(e.target.closest('.contact__button')) return;
        
        const link = card.querySelector('.contact__button');
        if(link) {
            link.click();
        }
    });
});

/* ==================== MODULE 1: CUSTOM CURSOR & MAGNETISM ==================== */
const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');
const magneticButtons = document.querySelectorAll('.button, .nav__link, .change-theme');

// Fix: Hide cursor when leaving window
document.addEventListener('mouseleave', () => {
    if(cursorDot) cursorDot.style.opacity = '0';
    if(cursorOutline) cursorOutline.style.opacity = '0';
});

document.addEventListener('mouseenter', () => {
    if(cursorDot) cursorDot.style.opacity = '1';
    if(cursorOutline) cursorOutline.style.opacity = '1';
});

// Mouse Move Logic
window.addEventListener('mousemove', function (e) {
    const posX = e.clientX;
    const posY = e.clientY;

    if (cursorDot && cursorOutline) {
        // Dot follows instantly
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Outline follows with lag
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    }
});

// Hover States
const hoverElements = document.querySelectorAll('a, button, .card, .projects__content, .skills__content');
hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});

// Magnetic Buttons Effect
magneticButtons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        // Also move child icons if any
        const icon = btn.querySelector('i');
        if(icon) {
            icon.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        }
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
        const icon = btn.querySelector('i');
        if(icon) icon.style.transform = 'translate(0, 0)';
    });
});

/* ==================== MODULE 3: NAVIGATION & PROGRESS ==================== */
const progressBar = document.getElementById('scroll-progress-bar');
const progressCircle = document.querySelector('.progress-ring__circle');
const radius = progressCircle ? progressCircle.r.baseVal.value : 0;
const circumference = 2 * Math.PI * radius;

if(progressCircle) {
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;
}

function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = scrollTop / docHeight;

    // Line Progress
    if(progressBar) {
        progressBar.style.width = `${scrollPercent * 100}%`;
    }

    // Circle Progress
    if(progressCircle) {
        const offset = circumference - (scrollPercent * circumference);
        progressCircle.style.strokeDashoffset = offset;
    }
}

window.addEventListener('scroll', () => requestAnimationFrame(updateScrollProgress));

/* ==================== MODULE 4: MICRO-INTERACTIONS ==================== */
// Handled via CSS Animations

/* ==================== UPDATED CONTACT FORM LOGIC WITH TOAST ==================== */
// We need to redefine/update the sendEmail function to use showToast
// This re-assignment will override the previous one if placed after it.
const originalShowFeedback = showFeedback; // backup

// Override showFeedback to use Toast for success/error
function showFeedbackEnhanced(element, message, type) {
    // Keep internal text for inline feedback if needed, but primarily use Toast for status
    if (type === 'success') {
        showToast(message, 'success');
        if(element) element.textContent = ''; // Clear inline
    } else if (type === 'error') {
        showToast(message, 'error');
        if(element) element.textContent = message; // Keep inline for errors too
    } else {
        // Loading etc.
        if(element) {
            element.textContent = message;
            element.className = type === 'loading' ? 'color-blue' : '';
        }
    }
}

// Replace the global showFeedback with our enhanced version
// This assumes showFeedback was defined in the global scope in the previous code block.
// Since we are appending, we can just overwrite the function name reference in the `sendEmail` or redefined `showFeedback`.
// BUT `sendEmail` calls `showFeedback`. We can overwrite `showFeedback` function itself if it was `var` or `function`.
// It was `function showFeedback...` so we can overwrite it.
showFeedback = showFeedbackEnhanced;
