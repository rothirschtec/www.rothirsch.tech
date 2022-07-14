
function readfile(dir, title, summary) {

  $('#blog-content').append("<a href='../" + dir + "'><h2>" + title + "</h2><p>" + summary + "</p></a>");

}

function readIndex() {

  // read local JSON file using jQuery
  // Source: https://www.tutorialstonight.com/read-json-file-in-javascript.php

  var dir;
  var title;
  var summary;


  $.getJSON( "/blog-index.json", function( data ) {
    $.each(data.posts, function() {
      $.each(this, function(key, val){

        if (key == "dir") { dir = val; }
        if (key == "title") { title = val; }
        if (key == "summary") {
          summary = val;
          readfile(dir, title, summary);
        }

      });
    });
  });


}
