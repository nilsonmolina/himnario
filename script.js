/* eslint-env browser */

// -------------- VIEW MODULE --------------
const View = (function IIFE() {
  const hymnSearch = {
    div: document.querySelector('.search-box'),
    input: document.querySelector('#hymn-search'),
    suggestions: document.querySelector('#suggestions'),

    displayMatches(matches) {
      const html = matches
        .map(hymn => `
          <li data-path="${hymn.path}" data-index="${hymn.index}">
            ${hymn.path}
          </li>`)
        .join('');
      this.suggestions.innerHTML = html;
    },

    clear() {
      this.show();
      this.input.value = '';
      this.suggestions.innerHTML = '';
    },

    hide() { this.div.style.opacity = '0'; },
    show() { this.div.style.opacity = '1'; },
  };

  const playlist = {
    div: document.querySelector('.playlist'),
    cmdClear: document.querySelector('.clear'),
    cmdLoad: document.querySelector('.load'),
    cmdSave: document.querySelector('.save'),
    list: document.querySelector('.list'),
    play: document.querySelector('.play'),

    add(hymn) {
      const h = document.createElement('li');
      h.innerHTML = `
        <div class="img downloading"></div>
        <div class="details">
          <span class="number">Hymn ${hymn.path.split(' - ')[0]}</span>
          <span class="name">${hymn.path.split(' - ')[1]}</span>
        </div>
        <div class="remove">remove</div>`;
      this.list.appendChild(h);
      setTimeout(() => h.classList.add('hymn'), 50);
      return h;
    },

    delete(hymn) {
      hymn.classList.remove('hymn');
      setTimeout(() => this.list.removeChild(hymn), 400);
    },

    getList() {
      const list = [];
      for (const hymn of this.list.children) {
        for (const slide of hymn.dataset.slides.split(',')) {
          list.push(slide);
        }
      }

      return list;
    },

    isDownloading() {
      return this.list.querySelectorAll('.downloading').length > 0;
    },

    clear() {
      this.list.innerHTML = '';
    },

    hide() { this.div.style.display = 'none'; },
    show() { this.div.style.display = 'block'; },
  };

  const slides = {
    div: document.querySelector('.slides'),
    img: document.querySelector('.slides .img'),

    start(img) {
      this.setImg(img);
      this.show();
    },

    setImg(img) {
      // Preload image to prevent flicker - setting 'src' starts the preload
      const preload = new Image();
      preload.onload = () => { this.img.style.backgroundImage = `url(${img})`; };
      preload.src = img;
    },

    hide() { this.div.classList.add('hidden'); },
    show() { this.div.classList.remove('hidden'); },
    clear() {
      this.img.style.backgroundImage = '';
      this.hide();
    },
  };

  const alert = {
    alerts: document.querySelector('.alerts'),

    error: function error(msg, timeout = 10000) {
      if (this.isDuplicate(msg)) return;
      const n = document.createElement('div');
      n.setAttribute('class', 'notification');
      n.innerHTML = `<span class="msg">${msg}</span>`;
      this.alerts.appendChild(n);
      setTimeout(() => n.classList.add('is-danger'), 50); // delay needed to render animation
      setTimeout(() => n.classList.remove('is-danger'), timeout);
      setTimeout(() => n.remove(), timeout + 400);
    },

    isDuplicate: function isDuplicate(msg) {
      for (const { childNodes } of this.alerts.childNodes) {
        if (childNodes[0].innerHTML === msg) return true;
      }
      return false;
    },
  };

  /*------------------------
    Public Properties
  ------------------------*/
  return {
    hymnSearch,
    playlist,
    slides,
    alert,
  };
}());


// -------------- CONTROLLER MODULE --------------
// eslint-disable-next-line no-unused-vars
const Controller = (function IIFE(ui) {
  const state = {
    endpoint: './slides',
    hymns: [],
    slides: [],
    current: 0,
    playing: false,
    swipeX: false,
  };

  /*------------------------
    Init
  ------------------------*/
  fetch(`${state.endpoint}/lyrics.json`)
    .then(handleErrors)
    .then(response => response.json())
    .then(data => state.hymns.push(...data))
    .catch(() => ui.alert.error('Failed to get hymns data. Please try again later.', 100000));

  // eslint-disable-next-line no-undef, no-unused-vars
  const sortable = new Sortable(ui.playlist.list, {
    animation: 250,
    ghostClass: 'sortable-ghost',
  });

  /*------------------------
    Event Listeners
  ------------------------*/
  ui.hymnSearch.input.addEventListener('keyup', getMatches);
  ui.hymnSearch.suggestions.addEventListener('click', addToPlaylist);
  ui.playlist.cmdClear.addEventListener('click', clearPlaylist);
  ui.playlist.cmdLoad.addEventListener('click', loadPlaylists);
  ui.playlist.cmdSave.addEventListener('click', savePlaylist);
  ui.playlist.list.addEventListener('click', removeFromPlaylist);
  ui.playlist.play.addEventListener('click', generatePlaylist);
  document.addEventListener('keyup', controls);
  document.addEventListener('touchstart', swipeStart);
  document.addEventListener('touchend', swipeEnd);

  /*------------------------
    Event Listener Functions
  ------------------------*/
  function getMatches(e) {
    const matches = e.target.value ? findMatches(this.value, state.hymns) : [];
    ui.hymnSearch.displayMatches(matches);
  }

  async function addToPlaylist(e) {
    ui.hymnSearch.clear();

    if (ui.playlist.list.children.length > 15) {
      ui.alert.error('Only 15 hymns allowed. Solo 15 himnos permitido.');
      return;
    }

    try {
      const li = ui.playlist.add({ path: e.target.dataset.path });
      const imgDiv = li.querySelector('.img');
      const slides = await downloadSlides(state.hymns[e.target.dataset.index]);

      li.dataset.slides = slides;
      imgDiv.style.backgroundImage = `url(${slides[0]})`;
      imgDiv.classList.remove('downloading');

      ui.hymnSearch.input.focus();
    } catch (err) {
      ui.alert.error('Failed to download slides!');
    }
  }

  function clearPlaylist() {
    ui.playlist.clear();
  }

  function loadPlaylists() {
    if (!localStorage.getItem('playlists')) {
      ui.alert.error('No playlists found.', 4000);
    }
  }

  function savePlaylist() {
    if (ui.playlist.list.childNodes.length < 1) {
      ui.alert.error('Cannot save an empty playlist.', 4000);
    }
  }

  function removeFromPlaylist(e) {
    if (!e.target.classList.contains('remove')) return;
    ui.playlist.delete(e.target.parentNode);
  }

  async function generatePlaylist() {
    if (ui.playlist.isDownloading()) {
      ui.alert.error('Please wait for playlist to finish downloading.', 4000);
      return;
    }

    const list = ui.playlist.getList();
    if (list.length < 1) {
      ui.alert.error('You must select a hymn.', 6000);
      return;
    }

    state.slides = list;
    console.log(state.slides);
    ui.playlist.clear();
    ui.hymnSearch.hide();
    ui.slides.start(state.slides[0]);
    state.playing = true;
  }

  function controls(e) {
    if (!state.playing) return;
    if (e.keyCode === 32 || e.keyCode === 39) {
      if (state.current >= state.slides.length - 1) reset();
      else ui.slides.setImg(state.slides[++state.current]);
    } else if (e.keyCode === 37 && state.current > 0) {
      ui.slides.setImg(state.slides[--state.current]);
    }
  }

  function swipeStart(e) {
    if (!state.playing) return;
    state.swipeX = unify(e).clientX;
  }

  function swipeEnd(e) {
    if (!state.playing || state.swipeX === false) return;

    const direction = state.swipeX - unify(e).clientX;
    if (Math.abs(direction) < 35) return;

    if (direction > 0) controls({ keyCode: 39 });
    else controls({ keyCode: 37 });

    state.swipeX = false;
  }

  /*------------------------
    Helper Functions
  ------------------------*/
  function findMatches(wordToMatch, arr) {
    return arr.reduce((acc, curr, index) => {
      const regex = new RegExp(wordToMatch, 'gi');
      if (curr.path.match(regex)) acc.push({ index, path: curr.path });
      return acc;
    }, []);
  }

  async function downloadSlides(hymn) {
    const baseURL = `${state.endpoint}/lyrics`;
    const urls = [];
    for (const slide of hymn.slides) {
      urls.push(`${baseURL}/${hymn.path}/${slide}`);
    }

    return Promise.all(urls.map(url => fetch(url)
      .then(handleErrors)
      .then(response => response.blob())))
      .then(results => results.map(img => URL.createObjectURL(img)));
  }

  function handleErrors(response) {
    if (!response.ok) throw Error(response.statusText);
    return response;
  }

  function reset() {
    ui.hymnSearch.clear();
    ui.playlist.clear();
    ui.slides.clear();
    state.slides = [];
    state.playing = false;
    state.current = 0;
  }

  function unify(e) { return e.changedTouches ? e.changedTouches[0] : e; }

  /*------------------------
    Public Properties
  ------------------------*/
  return {
    state,
  };
}(View));
