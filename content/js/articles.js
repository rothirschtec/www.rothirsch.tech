
// Find name from url and remove .html extension
function find_article_name() {
  var filename = window.location.pathname.split('/').pop();
  return filename.split('.html')[0]
}

// Add class to active article
function change_style_active_article(name) {
  $("[name='" + name + "']").addClass('active_article');
}
