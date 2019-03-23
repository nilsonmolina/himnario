const path = require('path');
const fs = require('fs');

const directory = path.join(__dirname, '../slides/lyrics');
const hymns = [];

fs.readdir(directory, (err, files) => {
  if (err) return console.log(`Unable to scan directory: ${err}`);

  files.forEach((file) => {
    const images = fs.readdirSync(path.join(directory, '/', file));
    hymns.push({ path: file, count: images.length });
  });

  return fs.writeFileSync(path.join(directory, '../_lyrics.json'), JSON.stringify(hymns));
});
