/**
 * Plugin dependencies.
 *
 * @type {exports}
 */
var FeedParser = require('feedparser');
var request = require('request');

/**
 * GitHub user activity feed plugin for UniBot
 *
 * @param  {Object} options Plugin options object, description below.
 *   db: {mongoose} the mongodb connection
 *   bot: {irc} the irc bot
 *   web: {connect} a connect + connect-rest webserver
 *   config: {object} UniBot configuration
 *
 * @return  {Function}  Init function to access shared resources
 */
module.exports = function init(options) {
    return function plugin(channel) {
        // Plugin regexp
        return {
            "!ghFeed(?: (\\S+))?(?: (\\d+))?$": function onMatch(from, matches) {
                var username = from;
                var itemCount = 1;

                if (matches[2]) {
                    username = matches[1];
                    itemCount = matches[2];
                } else if (matches[1]) {
                    username = matches[1];
                }

                // console.log(username, itemCount);

                var req = request('https://github.com/' + username + '.atom');
                var feedparser = new FeedParser();

                req.on('error', function onError(error) {
                    channel.say(from, 'Oh noes error with request - ' + error);
                });

                req.on('response', function onResponse(response) {
                    var stream = this;

                    if (res.statusCode != 200) {
                        return this.emit('error', new Error('Bad status code'));
                    }

                    stream.pipe(feedparser);
                });

                feedparser.on('error', function onError(error) {
                    channel.say(from, 'Oh noes error with FeedParser - ' + error);
                });

                feedparser.on('readable', function() {
                    // This is where the action is!
                    var stream = this
                        , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
                        , item;

                    while (item = stream.read()) {
                        console.log(item);
                    }
                });
            }
        };
    };
};
