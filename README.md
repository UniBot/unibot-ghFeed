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
