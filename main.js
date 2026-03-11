/**
 * Lahontan Paramedical Services
 * Main JavaScript - Single Page Application
 */

(function() {
    'use strict';

    // ===== DOM Elements =====
    const header = document.getElementById('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const testimonialDots = document.querySelectorAll('.dot');
    const contactForm = document.getElementById('contact-form');
    const responseMessage = document.getElementById('response-message');
    const statNumbers = document.querySelectorAll('.stat-number');

    // ===== State =====
    let currentTestimonial = 0;
    let testimonialInterval = null;
    let statsAnimated = false;

    // ===== Initialize =====
    function init() {
        setupMobileMenu();
        setupSmoothScroll();
        setupHeaderScroll();
        setupTestimonials();
        setupContactForm();
        setupScrollReveal();
        setupStatsObserver();
    }

    // ===== Mobile Menu =====
    function setupMobileMenu() {
        if (!menuToggle || !navMenu) return;

        menuToggle.addEventListener('click', toggleMenu);
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });

        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                closeMenu();
            }
        });
    }

    function toggleMenu() {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    }

    function closeMenu() {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ===== Smooth Scroll =====
    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const target = document.querySelector(targetId);
                
                if (target) {
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = targetPosition - headerHeight;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ===== Header Scroll Effect =====
    function setupHeaderScroll() {
        if (!header) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleHeaderScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });

        function handleHeaderScroll() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }

    // ===== Testimonials Slider =====
    function setupTestimonials() {
        if (testimonialCards.length === 0) return;

        testimonialDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToTestimonial(index);
                resetInterval();
            });
        });

        startInterval();

        const slider = document.querySelector('.testimonials-slider');
        if (slider) {
            slider.addEventListener('mouseenter', stopInterval);
            slider.addEventListener('mouseleave', startInterval);
        }
    }

    function goToTestimonial(index) {
        testimonialCards.forEach((card, i) => {
            card.classList.remove('active');
            if (testimonialDots[i]) {
                testimonialDots[i].classList.remove('active');
            }
        });

        testimonialCards[index].classList.add('active');
        if (testimonialDots[index]) {
            testimonialDots[index].classList.add('active');
        }
        
        currentTestimonial = index;
    }

    function nextTestimonial() {
        const next = (currentTestimonial + 1) % testimonialCards.length;
        goToTestimonial(next);
    }

    function startInterval() {
        if (testimonialInterval) return;
        testimonialInterval = setInterval(nextTestimonial, 5000);
    }

    function stopInterval() {
        if (testimonialInterval) {
            clearInterval(testimonialInterval);
            testimonialInterval = null;
        }
    }

    function resetInterval() {
        stopInterval();
        startInterval();
    }

    // ===== Contact Form with Formspree =====
    function setupContactForm() {
        if (!contactForm) return;

        contactForm.addEventListener('submit', handleFormSubmit);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('button[type="submit"]');
        const formData = new FormData(contactForm);

        // Honeypot check
        if (formData.get('_gotcha')) {
            showMessage('Thank you!', 'success');
            return;
        }

        // Basic validation
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const message = formData.get('message').trim();

        if (!name || name.length < 2) {
            showMessage('Please enter your name.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showMessage('Please enter a valid email.', 'error');
            return;
        }

        if (!message || message.length < 10) {
            showMessage('Please enter a message (at least 10 characters).', 'error');
            return;
        }

        // Rate limiting
        const lastSubmit = sessionStorage.getItem('lastFormSubmit');
        const now = Date.now();
        if (lastSubmit && (now - parseInt(lastSubmit)) < 30000) {
            showMessage('Please wait 30 seconds before submitting again.', 'error');
            return;
        }

        // // Show loading state
        // submitBtn.textContent = 'Sending...';
        // submitBtn.disabled = true;

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                sessionStorage.setItem('lastFormSubmit', now.toString());
                showMessage('✓ Thank you! We\'ll contact you within 24 hours.', 'success');
                contactForm.reset();
            } else {
                const data = await response.json();
                if (data.errors) {
                    showMessage('Error: ' + data.errors.map(e => e.message).join(', '), 'error');
                } else {
                    showMessage('Something went wrong. Please try again.', 'error');
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showMessage('Network error. Please check your connection and try again.', 'error');
        } finally {
            if (submitBtn){
            submitBtn.textContent = 'Send Message';
            submitBtn.disabled = false;
            }

        }
    }

    function showMessage(text, type) {
        if (!responseMessage) return;
        
        responseMessage.textContent = text;
        responseMessage.className = 'response-message ' + type;
        
        setTimeout(() => {
            responseMessage.textContent = '';
            responseMessage.className = 'response-message';
        }, 6000);
    }

    // ===== Scroll Reveal =====
    function setupScrollReveal() {
        const revealElements = document.querySelectorAll(
            '.service-card, .stat-card, .info-card, .about-content, .contact-form'
        );

        revealElements.forEach((el, index) => {
            el.classList.add('reveal');
            if (index % 3 === 1) el.classList.add('delay-1');
            if (index % 3 === 2) el.classList.add('delay-2');
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    }

    // ===== Stats Counter Animation =====
    function setupStatsObserver() {
        if (statNumbers.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !statsAnimated) {
                    statsAnimated = true;
                    animateStats();
                }
            });
        }, {
            threshold: 0.5
        });

        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            observer.observe(aboutSection);
        }
    }

    function animateStats() {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'), 10);
            const duration = 2000;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(easeOut * target);

                if (target >= 1000) {
                    stat.textContent = current.toLocaleString() + '+';
                } else if (target === 98) {
                    stat.textContent = current + '%';
                } else {
                    stat.textContent = current + '+';
                }

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            }

            requestAnimationFrame(updateCounter);
        });
    }

    // ===== Start Application =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('🏥 Lahontan Paramedical Services loaded');

})();