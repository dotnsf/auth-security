//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    session = require( 'express-session' ),
    WebAppStrategy = require( 'ibmcloud-appid' ).WebAppStrategy,
    SelfServiceManager = require( 'ibmcloud-appid' ).SelfServiceManager,
    app = express();

app.use( express.static( __dirname + '/public' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );


//. env values
require( 'dotenv' ).config();
var settings_appid_region = 'APPID_REGION' in process.env ? process.env.APPID_REGION : '';
var settings_appid_tenantid = 'APPID_TENANTID' in process.env ? process.env.APPID_TENANTID : '';
var settings_appid_apikey = 'APPID_APIKEY' in process.env ? process.env.APPID_APIKEY : '';
var settings_appid_secret = 'APPID_SECRET' in process.env ? process.env.APPID_SECRET : '';
var settings_appid_clientid = 'APPID_CLIENTID' in process.env ? process.env.APPID_CLIENTID : '';
var settings_appid_redirect_uri = 'APPID_REDIRECT_URI' in process.env ? process.env.APPID_REDIRECT_URI : '';
var settings_appid_oauthserver_url = 'https://' + settings_appid_region + '.appid.cloud.ibm.com/oauth/v4/' + settings_appid_tenantid;

//. setup session
app.use( session({
  secret: 'auth-security-serverside-customui',
  resave: false,
  saveUninitialized: false
}));

//. AppID
var passport = require( 'passport' );
app.use( passport.initialize() );
app.use( passport.session() );
passport.use( new WebAppStrategy({
  tenantId: settings_appid_tenantid,
  clientId: settings_appid_clientid,
  secret: settings_appid_secret,
  oauthServerUrl: settings_appid_oauthserver_url,
  redirectUri: settings_appid_redirect_uri
}));
passport.serializeUser( ( user, cb ) => cb( null, user ) );
passport.deserializeUser( ( user, cb ) => cb( null, user ) );

//. Custom UI(1)
var managementUrl = 'https://' + settings_appid_region + '.appid.cloud.ibm.com/management/v4/' + settings_appid_tenantid;
var selfServiceManager = new SelfServiceManager({
  iamApiKey: settings_appid_apikey,
  managementUrl: managementUrl 
});


//. login UI
app.get( '/login', function( req, res ){
  var message = ( req.query.message ? req.query.message : '' );
  res.render( 'login', { message: message } );
});

//. signup UI
app.get( '/signup', function( req, res ){
  var message = ( req.query.message ? req.query.message : '' );
  res.render( 'signup', { message: message } );
});

//. reset password UI
app.get( '/resetpassword', function( req, res ){
  var message = ( req.query.message ? req.query.message : '' );
  res.render( 'resetpassword', { message: message } );
});

//. set new password UI
app.get( '/newpassword', function( req, res ){
  var message = ( req.query.message ? req.query.message : '' );
  res.render( 'newpassword', { message: message } );
});

/*
//. login
app.get( '/appid/login', passport.authenticate( WebAppStrategy.STRATEGY_NAME, {
  successRedirect: '/',
  forceLogin: false //true
}));

//. callback
app.get( '/appid/callback', function( req, res, next ){
  next();
}, passport.authenticate( WebAppStrategy.STRATEGY_NAME )
);
*/

//. logout
app.get( '/appid/logout', function( req, res, next ){
  /*
  WebAppStrategy.logout( req ,function(){
    if( req.user ){
      req.user = null;
    }
    res.redirect( '/' );
  });
  */
  //. https://stackoverflow.com/questions/72336177/error-reqlogout-requires-a-callback-function
  req.logout( function( err ){
    if( err ){ return next( err ); }
    res.redirect( '/' );
  });
});

//. Custom UI(2)

//. login submit
app.post( '/appid/login/submit', bodyParser.urlencoded({extended: false}), passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
	successRedirect: '/',
	failureRedirect: '/login?message=login failed.',
	failureFlash : false
}));

//. signup submit
app.post( '/appid/signup', function( req, res ){
  var language = req.body.language;
  var lastName = req.body.lastName;
  var firstName = req.body.firstName;
  var phoneNumber = req.body.phoneNumber;
  var email = req.body.email;
  var password = req.body.password;
  var confirmed_password = req.body.confirmed_password;
  if( language ){
    if( password && password == confirmed_password ){
      var userData = {
        lastName: lastName,
        firstName: firstName,
        phoneNumber: phoneNumber,
        emails: [ { value: email, primary: true } ],   //. emails[0] should be **object**
        //confirmed_password: confirmed_password,
        password: password
      };
      selfServiceManager.signUp( userData, language, null ).then( function( user ){
        res.redirect( '/login' );
      }).catch( function( err ){
        console.log( { err } );
        res.redirect( '/signup?message=' + JSON.stringify( err ) );
      });
    }else{
      res.redirect( '/signup?message=password not mached.' );
    }
  }else{
    res.redirect( '/signup?message=no language specified.' );
  }
});

//. reset password submit
app.post( '/appid/resetpassword', function( req, res ){
  var language = req.body.language;
  var email = req.body.email;
  if( language && email ){
    selfServiceManager.forgotPassword( email, language, null ).then( function( user ){
      console.log( { user } );
      res.redirect( '/login' );
    }).catch( function( err ){
      console.log( { err } );
      res.redirect( '/signup?message=' + JSON.stringify( err ) );
    });
  }else{
    res.redirect( '/login?message=no language and/or email specified.' );
  }
});

//. set new password submit
app.post( '/appid/newpassword', async function( req, res ){
  var language = req.body.language;
  //var uuid = req.body.uuid;
  var email = req.body.email;
  var password = req.body.password;
  var confirmed_password = req.body.confirmed_password;
  if( language && email ){
    if( password && password == confirmed_password ){
      //. email から uuid を取得する必要がある
      var uuid = "";
      var obj = await getUsers();  //. { totalResults: 2, users: [ { id: "xx", email: "xxx", .. }, .. ] }
      for( var i = 0; i < obj.users.length; i ++ ){
        var user = obj.users[i];
        if( user.email.toUpperCase() == email.toUpperCase() ){
          //uuid = user.id;
          console.log( { user } );
          var profile = await getProfile( user.id );  //. { id: "xx", email: "xxx", identities: [ { id: "yy", .. }, .. ], .. }
          console.log( { profile } );
          for( var j = 0; j < profile.identities.length; j ++ ){
            var identity = profile.identities[j];
            console.log( { identity } );
            //if( identity.provider == 'cloud_directory' ){  //. 判断不要？
              uuid = identity.id;  //. この identity.id が uuid
            //}
          }
        }
      }

      if( uuid ){
        selfServiceManager.setUserNewPassword( uuid, password, language, null, null ).then( function( user ){
          console.log( { user } );
          res.redirect( '/login' );
        }).catch( function( err ){
          console.log( { err } );
          res.redirect( '/login?message=' + JSON.stringify( err ) );
        });
      }else{
        res.redirect( '/login?message=no user information found.' );
      }
    }else{
      res.redirect( '/signup?message=password not mached.' );
    }
  }else{
    res.redirect( '/login?message=no language and/or email specified.' );
  }
});

//. ログイン済みでないとトップページが見れないようにする
app.all( '/*', function( req, res, next ){
  if( !req.user || !req.user.sub ){
    //. ログイン済みでない場合は強制的にログインページへ
    //res.redirect( '/appid/login' );
    res.redirect( '/login' );
  }else{
    next();
  }
});

//. トップページ
app.get( '/', function( req, res ){
  //. 正しくユーザー情報が取得できていれば、トップページでユーザー情報を表示する
  if( req.user ){
    res.render( 'index', { user: req.user } );
  }else{
    res.render( 'index', { user: null } );
  }
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
