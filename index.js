// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;

var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://bunoapp:bunoapp@ds019815-a0.mlab.com:19815/heroku_792f8hw7',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'hNAosoDMEdqy9xj600bcJkjNJ1eEWn5FPdSdocK6',
  masterKey: process.env.MASTER_KEY || 'a6qxrVp2VHWI1zToWQ1197WU63lNl4gtswSIQbNf', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://bunoapp.herokuapp.com',  // Don't forget to change to https if needed
  push: {
      android: {
        senderId: '760879136466',
        apiKey: 'AIzaSyAhPEmMaotMDtMEdKK4A-eHY-KUu1ZijVg'
      },
      ios: [
                {
                    pfx: 'NewPushCert.p12', // Dev PFX or P12
                    bundleId: 'co.bucketnotes.buno',
                    production: false // Dev
                },
                {

                  pfx: 'ParsePushProductionCertificates.p12', // The filename of private key and certificate in PFX or PKCS12 format from disk                  cert: '', // If not using the .p12 format, the path to the certificate PEM to load from disk    
                  cert: "", // If not using the .p12 format, the path to the certificate PEM to load from disk
                  key: '', // If not using the .p12 format, the path to the private key PEM to load from disk
                  bundleId: 'co.bucketnotes.buno', // The bundle identifier associate with your app
                  production: true // Specifies which environment to connect to: Production (if true) or Sandbox
                }
            ]
   },
  oauth: {
   twitter: {
     consumer_key: "", // REQUIRED
     consumer_secret: "" // REQUIRED
   },
   facebook: {
     appIds: "777306912374534"
   }
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('');
});

var port = process.env.PORT || 1337;
app.listen(port, function() {
    console.log('running on port ' + port + '.');
});
