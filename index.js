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
 * GitHub user activity feed plugin for UniBot.
 *
 * @todo    Refactor regexp part of plugin
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
    var config = options.config;

    /**
     * Default plugin configuration. These can be override on your UniBot config.js file, just add 'ghFeed' section to
     * your plugin section.
     *
     * @type    {{
     *              messageCount: {
     *                  default: number,
     *                  threshold: number,
     *                  maximum: number
     *              },
     *              moment: {
     *                  locale: string,
     *                  format: string
     *              },
     *              messages: {
     *                  success: string,
     *                  errorThreshold: string
     *              }
     *          }}
     */
    var pluginConfig = {
        "messageCount": {
            "default": 1,
            "threshold": 2,
            "maximum": 5
        },
        "moment": {
            "locale": "",
            "format": "D.M.YYYY HH:mm:ss"
        },
        "messages": {
            "success": "${timeAgo} ${item.title} - ${item.link}",
            "errorThreshold": "You did try to fetch more feed items that is allowed!"
        }

    };

    // Merge configuration for plugin
    if (_.isObject(config.plugins) && _.isObject(config.plugins.ghFeed)) {
        pluginConfig = _.merge(pluginConfig, config.plugins.ghFeed);
    }

    // Set moment locale, if it's set
    if (pluginConfig.moment.locale) {
        moment.locale(pluginConfig.moment.locale);
    }

    // Actual GitHub Feed plugin implementation.
    return function plugin(channel) {
        // Plugin regexp
        return {
            "!ghFeed(?: (\\S+))?(?: (\\d+))?$": function onMatch(from, matches) {
                var username = from;
                var itemCount = pluginConfig.messageCount.default;

                if (matches[2]) {
                    username = matches[1];
                    itemCount = matches[2];
                } else if (matches[1]) {
                    username = matches[1];
                }

                if (itemCount > pluginConfig.messageCount.maximum) {
                    channel.say(pluginConfig.messages.errorThreshold, from);

                    return;
                }

                // Make new request and initialize FeedParser
                var req = request('https://github.com/' + username + '.atom');
                var feedparser = new FeedParser();

                // On request error send message to user
                req.on('error', function onError(error) {
                    channel.say('Oh noes error with request - ' + error, from);
                });

                // On request response pipe stream to FeedParser
                req.on('response', function onResponse(response) {
                    var stream = this;

                    // We didn't get HTTP 200, something is wrong
                    if (response.statusCode != 200) {
                        return this.emit('error', new Error('Bad status code'));
                    }

                    stream.pipe(feedparser);
                });

                // On FeedParser error send message to user
                feedparser.on('error', function onError(error) {
                    channel.say('Oh noes error with FeedParser - ' + error, from);
                });

                // Initialize counter
                var i = 0;
                var target = itemCount > pluginConfig.messageCount.threshold ? from : undefined;

                // On FeedParser result
                feedparser.on('readable', function iterator() {
                    var stream = this;
                    var item;

                    // Iterate each feed item
                    while (item = stream.read()) {
                        if (i < itemCount) {
                            var templateVars = {
                                item: item,
                                formattedDate: moment(item.date).format(pluginConfig.moment.format),
                                timeAgo: moment(item.date).fromNow()
                            };

                            channel.say(_.template(pluginConfig.messages.success, templateVars), target);
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
