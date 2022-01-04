ServerName = 'http://localhost:8888';

var request = require("request");

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
const path = require('path');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'f978cae67f704bf9a1eeb9c5c4c0456d'; // Your client id
var client_secret = '7f0f468951ce46d4aa5063da416c3e8e'; // Your secret
var redirect_uri = 'https://vrijenhoek.familyds.com:8889/callback/'; // Your redirect uris

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var OAuthCode = "";
var refresh_token = "";
var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

var favicon = require('serve-favicon');
app.use(favicon(path.join(__dirname,'public','Images','SpotifyVisualizerIcon.ico')));

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-currently-playing user-read-playback-state';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token;
        refresh_token = body.refresh_token;
        
        OAuthCode = access_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
        console.log("access_token", access_token);
        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log("User Credentials", body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));

          var trackOptions = {
            url: 'https://api.spotify.com/v1/me/player/currently-playing?market=NL&additional_types=track',
            headers: { 'Authorization': 'Bearer ' + OAuthCode },
            json: true
        };

        console.log("track options", trackOptions);
        console.log("OAuthCode", OAuthCode);

        request.get(trackOptions, function(error, response, body) {
            console.log("Current Track", body);
        });

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      OAuthCode = access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

// app.get('/currently_playing', function(req, res) {
//     var access_token = req.query.access_token;
    
//     if (access_token === OAuthCode && OAuthCode)
//     {
//         var refresh_token = req.query.refresh_token;
//         var authOptions = {
//             url: 'https://accounts.spotify.com/api/token',
//             headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
//             form: {
//                 grant_type: 'refresh_token',
//                 refresh_token: refresh_token
//             },
//             json: true
//         };
        
//         request.post(authOptions, function(error, response, body) {
//             if (!error && response.statusCode === 200) {
//                 var access_token = body.access_token;
//                 res.send({
//                     'access_token': access_token
//                 });
//                 OAuthCode = access_token;
//                 console.log("acces_token refreshed:", access_token);
//             }
//             else
//             {
//                 res.redirect('/#' +
//                     querystring.stringify({
//                         error: 'invalid_token'
//                     }));
//             }
//         });
//     }

//     var options = {
//         url: 'https://api.spotify.com/v1/me/player/currently-playing?additional_types=track',
//         headers: { 'Authorization': 'Bearer ' + OAuthCode, 'Accept': 'application/json' },
//         json: true
//     };

//     request.get(options, function(error, response, body) {
//         console.log("Current Track", body);
//         JSON.stringify(body);

//         if (body !== null || body.item !== null)
//         {
//             console.log("Track", body.item)
//             var track_id = body.item.id, track_name = body.item.name;
//             var artists = body.item.artists[0].name;
//             if (body.item.artists.length > 1)
//             {
//             body.item.artists.forEach(function(artist) {
//                 if (artist !== body.item.artists[0])
//                 {
//                     console.log("Artist Name: ", artist.name);
//                     artists += artist.name + ", ";
//                 }
//                 else
//                 {
//                   res.redirect('/#' +
//                     querystring.stringify({
//                         access_token: access_token,
//                         refresh_token: refresh_token,
//                         error: 'cannot-find-song-no-song-is-playing'
//                     }));
//                 }
//                 });
//             }

//             console.log(track_name, " by ", artists);

//             var options = {
//                 url: 'https://api.spotify.com/v1/audio-analysis/' + track_id,
//                 headers: { 'Authorization': 'Bearer ' + OAuthCode, 'Accept': 'application/json' },
//                 json: true
//             };
    
//             request.get(options, function(error, response, body) {
//                 if (body !== null || body.track !== null)
//                 {
//                     console.log("Track Analysis", body.bars[0]);
//                     JSON.stringify(body);
//                     trackAnalysis = body;
//                 }
//                 else
//                 {
//                   res.redirect('/#' +
//                     querystring.stringify({
//                         access_token: access_token,
//                         refresh_token: refresh_token,
//                         error: 'cannot-retrieve-track-analysis'
//                     }));
//                 }
//             });
    
//             res.redirect('/#' +
//                 querystring.stringify({
//                     access_token: OAuthCode,
//                     refresh_token: refresh_token,
//                     track_id: track_id,
//                     track_name: track_name,
//                     artists: artists,
//                 }));
//         }
//     });
// });

console.log('App is running! Go to http://localhost:8888');
app.listen(8888);