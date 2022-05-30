$(document).ready ( function () {

  var language = navigator.languages && navigator.languages[0] || // Chrome / Firefox
               navigator.language ||   // All browsers
               navigator.userLanguage; // IE <= 10

  // language
  redirect_to_language(language);

  // articles
  article_name = find_article_name();
  change_style_active_article(article_name);

  // Show openstreetmap
  if ( $('#map').length ) {
    showmap();
  }

  // Show no cookies message
  display_no_cookies_message(language);

  // analyse_site_visitors();

});

$(document).ready ( function () {

  // Trigger change_color function
  change_color();

});
