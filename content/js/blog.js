
function readfile(file, name) {

    $.ajax({

        url: file,
        type: "GET",
        cache: false,
        async: false,
        success: function(data) {

          $('#blog-content').append(data);

        },

    });
}

function readIndex() {

  // read local JSON file using jQuery
  // Source: https://www.tutorialstonight.com/read-json-file-in-javascript.php

  $.getJSON( "/blog-index.json", function( data ) {

    $.each(data.posts, function() {

      $.each(this, function(key, val){

        if (key == "dir") {
          console.log(val);//here data
        }

      });

    });
  });


}
