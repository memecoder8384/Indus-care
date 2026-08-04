/**
 * Animated counter function using IntersectionObserver
 */
export function initCounters() {
  const observerOptions = {
    threshold: 0.3
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const targetText = counter.getAttribute('data-target');
        if (!targetText) return;
        
        const target = parseInt(targetText, 10);
        const duration = 2000;
        const stepTime = 30;
        const steps = duration / stepTime;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            counter.innerText = target.toLocaleString() + (target > 10 ? '+' : '');
            clearInterval(timer);
          } else {
            counter.innerText = Math.floor(current).toLocaleString();
          }
        }, stepTime);
        
        counterObserver.unobserve(counter);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.counter').forEach(counter => {
    counterObserver.observe(counter);
  });
}
