function RemoveLastDirectoryPartOf(the_url)
{
    var the_arr = the_url.split('/');
    the_arr.pop();
    return( the_arr.join('/') );
}

function redirect_to_language(language) {

  var fhof = /hall-of-fame.html/g;
  var f404 = /404.html/g;
  var f503 = /503.html/g;

  var dereg = /\/de\//g;
  var enreg = /\/en\//g;
  if ( ! dereg.test(window.location.pathname)
  &&  ! enreg.test(window.location.pathname) ) {


    // hall-of-fame.html
    if ( fhof.test(window.location.pathname) ) {

      if (language == 'de-DE' || language == 'de-AT') {
        window.location.href = 'de/hall-of-fame.html';
      } else {
        window.location.href = 'en/hall-of-fame.html';
      }

    // 404.html
    } else if ( f404.test(window.location.pathname) ) {

      if (language == 'de-DE' || language == 'de-AT') {
        window.location.href = 'de/404.html';
      } else {
        window.location.href = 'en/404.html';
      }

    // 503.html
    } else if ( f503.test(window.location.pathname) ) {

      if (language == 'de-DE' || language == 'de-AT') {
        window.location.href = 'de/503.html';
      } else {
        window.location.href = 'en/503.html';
      }

    // index.html
    } else {

      if (language == 'de-DE' || language == 'de-AT') {
        window.location.href = 'de/index.html';
      } else {
        window.location.href = 'en/index.html';
      }

    }

  }

  // Redirect back after timeout
  if ( f404.test(window.location.pathname)
  ||   f503.test(window.location.pathname) ) {
    setTimeout(() => {window.location.pathname = ""}, 14700);
  }


}
