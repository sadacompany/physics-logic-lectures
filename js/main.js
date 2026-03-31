/* ============================================================
   Physics Logic Lectures — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* --- Navigation scroll effect --- */
  const nav = document.querySelector('.nav');
  if (nav) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 10);
      lastScroll = y;
    }, { passive: true });
  }

  /* --- Mobile menu toggle --- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      links.classList.toggle('open');
    });
    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('active');
        links.classList.remove('open');
      });
    });
  }

  /* --- Reading progress bar --- */
  const progressBar = document.querySelector('.reading-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
      progressBar.style.width = Math.min(scrolled * 100, 100) + '%';
    }, { passive: true });
  }

  /* --- Search functionality --- */
  const lectures = [
    { num: 1, title: 'Introduction to Physics and Physical Reasoning', cat: 'Foundations', url: 'lectures/01-introduction.html', desc: 'What physics is, observation, models, laws, and logical thinking.' },
    { num: 2, title: 'Units, Dimensions, and Measurement', cat: 'Foundations', url: 'lectures/02-units-dimensions.html', desc: 'SI units, dimensional analysis, precision, uncertainty, and scientific notation.' },
    { num: 3, title: 'Vectors and Motion', cat: 'Mechanics', url: 'lectures/03-vectors-motion.html', desc: 'Scalars, vectors, displacement, velocity, acceleration, and 2D motion.' },
    { num: 4, title: "Newton's Laws of Motion", cat: 'Mechanics', url: 'lectures/04-newtons-laws.html', desc: 'Inertia, force, mass, action-reaction, free body diagrams.' },
    { num: 5, title: 'Work, Energy, and Power', cat: 'Mechanics', url: 'lectures/05-work-energy-power.html', desc: 'Energy transfer, kinetic and potential energy, conservation, power.' },
    { num: 6, title: 'Momentum and Collisions', cat: 'Mechanics', url: 'lectures/06-momentum-collisions.html', desc: 'Linear momentum, impulse, conservation of momentum, collision types.' },
    { num: 7, title: 'Circular Motion and Gravitation', cat: 'Mechanics', url: 'lectures/07-circular-motion-gravitation.html', desc: 'Centripetal acceleration, gravitation, orbits.' },
    { num: 8, title: 'Oscillations and Waves', cat: 'Waves', url: 'lectures/08-oscillations-waves.html', desc: 'Simple harmonic motion, wave properties, interference, resonance.' },
    { num: 9, title: 'Thermodynamics', cat: 'Thermal', url: 'lectures/09-thermodynamics.html', desc: 'Temperature, heat, laws of thermodynamics, entropy.' },
    { num: 10, title: 'Electricity and Magnetism', cat: 'E&M', url: 'lectures/10-electricity-magnetism.html', desc: 'Charge, electric fields, circuits, magnetic fields.' },
    { num: 11, title: 'Optics', cat: 'Waves', url: 'lectures/11-optics.html', desc: 'Reflection, refraction, lenses, image formation, wave-particle duality.' },
    { num: 12, title: 'Modern Physics', cat: 'Modern', url: 'lectures/12-modern-physics.html', desc: 'Relativity, quantum ideas, atomic structure, photons.' }
  ];

  const searchInput = document.querySelector('.nav-search input');
  const searchResults = document.querySelector('.search-results');

  if (searchInput && searchResults) {
    // Determine base path (are we in a subdirectory?)
    const isSubdir = window.location.pathname.includes('/lectures/');
    const prefix = isSubdir ? '../' : '';

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (q.length < 2) {
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
        return;
      }
      const matches = lectures.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.desc.toLowerCase().includes(q) ||
        l.cat.toLowerCase().includes(q)
      );
      if (matches.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item"><span class="result-title">No results found</span></div>';
      } else {
        searchResults.innerHTML = matches.map(l =>
          `<a class="search-result-item" href="${prefix}${l.url}">
            <span class="result-title">Lecture ${l.num}: ${l.title}</span>
            <span class="result-desc">${l.desc}</span>
          </a>`
        ).join('');
      }
      searchResults.classList.add('active');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-search')) {
        searchResults.classList.remove('active');
      }
    });
  }

  /* --- FAQ accordion --- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      // Toggle current
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* --- Scroll reveal --- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => observer.observe(el));
  }

  /* --- Table of Contents active tracking --- */
  const tocLinks = document.querySelectorAll('.toc-list a');
  const sections = document.querySelectorAll('.lecture-section');
  if (tocLinks.length > 0 && sections.length > 0) {
    const tocObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          tocLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { threshold: 0.2, rootMargin: '-80px 0px -60% 0px' });
    sections.forEach(s => tocObserver.observe(s));
  }

  /* --- Lecture Index filter tags --- */
  const filterTags = document.querySelectorAll('.filter-tag');
  const lectureItems = document.querySelectorAll('.lecture-list-item');
  if (filterTags.length > 0 && lectureItems.length > 0) {
    filterTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const cat = tag.dataset.category;
        // Toggle active
        const wasActive = tag.classList.contains('active');
        filterTags.forEach(t => t.classList.remove('active'));
        if (!wasActive) tag.classList.add('active');

        const showAll = wasActive || cat === 'all';
        lectureItems.forEach(item => {
          if (showAll || item.dataset.category === cat) {
            item.style.display = '';
            item.style.opacity = '1';
          } else {
            item.style.opacity = '0';
            setTimeout(() => { item.style.display = 'none'; }, 200);
          }
        });
      });
    });
  }

})();
