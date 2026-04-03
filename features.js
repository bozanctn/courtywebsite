// Features page — phone carousel & feature item interaction

(function () {
  function initCarousel(group) {
    const items = document.querySelectorAll(`.fd-item[data-group="${group}"]`);
    const dots  = document.querySelectorAll(`#${group}-dots .sp-dot`);
    let current = 0;
    const total = items.length;

    function showScreen(index) {
      // Update images
      const img = document.getElementById(`${group}-img-${index}`);
      if (img) {
        const siblings = img.parentElement.querySelectorAll('.sp-img');
        siblings.forEach(s => s.classList.remove('active'));
        img.classList.add('active');
      }

      // Update dots
      dots.forEach((d, i) => d.classList.toggle('active', i === index));

      // Update feature items
      items.forEach((item, i) => item.classList.toggle('active', i === index));
    }

    // Feature item click
    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        current = index;
        showScreen(index);
      });
    });

    // Dot click
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const target = parseInt(dot.dataset.target, 10);
        current = target;
        showScreen(target);
      });
    });

    // Auto-advance every 4 seconds, paused on hover
    const section = items[0]?.closest('.audience-section');
    let timer = null;

    function startTimer() {
      timer = setInterval(() => {
        current = (current + 1) % total;
        showScreen(current);
      }, 4000);
    }

    function stopTimer() {
      clearInterval(timer);
      timer = null;
    }

    startTimer();

    if (section) {
      section.addEventListener('mouseenter', stopTimer);
      section.addEventListener('mouseleave', startTimer);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCarousel('club');
    initCarousel('player');
  });
})();
