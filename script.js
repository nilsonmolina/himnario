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
    list: document.querySelector('.list'),
    remove: document.querySelectorAll('.remove'),
    play: document.querySelector('.play'),

    add(hymn) {
      const html = `
        <li data-path="${hymn.path}" data-index="${hymn.index}">
          <span class="remove">x</span>
          ${hymn.path}
        </li>`;
      this.list.innerHTML += html;
      // this.show();
    },

    delete(hymn) {
      this.list.removeChild(hymn);
      // if (!this.list.children.length) this.hide();
    },

    getList() {
      const list = [];
      for (const hymn of this.list.children) {
        list.push({ path: hymn.dataset.path, index: hymn.dataset.index });
      }
      return list;
    },

    clear() {
      this.list.innerHTML = '';
      // this.hide();
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

  /*------------------------
    Init
  ------------------------*/
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
    if (ui.playlist.getList().length < 15) {
      ui.playlist.add({ path: e.target.dataset.path, index: e.target.dataset.index });
    } else {
      alert('Only 15 hymns allowed. Solo 15 himnos permitido.)');
    }
    ui.hymnSearch.clear();
    ui.hymnSearch.input.focus();
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
    return arr.reduce((acc, curr, index) => {
      const regex = new RegExp(wordToMatch, 'gi');
      if (curr.path.match(regex)) acc.push({ index, path: curr.path });
      return acc;
    }, []);
  }

  function downloadSlides(hymns) {
    const baseURL = `${state.endpoint}/lyrics`;
    const urls = [];
    for (const hymn of hymns) {
      for (const slide of state.hymns[hymn.index].slides) {
        urls.push(`${baseURL}/${hymn.path}/${slide}`);
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
    ui.slides.clear();
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
