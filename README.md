# Himnario Adventista
**Date Started:** 03/22/2019  
**Site:** [http://www.himnario.ml](http://www.himnario.ml)  

This project was created to solve a problem that the Hollywood SDA church was having with their hymns software.  I was able to take the assets from that program and create a web app that not only had more features, but was better suited to their needs. 

One requirement was to have this site run without the need of any backend servers. This proved to be an interesting challenge. The first issue was that there were far too many images to just load them all in. Because I could only run client-side code, it was not possible to navigate the directory of images.  I decided to write a simple "tool" that would create a json file with the names of all the hymns as well as a count of how many slides each hymn has. I ran this tool and deployed the site with the json file already created.  Once the site loads, it fetches this json data. The user then selects the hymns they want, and when they hit "play", a request for every image of every hymn is made.

This entire site was created using vanilla HTML/CSS/JS, without the need for any frameworks, libraries, and/or packages.


## Presenter Mode
**Site:** [http://www.himnario.ml/presenter/](http://www.himnario.ml/presenter/)  
A requested feature was to have the slides play on a new window. I was able to implement this fairly easily by utilizing the `window.open` function. I then refactored all my slide html elements to a new html page and by storing the new window in a variable, I could just apply the existing code on that new window.
