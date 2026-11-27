(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.body.dataset.plan;
  let lang = 'es';

  const PLANS = {
    personal: { name: 'Personal', price: 99.99, url: 'plan-personal.html' },
    app: { name: 'Personal + App', price: 149.99, url: 'plan-personal-app.html' },
    professional: { name: 'Professional', price: 199.99, url: 'plan-professional.html' },
    company: { name: 'Company Oriented', price: 449.99, url: 'plan-company.html' }
  };
  const T = {
    es: {
      people: n => (n >= 60 ? '60 o más personas' : n === 1 ? 'Solo tú' : `${n} personas`),
      per: (p, n) => n >= 60 ? 'Usuarios ilimitados: el precio no sube cuando sumas gente.' : `Sale a $${(p / n).toFixed(2)} por persona al mes.`,
      here: 'Estás viendo este plan',
      see: 'Ver este plan',
      why: {
        personal: 'Hasta 5 personas con la plataforma completa. Si tus clientes necesitan la app, mira Personal + App.',
        app: 'Hasta 5 personas, y la app móvil para ti, tu equipo y tus clientes.',
        professional: 'Hasta 30 personas, con roles y permisos, tu marca y la app incluidos.',
        company: 'Sin techo de usuarios y con permisos por departamento.'
      }
    },
    en: {
      people: n => (n >= 60 ? '60 or more people' : n === 1 ? 'Just you' : `${n} people`),
      per: (p, n) => n >= 60 ? 'Unlimited users: the price stays the same as you add people.' : `Works out to $${(p / n).toFixed(2)} per person a month.`,
      here: "You're viewing this plan",
      see: 'See this plan',
      why: {
        personal: 'Up to 5 people with the complete platform. If your clients need the app, look at Personal + App.',
        app: 'Up to 5 people, plus the mobile app for you, your team and your clients.',
        professional: 'Up to 30 people, with roles and permissions, your brand and the app included.',
        company: 'No user ceiling, with permissions by department.'
      }
    }
  };

  /* ---------- language ---------- */
  const setLang = l => {
    lang = l;
    document.documentElement.lang = l;
    $$('[data-en]').forEach(el => {
      if (el.dataset.es === undefined) el.dataset.es = el.innerHTML;
      el.innerHTML = l === 'en' ? el.dataset.en : el.dataset.es;
    });
    $$('[data-en-label]').forEach(el => {
      if (el.dataset.esLabel === undefined) el.dataset.esLabel = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', l === 'en' ? el.dataset.enLabel : el.dataset.esLabel);
    });
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.id === l)));
    document.dispatchEvent(new Event('pf:lang'));
  };
  $$('.lang button').forEach(b => b.addEventListener('click', () => {
    setLang(b.id);
    const u = new URL(location.href);
    b.id === 'en' ? u.searchParams.set('lang', 'en') : u.searchParams.delete('lang');
    history.replaceState(null, '', u);
  }));
  if (new URLSearchParams(location.search).get('lang') === 'en') setLang('en');

  /* ---------- reveal, header, buy bar ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$('.rv').forEach(el => io.observe(el));

  const hdr = $('.hdr'), bar = $('.buybar'), hero = $('.hero'), fin = $('.final');
  let heroOut = false, finIn = false;
  const syncBar = () => bar && bar.classList.toggle('on', heroOut && !finIn);
  addEventListener('scroll', () => hdr.classList.toggle('scrolled', scrollY > 8), { passive: true });
  new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; syncBar(); }).observe(hero);
  if (fin) new IntersectionObserver(([e]) => { finIn = e.isIntersecting; syncBar(); }).observe(fin);

  const whenSeen = (el, fn) => {
    if (!el) return;
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); fn(); } }, { threshold: 0.35 }).observe(el);
  };

  /* ---------- hero: seats filling + floating cards ---------- */
  const seats = $('[data-seats]');
  if (seats) {
    const total = +seats.dataset.seats, shown = +seats.dataset.show || total;
    const colors = ['#d600fe', '#a20bfe', '#780bfe', '#4a14fe', '#2a1efe', '#c23bff', '#6d3cff', '#3d5bff'];
    const initials = 'AMCLDJRSVPNEGTBKFHOI';
    const row = seats.querySelector('.seat-row'), count = seats.querySelector('[data-count]');
    for (let i = 0; i < shown; i++) {
      const s = document.createElement('i');
      s.className = 'seat';
      s.textContent = initials[i % initials.length];
      s.style.background = colors[i % colors.length];
      row.appendChild(s);
    }
    const dots = $$('.seat', row);
    const target = +seats.dataset.fill || shown;
    let n = 0;
    const tick = () => {
      if (n < target) {
        dots[n].classList.add('on');
        n++;
        if (count) count.textContent = seats.dataset.unlimited && n === target ? '∞' : n;
        setTimeout(tick, reduce ? 0 : Math.max(60, 420 - n * 18));
      }
    };
    whenSeen(seats, tick);
  }
  const floats = $$('.float');
  if (floats.length) {
    let k = 0;
    const show = () => {
      floats.forEach((f, i) => f.classList.toggle('on', reduce || i <= k));
      k = (k + 1) % (floats.length + 2);
      if (!reduce) setTimeout(show, k === 0 ? 900 : 1700);
    };
    setTimeout(show, 900);
  }

  /* ---------- who-sees-what (professional) ---------- */
  $$('[data-roles]').forEach(box => {
    const chips = $$('.chip', box), recs = $$('[data-see]', box), say = $('.explain', box);
    const pick = chip => {
      chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
      const r = chip.dataset.role;
      recs.forEach(x => x.classList.toggle('off', !x.dataset.see.split(' ').includes(r)));
      if (say) say.innerHTML = lang === 'en' ? chip.dataset.sayEn : chip.dataset.say;
      const c = $('[data-visible]', box);
      if (c) c.textContent = recs.filter(x => !x.classList.contains('off')).length + ' / ' + recs.length;
    };
    chips.forEach(c => c.addEventListener('click', () => pick(c)));
    document.addEventListener('pf:lang', () => pick(chips.find(c => c.getAttribute('aria-pressed') === 'true') || chips[0]));
    pick(chips[0]);
  });

  /* ---------- departments (company) ---------- */
  $$('[data-depts]').forEach(box => {
    const chips = $$('.chip', box), cards = $$('.dept', box), say = $('.explain', box);
    const pick = chip => {
      chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
      const d = chip.dataset.dept;
      cards.forEach(c => {
        c.classList.toggle('on', d === 'all' || c.dataset.dept === d);
        c.classList.toggle('dim', d !== 'all' && c.dataset.dept !== d);
      });
      if (say) say.innerHTML = lang === 'en' ? chip.dataset.sayEn : chip.dataset.say;
    };
    chips.forEach(c => c.addEventListener('click', () => pick(c)));
    document.addEventListener('pf:lang', () => pick(chips.find(c => c.getAttribute('aria-pressed') === 'true') || chips[0]));
    pick(chips[0]);
    const range = $('input[type=range]', box), out = $('output', box);
    if (range) {
      const split = [0.34, 0.28, 0.22, 0.16];
      const upd = () => {
        const v = +range.value;
        range.style.setProperty('--p', ((v - range.min) / (range.max - range.min)) * 100 + '%');
        out.textContent = v;
        cards.forEach((c, i) => { const n = c.querySelector('[data-n]'); if (n) n.textContent = Math.max(1, Math.round(v * split[i])); });
      };
      range.addEventListener('input', upd);
      upd();
    }
  });

  /* ---------- booking (personal) ---------- */
  $$('[data-booking]').forEach(box => {
    const slots = $$('.slot:not(.full)', box), list = $('.agenda .evs', box), toast = $('.toast', box);
    let added = null;
    const book = s => {
      slots.forEach(x => x.setAttribute('aria-pressed', String(x === s)));
      if (added) added.remove();
      added = document.createElement('div');
      added.className = 'ev new';
      added.innerHTML = `<i></i><div><b>${s.textContent} · ${lang === 'en' ? 'Andrea R.' : 'Andrea R.'}</b><small>${lang === 'en' ? 'Booked from your link · paid' : 'Reservó desde tu enlace · pagado'}</small></div>`;
      const evs = $$('.ev', list);
      const after = evs.find(e => e.dataset.t > s.dataset.t);
      list.insertBefore(added, after || null);
      toast.classList.remove('on'); void toast.offsetWidth; toast.classList.add('on');
    };
    slots.forEach(s => s.addEventListener('click', () => book(s)));
    whenSeen(box, () => setTimeout(() => !added && book(slots[1]), 900));
  });

  /* ---------- two phones (app) ---------- */
  $$('[data-phones]').forEach(box => {
    const btns = $$('.client .cls button', box), push = $('.me .push', box), meList = $('.me .evs', box);
    const left = $('[data-left]', box), barI = $('.client .pk .bar i', box), kpi = $('[data-kpi]', box);
    let classes = +left.textContent;
    const reserve = b => {
      if (b.disabled) return;
      b.disabled = true;
      b.textContent = lang === 'en' ? 'Booked ✓' : 'Reservada ✓';
      classes = Math.max(0, classes - 1);
      left.textContent = classes;
      barI.style.width = (classes / 8) * 100 + '%';
      kpi.textContent = +kpi.textContent + 1;
      const row = document.createElement('div');
      row.className = 'cls';
      row.style.animation = 'pop .6s cubic-bezier(.3,1.6,.5,1)';
      row.innerHTML = `<div><b>${b.dataset.c}</b><small>${lang === 'en' ? 'Andrea R. just booked' : 'Andrea R. acaba de reservar'}</small></div>`;
      meList.prepend(row);
      push.querySelector('[data-msg]').textContent = (lang === 'en' ? 'New booking: ' : 'Nueva reserva: ') + b.dataset.c;
      push.classList.add('on');
      setTimeout(() => push.classList.remove('on'), 2600);
    };
    btns.forEach(b => b.addEventListener('click', () => reserve(b)));
    whenSeen(box, () => setTimeout(() => reserve(btns[0]), 1100));
  });

  /* ---------- plan finder ---------- */
  const finder = $('[data-finder]');
  if (finder) {
    const range = $('input[type=range]', finder), app = $('input[type=checkbox]', finder);
    const ppl = $('[data-people]', finder), name = $('[data-pname]', finder), price = $('[data-pprice]', finder);
    const why = $('[data-why]', finder), per = $('[data-per]', finder), act = $('[data-act]', finder);
    const cols = $$('[data-col]');
    const pickPlan = (n, a) => (n <= 5 ? (a ? 'app' : 'personal') : n <= 30 ? 'professional' : 'company');
    const upd = () => {
      const n = +range.value, k = pickPlan(n, app.checked), p = PLANS[k], t = T[lang];
      range.style.setProperty('--p', ((n - 1) / 59) * 100 + '%');
      ppl.textContent = n >= 60 ? '60+' : n;
      $('[data-ppl-l]', finder).textContent = t.people(n);
      name.textContent = p.name;
      price.textContent = '$' + p.price;
      why.textContent = t.why[k];
      per.textContent = t.per(p.price, n);
      act.innerHTML = k === page ? `<span class="here">✓ ${t.here}</span>` : `<a class="btn sm" href="${p.url}${lang === 'en' ? '?lang=en' : ''}">${t.see} →</a>`;
      cols.forEach(c => c.classList.toggle('hl', c.dataset.col === k));
    };
    range.addEventListener('input', upd);
    app.addEventListener('change', upd);
    document.addEventListener('pf:lang', upd);
    upd();
  }
})();
