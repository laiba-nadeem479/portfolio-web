(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Set Current Year in Footer
  var yr = $('#current-year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* =============================================================
     1. TOAST NOTIFICATIONS & LIGHTWEIGHT CONFETTI CANNON
     ============================================================= */
  var toast = $('#toast'), toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
  }

  // Built-in Pure Canvas Confetti Cannon
  function fireConfetti() {
    if (window.confetti) {
      window.confetti({ particleCount: 65, spread: 75, origin: { y: 0.7 } });
      return;
    }
    var canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var w = canvas.width = window.innerWidth;
    var h = canvas.height = window.innerHeight;
    var colors = ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#ffffff', '#fed7aa'];
    var pieces = [];
    for (var i = 0; i < 48; i++) {
      pieces.push({
        x: w / 2, y: h * 0.7,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10
      });
    }

    var start = performance.now();
    function animate(t) {
      ctx.clearRect(0, 0, w, h);
      var progress = (t - start) / 1600;
      pieces.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45;
        p.rotation += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(animate);
  }

  /* =============================================================
     2. 3D DEPTH CANVAS CONSTELLATION & PARALLAX
     ============================================================= */
  var bgCanvas = $('#bg-canvas');
  if (bgCanvas && !reduced) {
    var bCtx = bgCanvas.getContext('2d');
    var bW, bH;
    var mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
    var particles = [];

    function resizeBg() {
      bW = bgCanvas.width = window.innerWidth;
      bH = bgCanvas.height = window.innerHeight;
      createParticles();
    }

    function createParticles() {
      particles = [];
      var count = Math.min(55, Math.floor((bW * bH) / 20000));
      for (var i = 0; i < count; i++) {
        var z = Math.random() * 1.2 + 0.3; // 3D depth layer
        particles.push({
          x: Math.random() * bW,
          y: Math.random() * bH,
          z: z,
          vx: (Math.random() - 0.5) * 0.35 * z,
          vy: (Math.random() - 0.5) * 0.35 * z,
          radius: (Math.random() * 1.5 + 0.8) * z
        });
      }
    }

    window.addEventListener('resize', resizeBg);
    window.addEventListener('mousemove', function (e) {
      mouse.vx = (e.clientX - mouse.x) * 0.05;
      mouse.vy = (e.clientY - mouse.y) * 0.05;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function drawBg() {
      bCtx.clearRect(0, 0, bW, bH);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = bW;
        if (p.x > bW) p.x = 0;
        if (p.y < 0) p.y = bH;
        if (p.y > bH) p.y = 0;

        // 3D Parallax response to mouse
        var dxm = mouse.x - p.x;
        var dym = mouse.y - p.y;
        var distM = Math.sqrt(dxm * dxm + dym * dym);
        if (distM < 130) {
          p.x -= (dxm / distM) * 0.9 * p.z;
          p.y -= (dym / distM) * 0.9 * p.z;
        }

        bCtx.beginPath();
        bCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        bCtx.fillStyle = 'rgba(249, 115, 22, ' + (0.35 * p.z) + ')';
        bCtx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx = p.x - p2.x;
          var dy = p.y - p2.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 125) {
            bCtx.beginPath();
            bCtx.moveTo(p.x, p.y);
            bCtx.lineTo(p2.x, p2.y);
            var alpha = 0.16 * (1 - dist / 125) * Math.min(p.z, p2.z);
            bCtx.strokeStyle = 'rgba(251, 146, 60, ' + alpha + ')';
            bCtx.lineWidth = 0.65;
            bCtx.stroke();
          }
        }
      }
      requestAnimationFrame(drawBg);
    }

    resizeBg();
    drawBg();
  }

  /* =============================================================
     3. 3D CARD TILT & PARALLAX PHYSICS
     ============================================================= */
  var tiltCards = $$('.avatar-stage, .tech-card, .service-card, .edu-card, .simulator-window, .scope-calculator-card');
  if (!reduced) {
    tiltCards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');

        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = ((y - centerY) / centerY) * -9;
        var rotateY = ((x - centerX) / centerX) * 9;

        var card3d = $('.avatar-card-3d', card) || (card.classList.contains('avatar-card-3d') ? card : null);
        if (card3d) {
          card3d.style.transform = 'perspective(900px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(10px)';
        } else {
          card.style.transform = 'perspective(900px) rotateX(' + (rotateX * 0.7) + 'deg) rotateY(' + (rotateY * 0.7) + 'deg) translateZ(8px)';
        }
      });

      card.addEventListener('mouseleave', function () {
        var card3d = $('.avatar-card-3d', card) || (card.classList.contains('avatar-card-3d') ? card : null);
        if (card3d) {
          card3d.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        } else {
          card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        }
      });
    });

    // 3D Solar Tech Orbit mouse interactive tilt
    var orbitShowcase = $('.orbit-showcase');
    var orbitStage = $('.orbit-stage', orbitShowcase);
    if (orbitShowcase && orbitStage) {
      orbitShowcase.addEventListener('mousemove', function (e) {
        var rect = orbitShowcase.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        var y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
        orbitStage.style.transform = 'perspective(3000px) rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 10) + 'deg)';
      });
      orbitShowcase.addEventListener('mouseleave', function () {
        orbitStage.style.transform = 'perspective(3000px) rotateY(0deg) rotateX(0deg)';
      });
    }
  }

  /* =============================================================
     4. TYPEWRITER EFFECT
     ============================================================= */
  var rot = $('#typewriterRole');
  if (rot && !reduced) {
    var phrases = [
      'Full Stack Developer.',
      'Next.js & React Specialist.',
      'AI Solutions Integrator.',
      'Node.js & MySQL Architect.'
    ];
    var pi = 0, ci = phrases[0].length, deleting = false;
    setTimeout(function type() {
      var full = phrases[pi];
      if (deleting) {
        ci--;
      } else {
        ci++;
      }
      rot.textContent = full.slice(0, ci);

      var delay = deleting ? 35 : 75;
      if (!deleting && ci === full.length) {
        deleting = true;
        delay = 2200;
      } else if (deleting && ci <= 0) {
        deleting = false;
        ci = 0;
        pi = (pi + 1) % phrases.length;
        delay = 400;
      }
      setTimeout(type, delay);
    }, 1500);
  }

  /* =============================================================
     5. SKILLS FILTERING TABS
     ============================================================= */
  var filterBtns = $$('.filter-btn');
  var techCards = $$('.tech-card');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.getAttribute('data-filter');

      techCards.forEach(function (card) {
        var cat = card.getAttribute('data-category');
        var match = (filter === 'all' || cat === filter);
        if (match) {
          card.style.display = 'flex';
          setTimeout(function () { card.style.opacity = '1'; card.style.transform = 'none'; }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.85)';
          setTimeout(function () { card.style.display = 'none'; }, 200);
        }
      });
    });
  });

  /* =============================================================
     6. QUIZMASTER INTERACTIVE SIMULATOR (Student, Admin, Teacher)
     ============================================================= */
  var qmTabs = $$('.sim-tab-btn');
  var qmPanels = {
    admin: $('#qm-admin-panel'),
    teacher: $('#qm-teacher-panel'),
    student: $('#qm-student-panel')
  };

  qmTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var role = tab.getAttribute('data-role');
      qmTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');

      Object.keys(qmPanels).forEach(function (key) {
        if (qmPanels[key]) {
          qmPanels[key].style.display = (key === role) ? 'block' : 'none';
        }
      });
    });
  });

  // Student Playable Interactive Quiz
  var quizOpts = $$('.quiz-opt-btn');
  var quizScoreEl = $('#quizScoreVal');
  var quizAnswered = false;

  quizOpts.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (quizAnswered) return;
      var isCorrect = btn.getAttribute('data-correct') === 'true';
      if (isCorrect) {
        btn.classList.add('correct');
        quizAnswered = true;
        if (quizScoreEl) quizScoreEl.textContent = '7 / 7 (100%)';
        fireConfetti();
        showToast('Correct! useEffect handles side effects in React! 🏆');
      } else {
        btn.classList.add('wrong');
        showToast('Not quite! Hint: Side effects like data fetching use useEffect.');
        setTimeout(function () { btn.classList.remove('wrong'); }, 800);
      }
    });
  });

  // Countdown timer simulation
  var stTimer = $('#quizTimerVal');
  var quizSeconds = 750;
  if (stTimer && !reduced) {
    setInterval(function () {
      if (document.hidden) return;
      quizSeconds = quizSeconds > 0 ? quizSeconds - 1 : 750;
      var mins = Math.floor(quizSeconds / 60);
      var secs = ('0' + (quizSeconds % 60)).slice(-2);
      stTimer.textContent = mins + ':' + secs;
    }, 1000);
  }

  // Teacher Moderation Approvals
  $$('.ap-action-btn').forEach(function (apBtn) {
    apBtn.addEventListener('click', function () {
      var isDone = apBtn.classList.toggle('approved');
      apBtn.textContent = isDone ? 'Approved ✓' : 'Approve';
      if (isDone) showToast('AI image approved for curriculum! ✅');
    });
  });

  /* =============================================================
     7. RESUMEAI ATS INTERACTIVE SCANNER SIMULATOR
     ============================================================= */
  var presetChips = $$('.preset-chip');
  var raRunBtn = $('#raRunAnalysis');
  var atsGauge = $('#atsGaugeFill');
  var atsScoreNum = $('#atsScoreNumber');

  var presetScores = {
    fullstack: { score: 94, keywords: '96%', format: '92%', metrics: '88%' },
    frontend: { score: 89, keywords: '91%', format: '94%', metrics: '78%' },
    ai: { score: 87, keywords: '89%', format: '88%', metrics: '74%' }
  };
  var currentPreset = 'fullstack';

  presetChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      presetChips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      currentPreset = chip.getAttribute('data-preset') || 'fullstack';
      runAtsScan();
    });
  });

  function countUp(el, target) {
    if (!el) return;
    var start = performance.now(), dur = 1000;
    (function frame(now) {
      var p = Math.min(1, (now - start) / dur);
      var ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * ease);
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }

  function runAtsScan() {
    var data = presetScores[currentPreset] || presetScores.fullstack;
    if (raRunBtn) {
      raRunBtn.disabled = true;
      raRunBtn.textContent = 'Scanning ATS keywords…';
    }

    setTimeout(function () {
      if (atsGauge) {
        var offset = 314 * (1 - data.score / 100);
        atsGauge.style.strokeDashoffset = offset;
      }
      if (atsScoreNum) countUp(atsScoreNum, data.score);

      // Update breakdown tracks
      var bar1 = $('#atsKwBar'); if (bar1) bar1.style.width = data.keywords;
      var bar2 = $('#atsFmtBar'); if (bar2) bar2.style.width = data.format;
      var bar3 = $('#atsMetBar'); if (bar3) bar3.style.width = data.metrics;

      if (raRunBtn) {
        raRunBtn.disabled = false;
        raRunBtn.textContent = '⚡ Run Analysis Again';
      }
      showToast('ATS match score updated to ' + data.score + '% 🚀');
    }, 450);
  }

  if (raRunBtn) {
    raRunBtn.addEventListener('click', function () {
      runAtsScan();
    });
  }

  /* =============================================================
     8. HIRE ME INTERACTIVE SCOPE ESTIMATOR
     ============================================================= */
  var scopeBoxes = $$('.scope-checkbox-label');
  var scopeMsgBtn = $('#scopeGenerateBtn');
  var scopeSummary = $('#scopeSelectedSummary');

  scopeBoxes.forEach(function (box) {
    box.addEventListener('click', function () {
      box.classList.toggle('selected');
      updateScopeSummary();
    });
  });

  function getSelectedScopes() {
    return scopeBoxes
      .filter(function (b) { return b.classList.contains('selected'); })
      .map(function (b) { return b.getAttribute('data-service'); });
  }

  function updateScopeSummary() {
    var selected = getSelectedScopes();
    if (!scopeSummary) return;
    if (selected.length === 0) {
      scopeSummary.textContent = 'Select one or more services above to tailor your project discussion.';
    } else {
      scopeSummary.textContent = 'Selected: ' + selected.join(' · ') + ' (Ready to discuss)';
    }
  }

  if (scopeMsgBtn) {
    scopeMsgBtn.addEventListener('click', function () {
      var selected = getSelectedScopes();
      var cfMsg = $('#cf-message');
      if (cfMsg) {
        if (selected.length > 0) {
          cfMsg.value = 'Hi Laiba, I would like to discuss a project involving: ' + selected.join(', ') + '. Let’s connect!';
        } else {
          cfMsg.value = 'Hi Laiba, I would love to collaborate on a full stack web application with you.';
        }
      }
      var contactSec = $('#contact');
      if (contactSec) contactSec.scrollIntoView({ behavior: 'smooth' });
      showToast('Inquiry generated! Directing to contact form 📩');
    });
  }

  /* =============================================================
     9. CONTACT FORM & CLIPBOARD COPY
     ============================================================= */
  function copyEmail() {
    var mail = 'laibanadeem631@gmail.com';
    var onSuccess = function () {
      fireConfetti();
      showToast('Email copied to clipboard! 📋');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(mail).then(onSuccess, function () { showToast(mail); });
    } else {
      showToast(mail);
    }
  }

  var copyBtn = $('#copyMailBtn');
  if (copyBtn) copyBtn.addEventListener('click', copyEmail);

  // Quick message topic presets
  $$('.topic-btn').forEach(function (tb) {
    tb.addEventListener('click', function () {
      var topic = tb.getAttribute('data-topic');
      var m = $('#cf-message');
      if (m) m.value = 'Hi Laiba, I would like to talk about ' + topic + '. ';
    });
  });

  // Contact Form Submission
  var TO_EMAIL = 'laibanadeem631@gmail.com';
  var contactForm = $('#contactForm');
  var formFeedback = $('#formFeedback');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#cf-name').value.trim();
      var email = $('#cf-email').value.trim();
      var message = $('#cf-message').value.trim();

      if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length < 5) {
        if (formFeedback) {
          formFeedback.textContent = 'Please enter your name, a valid email address and a message.';
          formFeedback.className = 'form-feedback error';
        }
        return;
      }

      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var origText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending message…';

      fetch('https://formsubmit.co/ajax/' + TO_EMAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          message: message,
          _subject: 'Portfolio Inquiry from ' + name,
          _replyto: email
        })
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success === 'true' || data.success === true) {
          contactForm.reset();
          if (formFeedback) {
            formFeedback.textContent = 'Thank you! Your message has been sent successfully. I will get back to you shortly.';
            formFeedback.className = 'form-feedback success';
          }
          fireConfetti();
          showToast('Message sent successfully! 🚀');
        } else {
          throw new Error('fail');
        }
      })
      .catch(function () {
        if (formFeedback) {
          formFeedback.textContent = 'Could not send directly. Opening your default mail client…';
          formFeedback.className = 'form-feedback error';
        }
        window.location.href = 'mailto:' + TO_EMAIL + '?subject=' + encodeURIComponent('Portfolio Inquiry from ' + name) + '&body=' + encodeURIComponent(message + '\n\n— ' + name + ' (' + email + ')');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      });
    });
  }

  /* =============================================================
     10. SCROLL SPY & STICKY HEADER
     ============================================================= */
  var header = $('#siteHeader');
  var navLinks = $$('.nav-desktop .nav-link');
  var sections = navLinks.map(function (link) {
    var href = link.getAttribute('href');
    return href ? $(href) : null;
  });

  window.addEventListener('scroll', function () {
    var scrollPos = window.scrollY;
    if (header) {
      if (scrollPos > 30) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }

    var currentActive = navLinks[0];
    sections.forEach(function (sec, idx) {
      if (sec && sec.offsetTop <= scrollPos + window.innerHeight * 0.35) {
        currentActive = navLinks[idx];
      }
    });
    navLinks.forEach(function (l) {
      l.classList.toggle('active', l === currentActive);
    });
  }, { passive: true });

  // Mobile menu toggle
  var navToggle = $('#navToggle');
  var mobileNav = $('#mobileNav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open);
    });
    $$('a', mobileNav).forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        navToggle.classList.remove('open', false);
      });
    });
  }

  /* =============================================================
     10. ANIMATIONS: SCROLL REVEAL + SCROLL PROGRESS BAR
     ============================================================= */
  (function () {
    // Scroll progress bar
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var ticking = false;
    function updateBar() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateBar); }
    }, { passive: true });
    updateBar();

    // Scroll reveal (only when JS + IntersectionObserver are available)
    if (reduced || !document.documentElement.classList.contains('js')) return;
    var targets = $$('.section-head, .about-card, .about-body, .tech-card, .project-showcase, .edu-card, .service-card, .scope-calculator-card, .globe-stage-wrapper, .contact-channels, .contact-form-glass, .footer-top');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) {
      // stagger siblings inside the same grid
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--rv-delay', Math.min(idx, 6) * 70 + 'ms');
      el.classList.add('rv');
      io.observe(el);
    });
  })();

})();