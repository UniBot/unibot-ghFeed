/**
 * Plugin dependencies.
 *
 * @type {exports}
 */
var FeedParser = require('feedparser');
var request = require('request');
var moment = require('moment');
var _ = require('lodash');

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

                var req = request('https://github.com/' + username + '.atom');
                var feedparser = new FeedParser();

                req.on('error', function onError(error) {
                    channel.say('Oh noes error with request - ' + error, from);
                });

                req.on('response', function onResponse(response) {
                    var stream = this;

                    if (response.statusCode != 200) {
                        return this.emit('error', new Error('Bad status code'));
                    }

                    stream.pipe(feedparser);
                });

                feedparser.on('error', function onError(error) {
                    channel.say('Oh noes error with FeedParser - ' + error, from);
                });

                var i = 0;

                feedparser.on('readable', function() {
                    var stream = this
                        , meta = this.meta
                        , item;

                    while (item = stream.read()) {
                        if (i < itemCount) {
                            var message = '${timeAgo}: ${item.title} - ${item.link}';
                            var templateVars = {
                                item: item,
                                formattedDate: moment(item.date).format('dd'),
                                timeAgo: moment(item.date).fromNow()
                            };

                            channel.say(_.template(message, templateVars));
                        } else if (i === itemCount) {
                            stream.emit('end');
                        }

                        i++;
                    }
                });
            }
        };
    };
};
