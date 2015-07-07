var request = require('request')
  , colors = require('colors')
  , tdfLive = require('./lib/tdf-live');

// Get the main page, with all of the updates
request.get('http://live.cyclingnews.com', function(err, res, body) {
  // get out if we couldn't connect to the main page
  if (err || res.statusCode !== 200) {
    console.error("Unable to connect to the Cyclingnews live feed!");
    if (err) {
      console.error(err);
    }
    process.exit(1);
  }

  // parse feed and display
  tdfLive.parse(body).forEach(tdfLive.display);

  // if we're done then say bye and be done
  if (tdfLive.meta.complete) {
    console.log("Live feed is done for today.  Check back tomorrow!".blue);
    process.exit(1);
  }

  // if we're still going then make a request to the entries endpoint
  // and update whenever we get a response
  var poll = function() {
    return request.get('http://live.cyclingnews.com/live/entries')
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
            text: tdfLive.build(data.body),
            timestamp: tdfLive.timestamp(data.modified)
          };

          tdfLive.display(update);
          poll();
        });
      }
      else {
        // if we didn't get a 200 response (most likely a 500),
        // then just keep polling
        poll();
      }
    })
    .on('error', function(err) {
      // if we received an error just poll again
      poll();
    });
  };

  // start polling
  poll();
});
