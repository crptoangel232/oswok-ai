// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Animate WhatsApp messages on load
document.addEventListener('DOMContentLoaded', () => {
  const messages = document.querySelectorAll('.wa-message, .wa-buttons');
  messages.forEach((msg, i) => {
    msg.style.opacity = '0';
    msg.style.transform = 'translateY(10px)';
    setTimeout(() => {
      msg.style.transition = 'opacity 0.4s, transform 0.4s';
      msg.style.opacity = '1';
      msg.style.transform = 'translateY(0)';
    }, 300 + i * 400);
  });
});

// Intersection Observer for feature card animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .tech-item, .impact-card, .vision-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s, transform 0.5s';
  observer.observe(el);
});
