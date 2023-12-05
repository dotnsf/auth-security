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
  secret: 'auth-security-serverside-normalui',
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

//. logout
app.get( '/appid/logout', function( req, res, next ){
  //. https://stackoverflow.com/questions/72336177/error-reqlogout-requires-a-callback-function
  req.logout( function( err ){
    if( err ){ return next( err ); }
    res.redirect( '/' );
  });
});

//. ログイン済みでないとトップページが見れないようにする
app.all( '/*', function( req, res, next ){
  if( !req.user || !req.user.sub ){
    //. ログイン済みでない場合は強制的にログインページへ
    res.redirect( '/appid/login' );
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
