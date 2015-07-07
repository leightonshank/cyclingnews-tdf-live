var blessed = require('blessed');

// Create screen object
var screen = blessed.screen({
  autoPadding: true,
  smartCSR: true
});

screen.title = 'my window title';

// Create a bok perfectly centered horizontally and vertically
var box = blessed.box({
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: 'Hello {bold}world{/bold}',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green',
    }
  }
});

// Append our box to the screen
screen.append(box);

// If our box is clicked, change the content
box.on('click', function(data) {
  box.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
  box.setLine(1, 'bar');
  box.insertLine(1, 'foo');
  screen.render();
});

// Quit on Escape, q, or Ctrl-C
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Focus our element
box.focus();

// Render the screen
screen.render();
