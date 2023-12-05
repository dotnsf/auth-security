//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    crypto = require( 'crypto' ),
    ejs = require( 'ejs' ),
    session = require( 'express-session' ),
    app = express();

app.use( express.static( __dirname + '/public' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );


//. env values
require( 'dotenv' ).config();
var settings_database_url = 'DATABASE_URL' in process.env ? process.env.DATABASE_URL : '';
//. "postgres://user:pass@localhost:5432/userdb"
//. "create table if not exists users( id varchar(50) not null primary key, email varchar(50) not null, password varchar(50) not null, name varchar(50) default '' );"

//. Postgres
process.env.PGSSLMODE = 'disable';

var PG = require( 'pg' );
PG.defaults.ssl = true;
var pg = null;
if( settings_database_url ){
  console.log( 'database_url = ' + settings_database_url );
  pg = new PG.Pool({
    connectionString: settings_database_url,
    idleTimeoutMillis: ( 3 * 86400 * 1000 )
  });
  pg.on( 'error', function( err ){
    console.log( 'error on working', err );
    if( err.code && err.code.startsWith( '5' ) ){
      try_reconnect( 1000 );
    }
  });
}

function try_reconnect( ts ){
  setTimeout( function(){
    console.log( 'reconnecting...' );
    pg = new PG.Pool({
      connectionString: settings_database_url,
      idleTimeoutMillis: ( 3 * 86400 * 1000 )
    });
    pg.on( 'error', function( err ){
      console.log( 'error on retry(' + ts + ')', err );
      if( err.code && err.code.startsWith( '5' ) ){
        ts = ( ts < 10000 ? ( ts + 1000 ) : ts );
        try_reconnect( ts );
      }
    });
  }, ts );
}

async function ownlogin( email, password ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
    
      var sql = "select * from users where email = $1";
      var query = { text: sql, values: [ email ] };
      conn.query( query, async function( err, result ){
        if( err ){
          console.log( {err} );
          resolve( { status: false, error: err } );
        }else{
          if( result.rows.length > 0 ){
            var user = result.rows[0];
            var hash_password = get_hash( password );
            if( hash_password == user.password ){
              resolve( { status: true, user: user } );
            }else{
              resolve( { status: false, error: 'no user found for email = "' + email + '" and your password.' } );
            }
          }else{
            resolve( { status: false, error: 'no user found for email = "' + email + '"' } );
          }
        }
      });
    }else{
      resolve( { status: false, error: 'db is not ready.' } );
    }
  });
}


function get_hash( str, alg ){
  if( !alg ){ alg = 'md5'; }
  var hash = crypto.createHash( alg );
  hash.update( str );
  var hash = hash.digest( 'hex' );

  return ( hash );
}

//. setup session
app.use( session({
  secret: 'auth-security-serverside-ownuser',
  resave: false,
  saveUninitialized: false
}));


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
  //. https://stackoverflow.com/questions/72336177/error-reqlogout-requires-a-callback-function
  req.session.user = null;
  res.redirect( '/' );
});

//. Custom UI(2)

//. login submit
app.post( '/appid/login/submit', async function( req, res ){
  var username = req.body.username;
  var password = req.body.password;
  var r = await ownlogin( username, password );
  if( r && r.status ){
    req.session.user = r.user;
    res.redirect( '/' );
  }else{
    req.session.user = null;
    res.redirect( '/login?message=' + r.error );
  }
});

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
  if( !req.session || !req.session.user ){
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
  if( req.session.user ){
    res.render( 'index', { user: req.session.user } );
  }else{
    res.render( 'index', { user: null } );
  }
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
