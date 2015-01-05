/**
 * Plugin dependencies.
 *
 * @type {exports}
 */
var FeedParser = require('feedparser');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var shorturl = require('shorturl');
var _ = require('lodash');

/**
 * GitHub user activity feed plugin for UniBot.
 *
 * @todo    Refactor regexp part of plugin
 * @todo    Add messages for req and feedparser errors
 * @todo    What else messages there can be on feed? Now this supports only commits and comments
 * @todo    Move default configuration to separated file.
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
     * Default plugin configuration. These can be override on your UniBot config.js file, just add "ghFeed" section to
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
     *                  errors: {
     *                      threshold: string,
     *                      request: string,
     *                      feedParser: string,
     *                      noItems: string
     *                  }
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
            "success": "${timeAgo} ${item.title} - ${messages} - ${shortUrl}",
            "errors": {
                "threshold": "You did try to fetch more feed items that is allowed! Maximum feed item count is ${config.messageCount.maximum}",
                "request": "Oh noes error with request - ${error}",
                "feedParser": "Oh noes error with FeedParser - ${error}",
                "noItems": "Sorry no GitHub public activity feed items for ${username} - ${url}"
            }
        }
    };

    // Merge configuration for plugin
    if (_.isObject(config.plugins) && _.isObject(config.plugins.ghFeed)) {
        pluginConfig = _.merge(pluginConfig, config.plugins.ghFeed);
    }

    // Set moment locale, if it"s set
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

                // Default template variables
                var templateVars = {
                    "url": "https://github.com/" + username + ".atom",
                    "nick": from,
                    "username": username,
                    "config": pluginConfig
                };

                // User did try to get more feed items that is allowed
                if (itemCount > pluginConfig.messageCount.maximum) {
                    channel.say(pluginConfig.messages.errors.threshold, from);

                    return;
                }

                // Make new request and initialize FeedParser
                var req = request(templateVars.url);
                var feedParser = new FeedParser();

                // On request error send message to user
                req.on("error", function onError(error) {
                    templateVars.error = error;

                    channel.say(pluginConfig.messages.errors.request, from);
                });

                // On request response pipe stream to FeedParser
                req.on("response", function onResponse(response) {
                    var stream = this;

                    // We didn"t get HTTP 200, something is wrong
                    if (response.statusCode != 200) {
                        return this.emit("error", new Error("Bad status code"));
                    }

                    stream.pipe(feedParser);
                });

                // On FeedParser error send message to user
                feedParser.on("error", function onError(error) {
                    templateVars.error = error;

                    channel.say(pluginConfig.messages.errors.feedParser, from);
                });

                // Initialize counter
                var i = 0;

                // Determine actual target, this depends the message count threshold value
                var target = itemCount > pluginConfig.messageCount.threshold ? from : undefined;

                // On FeedParser result
                feedParser.on("readable", function iterator() {
                    var stream = this;
                    var item;

                    // Iterate each feed item
                    while (item = stream.read()) {
                        if (i < itemCount) {
                            // Add extra template variables
                            templateVars.item = item;
                            templateVars.formattedDate = moment(item.date).format(pluginConfig.moment.format);
                            templateVars.timeAgo = moment(item.date).fromNow();

                            // Parse item description as 'jQuery' object
                            var $ = cheerio.load(item.description);

                            // Initialize "real" GitHub messages
                            var messages = [];

                            // Check possible commit messages
                            $('div.commits ul li div.message').each(function iterator(i, elem) {
                                messages.push($(this).text().trim());
                            });

                            // Check for possible comment titles
                            $('div.title a').each(function iterator(i, elem) {
                                if ($(elem).attr('title')) {
                                    messages.push($(elem).attr('title').trim());
                                }
                            });

                            templateVars.messages = messages.length ? messages.join(', ') : 'No detailed info';

                            // Fetch shorturl for current feed item
                            shorturl(item.link, function done(shortUrl) {
                                templateVars.shortUrl = shortUrl;

                                channel.say(_.template(pluginConfig.messages.success, templateVars), target);
                            })
                        } else if (i === itemCount) {
                            return;
                        }

                        i++;
                    }
                });

                // And after all is done
                feedParser.on('end', function onEnd() {
                    // Didn't find any feed items, so sent message about that to user
                    if (i === 0) {
                        channel.say(_.template(pluginConfig.messages.noItems, templateVars), from);
                    }
                });
            }
        };
    };
};
