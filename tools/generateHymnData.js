const path = require('path');
const fs = require('fs');

const directory = path.join(__dirname, '../slides/lyrics');
const hymns = [];


// ----- HYMN DATA WITH PATHS (LARGER, SAFER)
fs.readdir(directory, (err, files) => {
  if (err) return console.log(`Unable to scan directory: ${err}`);

  files.forEach((file) => {
    const slides = fs.readdirSync(path.join(directory, '/', file));
    hymns.push({ path: file, slides });
  });

  return fs.writeFileSync(path.join(directory, '../lyrics.json'), JSON.stringify(hymns));
});
