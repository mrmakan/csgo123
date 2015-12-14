# Steam Donation Bot

A Steam bot that accepts item donations.

Basically, it accepts any offer that doesn't ask for any items from its inventory.

Feel free to use if you want to accept item donations for your project, or modify it as you see fit.

This bot does not support mobile auth as of yet.

## Install and run

1. Install the latest [Node.js](https://nodejs.org).
2. Click 'Download ZIP' button on the right of this page.
3. Unpack this ZIP file wherever you like.
4. Switch to the resulting directory in a command line or a terminal.
5. Do `npm install` in the directory.
6. Edit `donation_bot.js` to put your account credentials. Leave `authCode` as is for now.
7. Run `node donation_bot.js`. It will 'crash' shortly, and you'll receive an email with Steam Guard code.
8. Edit `donation_bot.js` again to put Steam Guard code into `authCode`, then run `node donation_bot.js` again. A `sentry` file will be created in the same directory with the bot. From now on you can run `node donation_bot.js` to launch the bot.

__Note:__ After `sentry` file is created, you'll need to wait for 7-15 days due to [Steam Guard trade restrictions](https://support.steampowered.com/kb_article.php?ref=1047-EDFM-2932).
__Do NOT delete sentry file!__

## License

MIT