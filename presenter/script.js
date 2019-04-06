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
    div: document.querySelector('section.playlist'),
    cmdClear: document.querySelector('.clear'),
    cmdLoad: document.querySelector('.load'),
    cmdSave: document.querySelector('.save'),
    list: document.querySelector('.list'),
    play: document.querySelector('.play'),

    add(hymn) {
      const h = document.createElement('li');
      h.dataset.slides = '';
      h.dataset.path = hymn.path;
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

    getListOfSlides() {
      const list = [];
      for (const hymn of this.list.children) {
        for (const slide of hymn.dataset.slides.split(',')) {
          list.push(slide);
        }
      }

      return list;
    },

    getListOfHymns() {
      const list = [];
      for (const hymn of this.list.children) {
        list.push(hymn.dataset.path);
      }

      return list;
    },

    isDownloading() {
      return this.list.querySelectorAll('.downloading').length > 0;
    },
    hasFailed() {
      return this.list.querySelectorAll('.error').length > 0;
    },

    clear() {
      this.list.innerHTML = '';
    },

    hide() { this.div.style.display = 'none'; },
    show() { this.div.style.display = 'block'; },
  };

  const slides = {
    win: null,

    start(img) {
      if (this.win) {
        this.setImg(img);
        this.show();
      } else {
        this.win = window.open('./slides.html', 'himnario slides', 'menubar=no');
        this.win.addEventListener('DOMContentLoaded', () => {
          this.setImg(img);
          this.show();
          this.win.addEventListener('unload', () => { this.win = null; });
        });
      }
    },

    setImg(img) {
      // Preload image to prevent flicker - setting 'src' starts the preload
      const preload = new Image();
      preload.onload = () => {
        this.win.document.querySelector('.slides .img').style.backgroundImage = `url(${img})`;
      };
      preload.src = img;
    },

    hide() { this.win.document.querySelector('.slides .img').classList.add('hidden'); },
    show() { this.win.document.querySelector('.slides .img').classList.remove('hidden'); },
    clear() {
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
    success: function error(msg, timeout = 10000) {
      if (this.isDuplicate(msg)) return;
      const n = document.createElement('div');
      n.setAttribute('class', 'notification');
      n.innerHTML = `<span class="msg">${msg}</span>`;
      this.alerts.appendChild(n);
      setTimeout(() => n.classList.add('is-success'), 50); // delay needed to render animation
      setTimeout(() => n.classList.remove('is-success'), timeout);
      setTimeout(() => n.remove(), timeout + 400);
    },

    isDuplicate: function isDuplicate(msg) {
      for (const { childNodes } of this.alerts.childNodes) {
        if (childNodes[0].innerHTML === msg) return true;
      }
      return false;
    },
  };

  const saveModal = {
    div: document.querySelector('#save-playlist'),
    close: document.querySelector('#save-playlist .close'),
    form: document.querySelector('#save-playlist form'),
    input: document.querySelector('#save-playlist input'),
    playlists: document.querySelector('#save-playlist ul.playlists'),
    listOfHymns: document.querySelector('#load-playlist ul.playlists ul.hymns'),
    remove: document.querySelector('#save-playlist remove'),

    prepare: function prepare(list) {
      let html = '';
      for (const p of list) {
        html += `
          <li>
            <div class="toggle">+</div>
            <div class="name">${p.name}</div>
            <div class="remove">remove</div>
            <ul class="hymns">${p.paths.map(el => `<li>${el}</li>`).join('')}</ul>
          </li>
        `;
      }
      this.playlists.innerHTML = html;
    },
    toggleList: function toggle() {
      if (this.listOfHymns.classList.contains('visible')) {
        this.listOfHymns.classList.remove('visible');
      } else {
        this.listOfHymns.classList.add('visible');
      }
    },
    show: function show(list) {
      this.prepare(list);
      this.div.classList.add('active');
      this.input.focus();
      this.div.parentNode.classList.add('noscroll');
    },
    hide: function hide() {
      this.div.classList.remove('active');
      this.div.parentNode.classList.remove('noscroll');
    },
    clear: function clear() {
      this.input.form.reset();
      this.hide();
    },
  };

  const loadModal = {
    div: document.querySelector('#load-playlist'),
    close: document.querySelector('#load-playlist .close'),
    playlists: document.querySelector('#load-playlist ul.playlists'),
    listOfHymns: document.querySelector('#load-playlist ul.playlists ul.hymns'),

    prepare: function prepare(list) {
      let html = '';
      for (const p of list) {
        html += `
          <li>
            <div class="remove">remove</div>
            <div class="toggle">+</div>
            <div class="name">${p.name}</div>
            <ul class="hymns">${p.paths.map(el => `<li>${el}</li>`).join('')}</ul>
          </li>
        `;
      }
      this.playlists.innerHTML = html;
    },

    toggleList: function toggle() {
      if (this.listOfHymns.classList.contains('visible')) {
        this.listOfHymns.classList.remove('visible');
      } else {
        this.listOfHymns.classList.add('visible');
      }
    },
    show: function show(list) {
      this.prepare(list);
      this.div.classList.add('active');
      this.div.parentNode.classList.add('noscroll');
    },
    hide: function hide() {
      this.div.classList.remove('active');
      this.div.parentNode.classList.remove('noscroll');
    },
    clear: function clear() {
      this.input.form.reset();
      this.hide();
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
    saveModal,
    loadModal,
  };
}());


// -------------- CONTROLLER MODULE --------------
// eslint-disable-next-line no-unused-vars
const Controller = (function IIFE(ui) {
  const state = {
    endpoint: '../slides',
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
  ui.playlist.cmdLoad.addEventListener('click', showLoadModal);
  ui.playlist.cmdSave.addEventListener('click', showSaveModal);
  ui.playlist.list.addEventListener('click', removeFromPlaylist);
  ui.playlist.play.addEventListener('click', startSlideshow);
  ui.loadModal.div.addEventListener('click', handleLoadModalClick);
  ui.saveModal.div.addEventListener('click', handleSaveModalClick);
  ui.saveModal.form.addEventListener('submit', savePlaylist);
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

    if (ui.playlist.list.children.length >= 15) {
      ui.alert.error('Only 15 hymns allowed. Solo 15 himnos permitido.');
      return;
    }

    const li = ui.playlist.add({ path: e.target.dataset.path });
    const imgDiv = li.querySelector('.img');
    try {
      const slides = await downloadSlides(state.hymns[e.target.dataset.index]);
      li.dataset.slides = slides;
      imgDiv.style.backgroundImage = `url(${slides[0]})`;
    } catch (err) {
      ui.alert.error('Failed to download slides!');
      imgDiv.classList.add('error');
    }
    imgDiv.classList.remove('downloading');
    ui.hymnSearch.input.focus();
  }

  function clearPlaylist() {
    ui.playlist.clear();
  }

  function removeFromPlaylist(e) {
    if (!e.target.classList.contains('remove')) return;
    ui.playlist.delete(e.target.parentNode);
  }

  function startSlideshow() {
    if (ui.playlist.isDownloading()) {
      ui.alert.error('Please wait for playlist to finish downloading.', 4000);
      return;
    }
    if (ui.playlist.hasFailed()) {
      ui.alert.error('Please remove failed hymns.', 4000);
      return;
    }

    const list = ui.playlist.getListOfSlides();
    if (list.length < 1) {
      ui.alert.error('You must select a hymn.', 6000);
      return;
    }

    state.slides = list;
    ui.slides.start(state.slides[0]);
    state.playing = true;
  }

  function endSlideshow() {
    ui.hymnSearch.clear();
    ui.slides.clear();
    ui.playlist.clear();
    state.slides = [];
    state.playing = false;
    state.current = 0;
  }

  function controls(e) {
    if (!state.playing) return;
    if (state.current < state.slides.length - 1 && (e.keyCode === 32 || e.keyCode === 39)) {
      // if (state.current >= state.slides.length - 1) endSlideshow();
      ui.slides.setImg(state.slides[++state.current]);
    } else if (e.keyCode === 37 && state.current > 0) {
      ui.slides.setImg(state.slides[--state.current]);
    } else if (e.keyCode === 27) {
      endSlideshow();
    }
  }

  function showLoadModal() {
    const playlists = getAllLocalStorage();
    if (playlists.length < 1) {
      ui.alert.error('No playlists found.', 4000);
      return;
    }
    ui.loadModal.show(playlists);
  }

  function showSaveModal() {
    if (ui.playlist.list.childNodes.length < 1) {
      ui.alert.error('Cannot save an empty playlist.', 4000);
      return;
    }
    const playlists = getAllLocalStorage();
    ui.saveModal.show(playlists);
  }

  // CODE SMELL! - CONTROLLER SHOULD NOT BE EDITING VIEW DIRECTLY
  // CODE SMELL! - DRY PRINCIPLE NOT ADHERED (LOAD AND SAVE MODALS TOO SIMILAR)
  function handleLoadModalClick(e) {
    if (e.target === ui.loadModal.div || e.target === ui.loadModal.close) {
      ui.loadModal.hide();
    }
    if (e.target.classList.contains('toggle')) {
      const hymns = e.target.parentNode.querySelector('ul.hymns');
      if (hymns.classList.contains('visible')) {
        hymns.classList.remove('visible');
      } else {
        hymns.classList.add('visible');
      }
    }
    if (e.target.classList.contains('name')) {
      loadPlaylist(e);
      ui.loadModal.hide();
    }
    if (e.target.classList.contains('remove')) {
      removeSavedPlaylist(e);
    }
  }

  // CODE SMELL! - CONTROLLER SHOULD NOT BE EDITING VIEW DIRECTLY
  // CODE SMELL! - DRY PRINCIPLE NOT ADHERED (LOAD AND SAVE MODALS TOO SIMILAR)
  function handleSaveModalClick(e) {
    if (e.target === ui.saveModal.div || e.target === ui.saveModal.close) {
      ui.saveModal.hide();
    }
    if (e.target.classList.contains('toggle')) {
      const hymns = e.target.parentNode.querySelector('ul.hymns');
      if (hymns.classList.contains('visible')) {
        hymns.classList.remove('visible');
      } else {
        hymns.classList.add('visible');
      }
    }
  }

  // CODE SMELL! - CONTROLLER SHOULD NOT BE EDITING VIEW DIRECTLY
  function removeSavedPlaylist(e) {
    localStorage.removeItem(e.target.parentNode.querySelector('.name').innerHTML);
    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
  }

  function savePlaylist(e) {
    e.preventDefault();
    const name = ui.saveModal.input.value;
    if (localStorage.getItem(name)) {
      ui.alert.error('A playlist with that name already exists. Please try another name.', 4000);
      return;
    }
    localStorage.setItem(name, ui.playlist.getListOfHymns().join('|||'));
    ui.alert.success('Playlist saved successfully');
    ui.saveModal.clear();
  }

  function loadPlaylist(e) {
    ui.playlist.clear();
    const saved = localStorage.getItem(e.target.innerHTML);
    if (!saved) {
      ui.alert.error('Could not load playlist. Please try again later.');
      return;
    }

    saved.split('|||').forEach((el) => {
      const temp = document.createElement('li');
      temp.dataset.path = el;
      temp.dataset.index = state.hymns.findIndex(h => h.path === el);
      addToPlaylist({ target: temp });
    });
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

  function getAllLocalStorage() {
    return Object.keys(localStorage)
      .map(key => ({ name: key, paths: localStorage.getItem(key).split('|||') }));
  }

  function unify(e) { return e.changedTouches ? e.changedTouches[0] : e; }

  /*------------------------
    Public Properties
  ------------------------*/
  return {
    state,
  };
}(View));
