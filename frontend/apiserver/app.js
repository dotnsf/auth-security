//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    crypto = require( 'crypto' ),
    formData = require( 'express-form-data' ),
    app = express();

app.use( express.static( __dirname + '/public' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( formData.parse( { autoClean: true } ) );
app.use( formData.format() );


//. env values
require( 'dotenv' ).config();
var settings_database_url = 'DATABASE_URL' in process.env ? process.env.DATABASE_URL : '';
//. "postgres://user:pass@localhost:5432/userdb"
//. "create table if not exists users( id varchar(50) not null primary key, email varchar(50) not null, password varchar(50) not null, name varchar(50) default '' );"

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';  //. "http://localhost:8080,https://xxx.herokuapp.com"
app.all( '/*', function( req, res, next ){
  //console.log( req.headers );
  if( settings_cors ){
    var origin = req.headers.origin;
    if( origin ){
      var cors = settings_cors.split( " " ).join( "" ).split( "," );

      //. cors = [ "*" ] への対応が必要
      if( cors.indexOf( '*' ) > -1 ){
        res.setHeader( 'Access-Control-Allow-Origin', '*' );
        res.setHeader( 'Access-Control-Allow-Methods', '*' );
        res.setHeader( 'Access-Control-Allow-Headers', '*' );
        res.setHeader( 'Vary', 'Origin' );
      }else{
        if( cors.indexOf( origin ) > -1 ){
          res.setHeader( 'Access-Control-Allow-Origin', origin );
          res.setHeader( 'Access-Control-Allow-Methods', '*' );
          res.setHeader( 'Access-Control-Allow-Headers', '*' );
          res.setHeader( 'Vary', 'Origin' );
        }
      }
    }
  }
  next();
});

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

//. login submit
app.post( '/api/login', async function( req, res ){
  res.contentType( 'application/json; charset=utf8' );

  var username = req.body.username;
  var password = req.body.password;
  var r = await ownlogin( username, password );
  console.log( username, password, r );
  if( r && r.status ){
    res.json( { status: true, user: r.user } );
  }else{
    res.json( { status: false, error: r.error } );
  }
});


var port = process.env.PORT || 8000;
app.listen( port );
console.log( "server starting on " + port + " ..." );
