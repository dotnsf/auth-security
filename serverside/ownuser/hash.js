//. hash.js
var crypto = require( 'crypto' );

function get_hash( str, alg ){
  if( !alg ){ alg = 'md5'; }
  var hash = crypto.createHash( alg );
  hash.update( str );
  var hash = hash.digest( 'hex' );

  return ( hash );
}

if( process.argv.length < 3 ){
  console.log( '$ node hash (string)' );
  process.exit( 1 );
}else{
  var str = process.argv[2];
  var hash = get_hash( str );
  console.log( str + ' -> ' + hash );
}

