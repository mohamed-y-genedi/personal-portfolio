import { translations } from './i18n.js';

/*==================== SCROLL ANIMATION & REVEAL ====================*/
window.observerOptions = {
    threshold: 0.1
};

window.observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show-element');
        }
    });
}, observerOptions);

const hiddenElements = document.querySelectorAll('.hidden-element');
hiddenElements.forEach((el) => observer.observe(el));

// Reveal Animations (Wow Factor)
const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            obs.unobserve(entry.target); // Optional: stop observing once revealed
        }
    });
}, revealOptions);

const revealElements = document.querySelectorAll('.reveal');
revealElements.forEach(el => revealObserver.observe(el));



/*==================== HERO PARALLAX ====================*/
const homeSection = document.querySelector('.home');
const homeImg = document.querySelector('.home__img');

if(homeSection && homeImg) {
    homeSection.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth - e.pageX * 2) / 90;
        const y = (window.innerHeight - e.pageY * 2) / 90;

        homeImg.style.transform = `translateX(${x}px) translateY(${y}px)`;
    });

    homeSection.addEventListener('mouseleave', () => {
        homeImg.style.transform = `translateX(0) translateY(0)`;
    });
}

/*==================== EASTER EGG ====================*/
const logo = document.querySelector('.nav__logo');
let clickCount = 0;
let eggTimer;

if(logo) {
    logo.addEventListener('click', (e) => {
        e.preventDefault(); 
        clickCount++;
        
        clearTimeout(eggTimer);
        
        if(clickCount === 5) {
            alert("🚀 Developer Mode: Curiosity is the first step to mastery!");
            clickCount = 0;
        }

        eggTimer = setTimeout(() => {
            clickCount = 0;
        }, 1000);
    });
}

/*==================== HIGH-PERFORMANCE TYPING EFFECT ====================*/
window.TypeWriter = class TypeWriter {
    constructor(txtElement, words, wait = 3000) {
        this.txtElement = txtElement;
        this.words = words;
        this.txt = '';
        this.wordIndex = 0;
        this.wait = parseInt(wait, 10);
        this.type();
        this.isDeleting = false;
    }

    type() {
        // Current index of word
        const current = this.wordIndex % this.words.length;
        // Get full text of current word
        const fullTxt = this.words[current];

        // Check if deleting
        if (this.isDeleting) {
            // Remove a char
            this.txt = fullTxt.substring(0, this.txt.length - 1);
        } else {
            // Add a char
            this.txt = fullTxt.substring(0, this.txt.length + 1);
        }

        // Insert txt into element
        this.txtElement.innerHTML = this.txt;

        // Initial Type Speed
        let typeSpeed = 50; // Fast typing speed

        if (this.isDeleting) {
            typeSpeed /= 2; // Delete slightly faster
        }

        // If word is complete
        if (!this.isDeleting && this.txt === fullTxt) {
            // Make pause at end
            typeSpeed = this.wait;
            // Set delete to true
            this.isDeleting = true;
        } else if (this.isDeleting && this.txt === '') {
            this.isDeleting = false;
            // Move to next word
            this.wordIndex++;
            // Pause before start typing
            typeSpeed = 500;
        }

        this.timeoutId = setTimeout(() => this.type(), typeSpeed);
    }

    updateWords(newWords) {
        clearTimeout(this.timeoutId);
        this.words = newWords;
        this.txt = '';
        this.wordIndex = 0;
        this.isDeleting = false;
        this.type();
    }
}

// Init On DOM Load
document.addEventListener('DOMContentLoaded', initTypeWriter);

export function initTypeWriter() {
    const txtElement = document.querySelector('.typewriter-text');
    if (txtElement) {
        let words;
        const currentLang = document.documentElement.getAttribute('lang') || 'en';
        if (translations && translations[currentLang] && translations[currentLang].heroTyping) {
            words = JSON.parse(translations[currentLang].heroTyping);
        } else {
            words = JSON.parse(txtElement.getAttribute('data-words'));
        }
        const wait = 2000;
        // Init TypeWriter and store globally
        window.typeWriterInstance = new TypeWriter(txtElement, words, wait);
    }
}

/*==================== 3D TILT HOVER EFFECT ====================*/
/**
 * تطبيق تأثير الـ 3D المائل على العناصر
 * @param {string} selector - محدد الـ CSS للعناصر المستهدفة
 * @param {number} maxTilt - أقصى زاوية ميلان (بالدرجات)
 */
window.applyTiltEffect = function(selector, maxTilt = 15) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            // الحصول على أبعاد العنصر وموقعه في الشاشة
            const rect = el.getBoundingClientRect();
            
            // حساب إحداثيات الماوس بالنسبة لمركز العنصر (-1 إلى 1)
            // إذا كان الماوس أقصى اليسار تكون x = -1، أقصى اليمين x = 1
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            
            // حساب زوايا الميلان 
            // نطرح 0.5 لنجعل نقطة الصفر (المركز) في منتصف العنصر بدلاً من زاويته العلوية اليسرى
            const tiltX = (0.5 - y) * maxTilt;
            const tiltY = (x - 0.5) * maxTilt;
            
            // إزالة كلاس إعادة التعيين أثناء التحريك لجعل الحركة فورية وسلسة
            el.classList.remove('tilt-reset');
            
            // تطبيق التحويل (Transform)
            el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        // عند خروج الماوس، نعيد العنصر لوضعه الطبيعي بسلاسة
        el.addEventListener('mouseleave', () => {
            el.classList.add('tilt-reset');
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });
}

// تهيئة تأثير الـ 3D عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth >= 768) {
        // تطبيق التأثير على صورة البطل (Hero)
        applyTiltEffect('.home__img', 10);
        
        // تطبيق التأثير على بطاقات المشاريع (Case Studies)
        applyTiltEffect('.case-study-card', 8);
        
        // تطبيق التأثير على شبكة الخدمات (Bento Box)
        applyTiltEffect('.skills__bento-card', 12);
    }
});



/* ==================== MODULE 2: FEEDBACK & IMMERSION ==================== */
// 3D Tilt Effect
// 3D Tilt Effect - Optimized with requestAnimationFrame
const tiltCards = document.querySelectorAll('.projects__content, .skills__category, .skills__bento-card, .service-card');

if (window.innerWidth >= 768) {
    tiltCards.forEach(card => {
        card.classList.add('tilt-card');
        
        let isHovering = false;
        
        card.addEventListener('mouseenter', () => {
            isHovering = true;
        });

        card.addEventListener('mousemove', (e) => {
            if(!isHovering) return;
            
            requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -5; // Max -5deg to 5deg
                const rotateY = ((x - centerX) / centerX) * 5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
        });

        card.addEventListener('mouseleave', () => {
            isHovering = false;
            // Reset transform
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

// Toast Notification Logic
export function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if(!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose icon based on type
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove after 3s
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards'; // Fade out
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Override existing feedback to use Toasts
// We hook into the existing showFeedback function or replace its usage but since sendEmail is defined, 
// let's create a global override if possible or just use it in the send logic below.

