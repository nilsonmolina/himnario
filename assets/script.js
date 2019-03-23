/* eslint-env browser */

// -------------- VIEW MODULE --------------
const View = (function IIFE() {
  const hymnSearch = {
    div: document.querySelector('.search'),
    input: document.querySelector('#searchInput'),
    suggestions: document.querySelector('#suggestions'),

    displayMatches(matches) {
      const html = matches
        .map(hymn => `
          <li data-path="${hymn.path}" data-count="${hymn.count}">
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
    list: document.querySelector('.list'),
    remove: document.querySelectorAll('.remove'),
    play: document.querySelector('.play'),

    add(hymn) {
      const html = `
        <li data-path="${hymn.path}" data-count="${hymn.count}">
          ${hymn.path}
          <span class="remove">x</span>
        </li>`;
      this.list.innerHTML += html;
      this.show();
    },

    delete(hymn) {
      this.list.removeChild(hymn);
      if (!this.list.children.length) this.hide();
    },

    getList() {
      const list = [];
      for (const hymn of this.list.children) {
        list.push({ path: hymn.dataset.path, count: hymn.dataset.count });
      }
      return list;
    },

    clear() {
      this.list.innerHTML = '';
      this.hide();
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
      this.img.style.backgroundImage = `url(${img})`;
    },

    hide() { this.div.style.opacity = '0'; },
    show() { this.div.style.opacity = '1'; },
  };

  /*------------------------
    Public Properties
  ------------------------*/
  return {
    hymnSearch,
    playlist,
    slides,
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
  };

  fetch(`${state.endpoint}/lyrics.json`)
    .then(response => response.json())
    .then(data => state.hymns.push(...data))
    .catch(err => console.log(`Error: ${err}`));

  /*------------------------
    Event Listeners
  ------------------------*/
  ui.hymnSearch.input.addEventListener('keyup', getMatches);
  ui.hymnSearch.suggestions.addEventListener('click', addToPlaylist);
  ui.playlist.div.addEventListener('click', removeFromPlaylist);
  ui.playlist.play.addEventListener('click', generatePlaylist);
  document.addEventListener('keyup', controls);

  /*------------------------
    Event Listener Functions
  ------------------------*/
  function getMatches(e) {
    const matches = e.target.value ? findMatches(this.value, state.hymns) : [];
    ui.hymnSearch.displayMatches(matches);
  }

  function addToPlaylist(e) {
    ui.playlist.add({ path: e.target.dataset.path, count: e.target.dataset.count });
    ui.hymnSearch.clear();
  }

  function removeFromPlaylist(e) {
    if (!e.target.classList.contains('remove')) return;
    ui.playlist.delete(e.target.parentNode);
  }

  async function generatePlaylist() {
    const list = ui.playlist.getList();
    await downloadSlides(list);
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

  /*------------------------
    Helper Functions
  ------------------------*/
  function findMatches(wordToMatch, arr) {
    return arr.filter((hymn) => {
      const regex = new RegExp(wordToMatch, 'gi');
      return hymn.path.match(regex) ? hymn : null;
    });
  }

  function downloadSlides(hymns) {
    const urls = [];
    for (const hymn of hymns) {
      const baseURL = `${state.endpoint}/lyrics/${hymn.path}`;
      for (let i = 1; i < hymn.count; i++) {
        urls.push(`${baseURL}/${Math.floor(i / 10)}${i % 10}.jpg`);
      }
    }

    return Promise.all(urls.map(url => fetch(url)
      .then(response => response.blob())
      .catch(err => console.log(`Error: ${err}`))))
      .then(results => results.forEach(img => state.slides.push(URL.createObjectURL(img))));
  }

  function reset() {
    ui.hymnSearch.clear();
    ui.playlist.clear();
    ui.slides.hide();
    state.slides = [];
    state.playing = false;
    state.current = 0;
  }

  /*------------------------
    Public Properties
  ------------------------*/
  return {
    state,
  };
}(View));
