# cyclingnews-tdf-live
The Cyclingnews Tour de France live coverage (http://live.cyclingnews.com/) is awesome.  I am also a developer,
spend most of my time in a terminal, and I love CLI tools.

So this is a little CLI client to pull the Cyclingnews live coverage feed into a terminal window.

## Requirements

- [NodeJS](https://nodejs.org/)

## Installation
```bash
$ git clone https://github.com/leightonshank/cyclingnews-tdf-live.git
$ cd cyclingnews-tdf-live
$ npm install
$ bin/tdflive
```

## Usage
```bash
$ bin/tdflive [--replay]
```

### --replay
Use the `--replay` argument to replay the stage live, from the beginning.  It's kinda like Tivo(tm).
Starting with the first update, each entry will be displayed as it happened, being delayed by the
appropriate time amount.  So if 5 minutes passed between the first and second updates, then the
replay too will elapse 5 minutes between showing the two updates.

While replaying, you can press <kbd>f</kbd to fast-forward to the next update.

### Keystrokes
The following keystokes are recognized:

- <kbd>f</kbd> Fast-foward while replaying a stage
- <kbd>s</kbd> Display the current status - # of updates in the backlog, timestamp of the latest entry,
  whether or not the stage is complete.
- <kbd>d</kbd> Display the distance remaining
- <kbd>q</kbd> Quit

<kbd>ctrl-c</kbd> will also exit the program.

## Credits
Thanks to [Cyclingnews](http://www.cyclingnews.com/) for their awesome live coverage!
