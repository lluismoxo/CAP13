/* CAP — sober monochrome scenes (no deps, no emoji, no invented figures) */
(function () {
  var CSS = [
    '@keyframes cap-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '@keyframes cap-scan{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}',
    '.cap-scene *{box-sizing:border-box}'
  ].join('');
  if (!document.getElementById('cap-scene-css')) {
    var st = document.createElement('style');
    st.id = 'cap-scene-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  function d(s, h) { var n = document.createElement('div'); n.style.cssText = s || ''; if (h != null) n.innerHTML = h; return n; }
  var mono = 'ui-monospace,SFMono-Regular,Menlo,monospace';
  var scenes = {};

  /* ---------- 1. Where the money goes (dark) ---------- */
  scenes.value = function (root) {
    root.style.cssText += ';position:relative;pointer-events:auto;min-height:420px;display:flex;align-items:center;justify-content:center';
    var wrap = d('width:100%;max-width:940px;display:grid;grid-template-columns:1fr 1fr;gap:56px');
    var cols = [
      {
        t: 'Traditional consulting',
        rows: [
          ['Partner oversight', .82, 0, 'Senior names on the invoice, rarely on the work.'],
          ['Account management', .68, 0, 'A layer that forwards your questions.'],
          ['Discovery deck', .74, 0, 'Slides that describe the problem you already knew.'],
          ['Fixed retainer', .6, 0, 'Billed whether or not anything shipped.'],
          ['Actual delivery', .3, 1, 'What you were trying to buy in the first place.']
        ]
      },
      {
        t: 'With CAP',
        rows: [
          ['Scoping session', .34, 1, 'One conversation with the person who will build it.'],
          ['Actual delivery', .92, 1, 'Nearly everything you pay for is the work itself.'],
          ['Transparent quote', .46, 1, 'Priced before we start, no moving targets.']
        ]
      }
    ];
    var caption = { textContent: '' };
    cols.forEach(function (c) {
      var col = d('display:flex;flex-direction:column;gap:22px');
      col.appendChild(d('font-family:' + mono + ';font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45);padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.14)', c.t));
      c.rows.forEach(function (r, i) {
        var row = d('display:flex;flex-direction:column;gap:9px;cursor:default');
        var lab = d('display:flex;justify-content:space-between;font-size:14px;color:' + (r[2] ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.42)') + ';transition:color .2s', '<span>' + r[0] + '</span>');
        var barBg = d('position:relative;height:6px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden');
        var bar = d('position:absolute;left:0;top:0;bottom:0;width:0;border-radius:3px;background:' + (r[2] ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.26)') + ';transition:width .9s cubic-bezier(.4,0,.2,1) ' + (i * .08) + 's,background .2s');
        barBg.appendChild(bar);
        row.appendChild(lab); row.appendChild(barBg);
        row.addEventListener('mouseenter', function () {
          caption.textContent = r[3];
          lab.style.color = '#fff';
          bar.style.background = '#fff';
        });
        row.addEventListener('mouseleave', function () {
          lab.style.color = r[2] ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.42)';
          bar.style.background = r[2] ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.26)';
        });
        col.appendChild(row);
        setTimeout(function () { bar.style.width = (r[1] * 100) + '%'; }, 120);
      });
      wrap.appendChild(col);
    });
    root.appendChild(wrap);
  };

  /* ---------- 2. Two ways to run the same project (light) ---------- */
  scenes.speed = function (root) {
    var ink = '15,21,18';
    root.style.cssText += ';position:relative;pointer-events:auto;min-height:290px;display:flex;flex-direction:column;justify-content:center;gap:40px;padding:0 2%';
    var lanes = [
      { t: 'The usual way', dur: 22, steps: ['Brief', 'Workshop', 'Deck', 'Approval', 'Kick-off'], end: 'Still preparing' },
      { t: 'The way we work', dur: 6, steps: ['Scoping', 'First version', 'In your hands'], end: 'Running' }
    ];
    var built = lanes.map(function (o, i) {
      var row = d('display:grid;grid-template-columns:180px 1fr;gap:28px;align-items:center');
      row.appendChild(d('font-size:15px;color:rgba(' + ink + ',' + (i ? '.95' : '.5') + ')', o.t));
      var track = d('position:relative;height:74px;cursor:pointer');
      var line = d('position:absolute;left:0;right:0;top:36px;height:1px;background:rgba(' + ink + ',.16)');
      var prog = d('position:absolute;left:0;top:36px;height:1px;width:0;background:rgba(' + ink + ',' + (i ? '.9' : '.35') + ')');
      var head = d('position:absolute;top:31px;left:0;width:11px;height:11px;margin-left:-5px;border-radius:2px;background:rgba(' + ink + ',' + (i ? '.95' : '.4') + ');transform:rotate(45deg)');
      track.appendChild(line); track.appendChild(prog); track.appendChild(head);
      o.nodes = o.steps.map(function (s, k) {
        var x = (k + 1) / (o.steps.length + 1);
        var g = d('position:absolute;top:0;left:' + (x * 100) + '%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;transition:opacity .3s');
        g.style.opacity = .3;
        g.appendChild(d('font-family:' + mono + ';font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(' + ink + ',.7);white-space:nowrap', s));
        g.appendChild(d('width:1px;height:14px;background:rgba(' + ink + ',.3)'));
        track.appendChild(g); g.dataset.at = x; return g;
      });
      var endLab = d('position:absolute;top:48px;right:0;font-family:' + mono + ';font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(' + ink + ',.35);transition:color .3s', o.end);
      track.appendChild(endLab);
      track.addEventListener('mouseenter', function () { o.hold = true; });
      track.addEventListener('mouseleave', function () { o.hold = false; });
      track.addEventListener('click', function () { o.t = 0; o.nodes.forEach(function (n) { n.style.opacity = .3; }); endLab.style.color = 'rgba(' + ink + ',.35)'; });
      row.appendChild(track); root.appendChild(row);
      return { o: o, prog: prog, head: head, endLab: endLab };
    });
    var last = performance.now();
    (function frame(t) {
      var dt = Math.min(60, t - last) / 1000; last = t;
      built.forEach(function (b) {
        if (!b.o.hold) b.o.t = (b.o.t || 0) + dt;
        var p = Math.min(1, b.o.t / b.o.dur);
        b.prog.style.width = (p * 100) + '%';
        b.head.style.left = (p * 100) + '%';
        b.o.nodes.forEach(function (n) { if (p >= +n.dataset.at) n.style.opacity = 1; });
        if (p >= 1) b.endLab.style.color = 'rgba(' + ink + ',.9)';
        if (b.o.t > b.o.dur + 6) { b.o.t = 0; b.o.nodes.forEach(function (n) { n.style.opacity = .3; }); b.endLab.style.color = 'rgba(' + ink + ',.35)'; }
      });
      requestAnimationFrame(frame);
    })(last);
  };

  /* ---------- 3. One team, a different system each time (dark) ---------- */
  scenes.adapt = function (root) {
    root.style.cssText += ';position:relative;pointer-events:auto;min-height:360px;display:flex;flex-direction:column;gap:30px;justify-content:center';
    var biz = [
      { l: 'Retail', mods: ['Orders in one inbox', 'Stock alerts', 'Assistant on WhatsApp', 'Invoices filed on their own', 'Review requests', 'Sales summary each morning'] },
      { l: 'Restaurant', mods: ['Bookings without phone calls', 'Answers out of hours', 'Shift planning', 'Supplier orders', 'Reviews asked at the right moment', 'Covers at a glance'] },
      { l: 'Gym', mods: ['Trials followed up', 'Members at risk flagged', 'Class questions answered', 'Timetable changes pushed', 'Failed payments chased', 'Retention in one view'] },
      { l: 'Clinic', mods: ['Appointments without friction', 'Reminders before each visit', 'Records in one place', 'First questions triaged', 'Insurance paperwork', 'Occupancy per room'] },
      { l: 'Logistics', mods: ['Routes planned', 'Deliveries tracked', 'Clients updated', 'Proof of delivery filed', 'Incidents escalated', 'Fleet in one board'] }
    ];
    var tabs = d('display:flex;flex-wrap:wrap;gap:0;border-bottom:1px solid rgba(255,255,255,.12)');
    var grid = d('display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1)');
    root.appendChild(tabs); root.appendChild(grid);
    var timer, tabNodes = biz.map(function (b, i) {
      var t = d('padding:12px 20px;font-family:' + mono + ';font-size:11px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;color:rgba(255,255,255,.4);border-bottom:1px solid transparent;margin-bottom:-1px;transition:color .2s,border-color .2s', b.l);
      t.addEventListener('click', function () { set(i, true); });
      tabs.appendChild(t); return t;
    });
    function set(i, manual) {
      clearTimeout(timer);
      tabNodes.forEach(function (t, k) {
        t.style.color = k === i ? '#fff' : 'rgba(255,255,255,.4)';
        t.style.borderBottomColor = k === i ? '#fff' : 'transparent';
      });
      grid.innerHTML = '';
      biz[i].mods.forEach(function (m, k) {
        var c = d('background:#000;padding:22px 20px;min-height:96px;display:flex;flex-direction:column;justify-content:space-between;gap:14px;animation:cap-in .4s ' + (k * .05) + 's both;transition:background .2s',
          '<span style="font-family:' + mono + ';font-size:10px;letter-spacing:.12em;color:rgba(255,255,255,.3)">' + String(k + 1).padStart(2, '0') + '</span>' +
          '<span style="font-size:15px;line-height:1.35;color:rgba(255,255,255,.8)">' + m + '</span>');
        c.addEventListener('mouseenter', function () { c.style.background = 'rgba(255,255,255,.05)'; });
        c.addEventListener('mouseleave', function () { c.style.background = '#000'; });
        grid.appendChild(c);
      });
      timer = setTimeout(function () { set((i + 1) % biz.length); }, manual ? 10000 : 5600);
    }
    set(0);
  };

  /* ---------- 4. Disciplines (dark) ---------- */
  scenes.team = function (root) {
    root.style.cssText += ';position:relative;pointer-events:auto;min-height:380px;display:flex;align-items:center';
    var people = [
      { r: 'Software Systems', d: 'Software systems adapted and designed for your needs: workflows, assistants and integrations built on your own data and maintained once they are live.' },
      { r: 'Marketing', d: 'Positioning, content and outbound handled end to end, so the pipeline does not depend on who has time this week.' },
      { r: 'Operations', d: 'Processes mapped as they really happen, paperwork removed, and the day-to-day made predictable again.' },
      { r: 'Finance & data', d: 'Reporting that assembles itself, so decisions are made on numbers nobody had to chase.' }
    ];
    var wrap = d('display:grid;grid-template-columns:minmax(280px,1fr) minmax(280px,1.1fr);gap:60px;width:100%;align-items:center');
    var list = d('display:flex;flex-direction:column');
    var pane = d('font-size:18px;line-height:1.6;color:rgba(255,255,255,.65);max-width:460px;border-left:1px solid rgba(255,255,255,.14);padding-left:28px;min-height:120px;display:flex;align-items:center');
    wrap.appendChild(list); wrap.appendChild(pane); root.appendChild(wrap);

    var cur = -1, hold = false, t0 = 0, DUR = 5200;
    var rows = people.map(function (p, i) {
      var row = d('position:relative;padding:20px 0;border-top:' + (i ? '1px solid rgba(255,255,255,.1)' : 'none') + ';cursor:pointer');
      var lab = d('font-size:26px;letter-spacing:-.02em;color:rgba(255,255,255,.35);transition:color .3s,transform .3s', p.r);
      var bar = d('position:absolute;left:0;bottom:0;height:1px;width:0;background:#fff');
      row.appendChild(lab); row.appendChild(bar);
      row.addEventListener('click', function () { set(i); });
      row.addEventListener('mouseenter', function () { hold = true; lab.style.color = '#fff'; });
      row.addEventListener('mouseleave', function () { hold = false; if (cur !== i) lab.style.color = 'rgba(255,255,255,.35)'; });
      list.appendChild(row);
      return { lab: lab, bar: bar };
    });
    function set(i) {
      cur = i; t0 = performance.now();
      rows.forEach(function (o, k) {
        o.lab.style.color = k === i ? '#fff' : 'rgba(255,255,255,.35)';
        o.lab.style.transform = k === i ? 'translateX(6px)' : 'none';
        o.bar.style.width = '0';
      });
      pane.style.animation = 'none'; void pane.offsetWidth; pane.style.animation = 'cap-in .4s ease both';
      pane.textContent = people[i].d;
    }
    var last = performance.now();
    (function frame(t) {
      var dt = Math.min(60, t - last); last = t;
      if (cur < 0) set(0);
      if (hold) { t0 += dt; } else {
        var p = Math.min(1, (t - t0) / DUR);
        rows[cur].bar.style.width = (p * 100) + '%';
        if (p >= 1) set((cur + 1) % people.length);
      }
      requestAnimationFrame(frame);
    })(last);
  };

  function boot() {
    document.querySelectorAll('.cap-scene[data-scene]').forEach(function (el) {
      if (el.dataset.capReady) return;
      el.dataset.capReady = '1';
      var fn = scenes[el.dataset.scene];
      if (fn) fn(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
