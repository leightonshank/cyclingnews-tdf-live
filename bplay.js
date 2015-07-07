/*
 * Just messing with this 'blessed' package, trying see if we can make a
 * nice terminal ui for the live tdf feed
 *
 * Resources:
 * http://blog.nodejitsu.com/a-blessed-ui-for-jitsu/
 * https://github.com/chjj/blessed
 *
 */

var blessed = require('blessed')
  , colors = require('colors');

// Create screen object
var screen = blessed.screen({
  autoPadding: true,
  smartCSR: true
});

screen.title = 'my window title';

// create a title row
var title = blessed.text({
  top: 0,
  left: 0,
  width: '100%',
  height: 1,
  content: "{bold}Cyclingnews.com Live Tour de France Coverage{/bold}",
  tags: true,
  style: {
    bg: 'blue',
    fg: 'white'
  }
});

screen.append(title);

// Create a box
var box = blessed.Log({
  parent: screen,
  keys: true,
  vi: true,
  top: 2,
  left: 0,
  width: '100%',
  height: screen.height - 2,
  tags: true,
  style: {
    fg: 'grey',
  },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: '|',
    track: {
      bg: 'yellow',
    },
    style: {
      inverse: true
    }
  },
  scrollOnInput: false
});

// Append our box to the screen
screen.append(box);

// Create a progress bar
var progress = blessed.ProgressBar({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 1,
  content: '79km of 158.9km remaining in the stage',
  orientation: 'horizontal',
  filled: parseInt(((158.9 - 79)/158.9) * 100),
  style: {
    bar: {
      fg: 'white',
      bg: 'green'
    }
  }
});

// Append our progress bar
screen.append(progress);

// Quit on Escape, q, or Ctrl-C
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Focus our element
//scroll.focus();
box.focus();

// Render the screen
screen.render();

var update = "18:44:24 BST".yellow + "  Looking down the list of finishes, Rui Costa lost 51 seconds.\n"
           + "              Rolland, Kelderman, Pinot 3'23, and Dan Martin over five minutes\n"
           + "              after his crash.\n";

var n = 0;
setInterval(function() {
  //box.pushLine(update);
  box.add(n.toString());
  n++;
  screen.render();
}, 250);

/*
box.on('render', function() {
  box.scrollTo(box.getLines().length);
});
*/
