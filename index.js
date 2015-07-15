var TdfLive = require('./lib/tdf-live'),
    colors = require('colors'),
    minimist = require('minimist');

var args = minimist(process.argv.slice(2));

var options = {
  feedUrl: args.feedUrl || 'http://live.cyclingnews.com',
  pollUrl: args.pollUrl || 'http://live.cyclingnews.com/live/entries',
  replay: args.replay || false
}

var tdfLive = new TdfLive(options);

tdfLive.start(function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log("Live feed is done for today.  Check back tomorrow!".blue);
  process.exit(0);
});
