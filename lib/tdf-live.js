var colors = require('colors')
  , cheerio = require('cheerio')
  , striptags = require('striptags')
  , moment = require('moment')
  , Entities = require('html-entities').Html5Entities;

var entities = new Entities();

// metadata container
exports.meta = {};

// function to build a text update string out of the HTML update body
exports.build = function(str, text) {
  if (!text) {
    text = '';
  }

  // we want just the text out of the HTML
  // but we also want to turn <br> tags into newlines
  // and we want the html special chars translated
  str = striptags(str, '<br>');
  str = str.replace(/<br>/g, '\n');
  str = str.replace(/\t/g, ' ');
  str = entities.decode(str);

  // split into chunks so lines don't exceed 80 chars
  // (there is a 14 char space at the beginning that has the timestamp)

  // add a period to the end of a line that ends with a word character
  // (i.e. letter or number).  This is because the regexp that we use
  // to split the string tries to split it on a boundary by looking for
  // a space or punctuation
  if (/\w$/.test(str)) {
    str = str + '.';
  }

  var chunks = str.match(/.{1,65}[ \.,\?\!:;)\]\}>'"]/g);
  if (text.length) {
    text += '\n              ';
  }
  text += chunks.join('\n              ') + '\n';

  return text;
};

// function to display an update message
exports.display = function(update) {
  var meta = exports.meta;

  // build them message
  var msg = update.timestamp.yellow
          + '  '
          + update.text;

  if (update.distance) {
    var dist = '\n' + update.distance + meta.units + ' remain of '
             + meta.distance + meta.units + ' total\n';

    msg += dist.underline.green;
  }
  console.log(msg);
};


exports.parse = function(body) {
  var $ = cheerio.load(body)
    , liveReport = $('#liveReportConsolePreview')
    , meta = exports.meta;

  // pull some metadata from the feed container
  meta.timezone = liveReport.data('timezone');
  meta.offset = liveReport.data('timezoneOffset');

  // distance and unit metadata
  meta.distance = liveReport.data('distance');
  meta.units = liveReport.data('distanceUnits');

  // is the feed done?
  meta.complete = !!liveReport.data('complete');

  var updates = [];

  // now pull all of the past updates to get us to current time
  liveReport.children().each(function(i, element) {
    var data  = $(this).data('liveEntry')
      , entry = $(this).children().first()
      , timestamp = '', text = '';

    timestamp = entry.find('h3').text().trim()

    // skip twitter updates for now
    if (entry.attr('class') === 'none') {
      entry.find('.contents').children().filter(function() {
        // only process <p> tags that contain some content
        return $(this)[0].name === 'p' && $(this).text().trim();
      }).each(function(i, element) {
        text = exports.build($(this).html().trim(), text);
      });

      updates.push({
        distance: data.distance,
        timestamp: timestamp,
        text: text
      });
    }
  });

  return updates.reverse();
};

exports.timestamp = function(unixtime) {
  // so this is kinda dirty but I don't feel like messing with
  // timestamps.  so we know everything is based off of BST, which
  // is 1 hour ahead of UTC/GMT.  So we'll just manually hack that
  // offset
  var timestamp = moment.unix(unixtime).utc()
                  .add(1, 'hour')     // BST offset
                  .add(exports.meta.offset, 'seconds') // stage offset
                  .format('HH:mm:ss');
  return timestamp + ' ' + exports.meta.timezone;
};
