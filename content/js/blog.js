
function readfile(dir, title, summary, image, alt) {

  $('#blog-content').append("<a href='../" + dir + "#light-mode'><h2>" + title + "</h2><div class='flex-container'><div><img src='" + image + "' alt='" + alt + "'></div><div><p>" + summary + "</p></div></div></a>");

}

function readIndex() {

  // read local JSON file using jQuery
  // Source: https://www.tutorialstonight.com/read-json-file-in-javascript.php

  var dir;
  var title;
  var summary;
  var lang;
  var blang;
  var image;
  var alt;

  var dereg = /\/de\//g;
  var enreg = /\/en\//g;
  if ( dereg.test(window.location.pathname) ) {
    blang = "de";
  } else {
    blang = "en";
  }

  $.getJSON( "/blog-index.json", function( data ) {
    $.each(data.posts, function() {
      $.each(this, function(key, val){

        if (key == "dir") { dir = val; }
        if (key == "language") {
          lang = val;
        }
        if (key == "title") { title = val; }
        if (key == "summary") { summary = val; }
        if (key == "image") { image = val;}
        if (key == "alt" && lang == blang) {
          alt = val;
          readfile(dir, title, summary, image, alt);
        }

      });
    });

    // Change color after everything loaded
    // Needs to be positioned here
    change_color();
  });


}
