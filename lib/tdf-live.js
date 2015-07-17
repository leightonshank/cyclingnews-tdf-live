var colors = require('colors'),
    request = require('request'),
    cheerio = require('cheerio'),
    striptags = require('striptags'),
    moment = require('moment'),
    Entities = require('html-entities').Html5Entities,
    debug = require('debug')('tdflive'),
    keypress = require('keypress');

var entities = new Entities();

exports = module.exports =  function TdfLive(options) {
  // constructor
  this.pollUrl = options.pollUrl;
  this.feedUrl = options.feedUrl;
  this.replay = options.replay || false;

  this.entries = [];
  this.polling = false;
  this.complete = false;

  this.units = 'km';
  this.distance = 0;
  this.timezone = 'BST';
  this.offset = 0;

};

var proto = exports.prototype;

proto.start = function(done) {
  var self = this,
      replayTimeout;

  var next = function() {
    // check for entries
    if (self.entries.length) {
      debug("has entries");
      // show next entry
      var entry = self.entries.shift();
      self.display(entry);
      if (self.replay && self.entries.length) {
        // delay the update by the amount of time between this update
        // and the next one
        var currentTime, nextTime, delay,
            timeFormat = 'HH:mm:ss';
        thisTime = moment(entry.timestamp.split(' ')[0], timeFormat);
        nextTime = moment(self.entries[0].timestamp.split(' ')[0], timeFormat);
        delay = nextTime.unix() - thisTime.unix();
        replayTimeout = setTimeout(next, delay * 1000);
      }
      else {
        next();
      }
    }
    else {
      debug("no entries");
      // did we finish?
      if (self.complete) {
        debug("feed is done");
        done();
      }
      else {
        process.nextTick(next);
      }
    }
  }

  // if we are in replay mode, setup listening for keypresses
  if (this.replay) {
    // make `process.stdin` start emitting "keypress" events
    keypress(process.stdin);

    process.stdin.on('keypress', function(ch, key) {
      // ctrl-c exits
      if (key && key.ctrl && key.name == 'c') {
        process.exit(0);
      }

      // reg keys
      switch(key.name) {
        case 'f': // fast-forward
          clearTimeout(replayTimeout);
          replayTimeout = null;
          process.nextTick(next); // keep it async
          break;
        case 'q': // quit
          process.exit(0);
      }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();
  }

  // Get the main page, with all of the updates
  request.get(this.feedUrl, function(err, res, body) {
    // get out if we couldn't connect to the main page
    if (err || res.statusCode !== 200) {
      if (err) {
        done(err);
      }
    }

    self.parse(body);
    process.nextTick(next);

    if (!self.complete) {
      self.poll();
    }
  });
};

// function to build a text update string out of the HTML update body
proto.build = function(str, text) {
  var self = this;
  text = text || '';

  if (str) {
    // we want just the text out of the HTML
    // but we also want to turn <br> tags into newlines
    // and we want the html special chars translated
    str = striptags(str, '<br>');
    str = str.replace(/<br( \/)?>/g, '\n');
    str = str.replace(/\t/g, ' ');
    str = entities.decode(str).trim();

    // split into chunks so lines don't exceed 80 chars
    // (there is a 14 char space at the beginning that has the timestamp)

    // add a newline to the end of a line that ends with a word character
    // (i.e. letter or number).  This is because the regexp that we use
    // to split the string tries to split it on a boundary by looking for
    // various punctuation or a newline.  The newline will get trimmed
    // anyway.
    if (/\w$/.test(str)) {
      str = str + '\n';
    }

    var chunks = str.match(/.{1,65}[ \.,\?\!:;)\]\}>'"\n]/g)
                    .map(function(chunk) { return chunk.trim() });

    // if this the nth line of a multi-line message then we need to indent
    // to account for the timestamp
    var indent = function() {
      var count = self.timestamp().length + 2
        , indent = '\n';
      while (count--) {
        indent += ' ';
      }
      return indent;
    };

    if (text.length) {
      text += indent();
    }
    text += chunks.join( indent() ) + '\n';
  }

  return text;
};

// function to display an update message
proto.display = function(update) {
  var self = this;

  // build them message
  var msg = update.timestamp.yellow
          + '  '
          + update.text;

  if (update.distance) {
    var dist = '\n' + update.distance + self.units + ' remain of '
             + self.distance + self.units + ' total\n';

    msg += dist.underline.green;
  }
  console.log(msg);
};


proto.parse = function(body) {
  var $ = cheerio.load(body)
    , liveReport = $('#liveReportConsolePreview')
    , self = this;

  // pull some metadata from the feed container
  self.timezone = liveReport.data('timezone');
  self.offset = liveReport.data('timezoneOffset');

  // distance and unit metadata
  self.distance = liveReport.data('distance');
  self.units = liveReport.data('distanceUnits');

  // is the feed done?
  self.complete = !!liveReport.data('complete');

  var updates = [];

  // now pull all of the past updates to get us to current time
  liveReport.children().each(function(i, element) {
    var data  = $(this).data('liveEntry')
      , entry = $(this).children().first()
      , timestamp = '', text = '';

    timestamp = entry.find('h3').text().trim()

    // entry.attr('class') contains a hint at the type of entry
    // These i've seen so far: none, twitter, quote

    entry.find('.contents').children().filter(function() {
      // only process <p> tags that contain some content
      return $(this)[0].name !== 'img' && $(this).text().trim();
    }).each(function(i, element) {
      text = self.build($(this).html().trim(), text);
    });

    updates.push({
      distance: data.distance,
      timestamp: timestamp,
      text: text
    });
  });

  self.entries = updates.reverse();
};

proto.timestamp = function(unixtime) {
  // default to the current time if one wasn't given
  unixtime = unixtime || (Date.now() / 1000);

  // so this is kinda dirty but I don't feel like messing with
  // timestamps.  so we know everything is based off of BST, which
  // is 1 hour ahead of UTC/GMT.  So we'll just manually hack that
  // offset
  var timestamp = moment.unix(unixtime).utc()
                  .add(1, 'hour')     // BST offset
                  .add(this.offset, 'seconds') // stage offset
                  .format('HH:mm:ss');
  return timestamp + ' ' + this.timezone;
};

proto.poll = function() {
  var self = this;

  this.polling = true;

  return request.get(self.pollUrl)
  .on('response', function(res) {
    if (res.statusCode == 200) {
      var body = '';
      res.on('data', function(chunk) {
        body += chunk;
      })
      .on('end', function() {
        var data = JSON.parse(body);
        var update = {
          distance: data.distance,
          text: self.build(data.body),
          timestamp: self.timestamp(data.modified)
        };

        self.entries.push(update);
        self.poll();
      });
    }
    else {
      // if we didn't get a 200 response (most likely a 500),
      // then just keep polling
      self.poll();
    }
  })
  .on('error', function(err) {
    // if we received an error just poll again
    self.poll();
  });
};
