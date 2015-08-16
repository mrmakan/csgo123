var fs = require('fs');
var crypto = require('crypto');

var Steam = require('steam');
var SteamWebLogOn = require('steam-weblogon');
var getSteamAPIKey = require('steam-web-api-key');
var SteamTradeOffers = require('steam-tradeoffers');

var admin = ''; // put your steamid here so the bot can accept your offers

var logOnOptions = {
  account_name: '',
  password: ''
};

var authCode = ''; // code received by email

try {
  logOnOptions.sha_sentryfile = getSHA1(fs.readFileSync('sentry_yui'));
} catch (e) {
  if (authCode !== '') {
    logOnOptions.auth_code = authCode;
  }
}

// if we've saved a server list, use it
if (fs.existsSync('servers')) {
  Steam.servers = JSON.parse(fs.readFileSync('servers'));
}

var steamClient = new Steam.SteamClient();
var steamUser = new Steam.SteamUser(steamClient);
var steamFriends = new Steam.SteamFriends(steamClient);
var steamWebLogOn = new SteamWebLogOn(steamClient, steamUser);
var offers = new SteamTradeOffers();

steamClient.connect();
steamClient.on('connected', function() {
  steamUser.logOn(logOnOptions);
});

steamClient.on('logOnResponse', function(logonResp) {
  if (logonResp.eresult === Steam.EResult.OK) {
    console.log('Logged in!');
    steamFriends.setPersonaState(Steam.EPersonaState.Online);

    steamWebLogOn.webLogOn(function(sessionID, newCookie) {
      getSteamAPIKey({
        sessionID: sessionID,
        webCookie: newCookie
      }, function(err, APIKey) {
        offers.setup({
          sessionID: sessionID,
          webCookie: newCookie,
          APIKey: APIKey
        }, function () {
          handleOffers();
        });
      });
    });
  }
});

steamClient.on('servers', function(servers) {
  fs.writeFile('servers', JSON.stringify(servers));
});

steamUser.on('updateMachineAuth', function(sentry, callback) {
  fs.writeFileSync('sentry', sentry.bytes);
  callback({ sha_file: getSHA1(sentry.bytes) });
});

function handleOffers() {
  offers.getOffers({
    get_received_offers: 1,
    active_only: 1,
    time_historical_cutoff: Math.round(Date.now() / 1000),
    get_descriptions: 1
  }, function(error, body) {
    if (
      body
      && body.response
      && body.response.trade_offers_received
    ) {
      var descriptions = {};
      body.response.descriptions.forEach(function (desc) {
        descriptions[desc.appid + ';' + desc.classid + ';' + desc.instanceid] = desc;
      });

      body.response.trade_offers_received.forEach(function(offer) {
        if (offer.trade_offer_state !== 2) {
          return;
        }

        var offerMessage = 'Got an offer!\n';

        if (offer.items_to_receive) {
          offerMessage += 'Items to receive: ' +
            offer.items_to_receive.map(function (item) {
              var desc = descriptions[item.appid + ';' + item.classid + ';' + item.instanceid];
              return desc.name + ' (' + desc.type + ')';
            }).join(', ') + '\n';
        }

        if (offer.items_to_give) {
          offerMessage += 'Items to give: ' +
            offer.items_to_give.map(function (item) {
              var desc = descriptions[item.appid + ';' + item.classid + ';' + item.instanceid];
              return desc.name + ' (' + desc.type + ')';
            }).join(', ') + '\n';
        }

        if (offer.message && offer.message !== '') {
          offerMessage += 'Message: ' + offer.message;
        }

        console.log(offerMessage);
        steamFriends.sendMessage(admin, offerMessage);

        if (offer.steamid_other === admin
          || !offer.items_to_give
        ) {
          offers.acceptOffer({
            tradeOfferId: offer.tradeofferid
          }, function (error, result) {
            if (error) {
              console.log(error);
            }
            console.log('Offer accepted!');
            steamFriends.sendMessage(admin, 'Offer accepted!');

            offers.getOffer({
              tradeofferid: offer.tradeofferid
            }, function (error, result) {
              if (error) {
                console.log(error);
              }
              if (result
                && result.response
                && result.response.offer
                && result.response.offer.tradeid
              ) {
                offers.getItems({
                  tradeId: result.response.offer.tradeid
                }, function (error, result) {
                  if (error) {
                    console.log(error);
                  }
                  var items = result.map(function (item) {
                    return 'http://steamcommunity.com/profiles/' +
                      item.owner + '/inventory/#' +
                      item.appid + '_' + item.contextid + '_' + item.id;
                  }).join(' ');
                  console.log(items);
                  steamFriends.sendMessage(admin, items);
                });
              }
            });
          });
        } else {
          offers.declineOffer({
            tradeOfferId: offer.tradeofferid
          }, function (error, result) {
            if (error) {
              console.log(error);
            }
            console.log('Offer declined!');
            steamFriends.sendMessage(admin, 'Offer declined!');
          });
        }
      });
    }
  });
}

steamUser.on('tradeOffers', function(number) {
  if (number > 0) {
    handleOffers();
  }
});

function getSHA1(bytes) {
  var shasum = crypto.createHash('sha1');
  shasum.end(bytes);
  return shasum.read();
}
