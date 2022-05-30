function display_no_cookies_message(language) {

  var indreg = /index.html/g;
  
  // depends on ligth/dark mode
  if (window.location.hash != '#dark-mode' && window.location.hash != '#light-mode' && indreg.test(window.location.pathname)) {

    if (language == 'de-DE' || language == 'de-AT') {
      $('body').append('<div class="no-cookies-message"><p>Herzlich Willkommen auf unserer Website.</p><p>Wir verwenden keine Cookies : )</p></div>');
    } else {
      $('body').append("<div class='no-cookies-message'><p>Welcome to our website.</p><p>We don't use cookies : )</p></div>");
    }

    // Anime no-cookie message to leaf right
    setTimeout(function(){

      $(".no-cookies-message").animate({
        left: '100vh',
        opacity: '0.0'
      }, 4000);

    }, 2000);

    // Delete container
    setTimeout(function(){

      $('.no-cookies-message').remove();

    }, 6000);
  }

}
