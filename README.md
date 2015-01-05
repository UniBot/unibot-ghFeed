# unibot-ghFeed
GitHub user activity feed plugin for UniBot. Basically plugin just reads GitHub user public activity feed and shows 
that on IRC channel. These feeds are accessible via following URL:

```
https://github.com/[GitHubUsername].atom
``` 

## Install
To your UniBot application

```npm install git://github.com/UniBot/unibot-ghFeed --save```

And after that register new plugin on IRC channels what you need

```plugin [#channel] ghFeed```

ps. remember to restart your UnitBot.

## Configuration
You can configure this plugin adding ```ghFeed``` section to your UniBot ```config.js``` file. Example below with
default values.

```
module.exports = { 
    ...
    plugins: {
        "ghFeed": {
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
                "errorThreshold": "You did try to fetch more feed items that is allowed! Maximum feed item count is ${config.messageCount.maximum}",
                "errorNoFeedItems": "Sorry no GitHub public activity feed items for ${username} - ${url}"
            }
        }
    }
};
```

### messageCount
#### messageCount.default
Number of how many feed items plugin will show by default.

#### messageCount.threshold
Threshold value of messages, when plugin will sent result to user private chat. 

#### messageCount.maximum
Maximum items that plugin will emit messages to user / channel. This is for flood protection.

### moment
#### moment.locale
Used [Moment.js](http://momentjs.com/) locale for formatted timestamps in template variables; ```timeAgo``` and 
```formattedDate```. More info at [Moment.js#i18n page](http://momentjs.com/docs/#/i18n/).

#### moment.format
Used ```format``` string for ```formattedDate``` template variable. See possible values from 
[Moment.js#Format page](http://momentjs.com/docs/#/displaying/format/).

### messages
Used message templates. With all of there templates you can use following template variables.

```
url             = GitHub feed URL, like https://github.com/tarlepp.atom
nick            = IRC nick who triggered plugin
username        = Parsed GitHub username
config          = Current plugin config as an object
```

Note that some messages can have extra variables too, those are documented under each message.

#### messages.success
Message that are shown after feed item(s) have been fetched and parsed for actual message. Note that this message has
also following template variables that you can use.

```
item            = Actual feed item object from FeedParser
formattedDate   = Formatted date for feed item 
timeAgo         = How long ago feed item was made
messages        = GitHub messages from feed item (commit messages, comment titles, etc.)
shortUrl        = Feed item link value as in "shorturl" form
```

#### messages.errorThreshold
Message that is emitted to user when he/she has requested more feed items that are allowed. Note that this message is 
sent to user as a private message.

#### messages.errorNoFeedItems
Message that is emitted to user when he/she has requested GitHub feeds from user that is a real GitHub user but he/she
doesn't have feed items yet. Note that this message is sent to user as a private message.

## Usage examples
After installation you can use following commands to use plugin:

```
!ghFeed             => Shows GitHub feeds according to your IRC nick
!ghFeed tarlepp     => Shows feeds for 'tarlepp' GitHub user
!ghFeed tarlepp 3   => Shows three (3) feeds for 'tarlepp' GitHub user
```

Note that default count of items is one (1) and it can be configured.

## Libraries that plugin uses
* [Feedparser](https://github.com/danmactough/node-feedparser) - Robust RSS, Atom, and RDF feed parsing in Node.js
* [Lo-Dash](https://lodash.com/) - A utility library delivering consistency, customization, performance, & extras.
* [Moment.js](http://momentjs.com/) - Parse, validate, manipulate, and display dates in JavaScript.
* [cheerio](https://github.com/cheeriojs/cheerio) - Fast, flexible, and lean implementation of core jQuery designed specifically for the server.
* [node-shorturl](https://github.com/jdub/node-shorturl) - shorturl is a simple, asynchronous client library for common URL shortener services.
