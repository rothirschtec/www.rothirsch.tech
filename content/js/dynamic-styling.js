
function change_color() {

  // Change color on click
  $('.change_color').on("click", function() {

    if ($(".light-color")[0]){
      $('.light-color').removeClass('light-color').addClass('dark-color');

      // Change hash
      window.location.hash = 'dark-mode';
      $('a').each(function(){
          this.hash = "#dark-mode";
      });

    } else {
      $('.dark-color').removeClass('dark-color').addClass('light-color');

      // Change hash
      window.location.hash = 'light-mode';
      $('a').each(function(){
          this.hash = "#light-mode";
      });
    }

  });

  // Change color on load
  if (window.location.hash == '#dark-mode') {

    $('.light-color').removeClass('light-color').addClass('dark-color');

    $('a').each(function(){
        this.hash = "#dark-mode";
    }, 500);

  } else {

    $('a').each(function(){
        this.hash = "#light-mode";
    }, 500);

  }

}
