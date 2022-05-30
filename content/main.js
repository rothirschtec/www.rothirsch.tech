const cyrb53 = function(str, seed = 0) {
    // Idea from: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1>>>0);
};
function analyse_site_visitors() {
  if (window.location.hostname == 'www.rothirsch.tech') {
    $.getJSON("https://ipinfo.io/json?token=",
      function(json) {
        // We don't save the ip address from ip.json. Instead we use the
        // last two bytes (point included) of the IP and we hash them
        // afterwards. The hash is saved together with the country
        // and the region of the related IP. This seems unique enough because
        // our main customer audience is located in tyrol.
        // So even if some uses the function cyrb53 to calculate the hash of all
        // IPs from the IP Block from Austria or even the region Tyrol they
        // will not be able to identify the IP address in a case that could
        // harm the client that used the site. Because this project is available
        // online and everybody can have access to the hash calculation the hash
        // is only useful to hide restricted IPs to researchers of this page.
        var id = json.ip.split('.')[2] + "." + json.ip.split('.')[3]
        id = cyrb53(id);
        var path_name = window.location.pathname;
        var today = new Date().toISOString();
        var log_line = 'Visitor with id: ' + id + ' from country: ' + json.country +  ' and region: ' + json.region + ' recognized at date ' + today + ', using: ' + path_name + ' -- ';
        // Try to recognize crawlers
        // Idea from: https://stackoverflow.com/questions/20084513/detect-search-crawlers-via-javascript
        var analytics_file;
        var botPattern = "(googlebot\/|bot|Googlebot-Mobile|Googlebot-Image|Google favicon|Mediapartners-Google|bingbot|slurp|java|wget|curl|Commons-HttpClient|Python-urllib|libwww|httpunit|nutch|phpcrawl|msnbot|jyxobot|FAST-WebCrawler|FAST Enterprise Crawler|biglotron|teoma|convera|seekbot|gigablast|exabot|ngbot|ia_archiver|GingerCrawler|webmon |httrack|webcrawler|grub.org|UsineNouvelleCrawler|antibot|netresearchserver|speedy|fluffy|bibnum.bnf|findlink|msrbot|panscient|yacybot|AISearchBot|IOI|ips-agent|tagoobot|MJ12bot|dotbot|woriobot|yanga|buzzbot|mlbot|yandexbot|purebot|Linguee Bot|Voyager|CyberPatrol|voilabot|baiduspider|citeseerxbot|spbot|twengabot|postrank|turnitinbot|scribdbot|page2rss|sitebot|linkdex|Adidxbot|blekkobot|ezooms|dotbot|Mail.RU_Bot|discobot|heritrix|findthatfile|europarchive.org|NerdByNature.Bot|sistrix crawler|ahrefsbot|Aboundex|domaincrawler|wbsearchbot|summify|ccbot|edisterbot|seznambot|ec2linkfinder|gslfbot|aihitbot|intelium_bot|facebookexternalhit|yeti|RetrevoPageAnalyzer|lb-spider|sogou|lssbot|careerbot|wotbox|wocbot|ichiro|DuckDuckBot|lssrocketcrawler|drupact|webcompanycrawler|acoonbot|openindexspider|gnam gnam spider|web-archive-net.com.bot|backlinkcrawler|coccoc|integromedb|content crawler spider|toplistbot|seokicks-robot|it2media-domain-crawler|ip-web-crawler.com|siteexplorer.info|elisabot|proximic|changedetection|blexbot|arabot|WeSEE:Search|niki-bot|CrystalSemanticsBot|rogerbot|360Spider|psbot|InterfaxScanBot|Lipperhey SEO Service|CC Metadata Scaper|g00g1e.net|GrapeshotCrawler|urlappendbot|brainobot|fr-crawler|binlar|SimpleCrawler|Livelapbot|Twitterbot|cXensebot|smtbot|bnf.fr_bot|A6-Indexer|ADmantX|Facebot|Twitterbot|OrangeBot|memorybot|AdvBot|MegaIndex|SemanticScholarBot|ltx71|nerdybot|xovibot|BUbiNG|Qwantify|archive.org_bot|Applebot|TweetmemeBot|crawler4j|findxbot|SemrushBot|yoozBot|lipperhey|y!j-asr|Domain Re-Animator Bot|AddThis)";
        var re = new RegExp(botPattern, 'i');
        var userAgent = navigator.userAgent; 
        if (re.test(userAgent)) {
          analytics_file = '../../../site-analytics/crawlers_www.rothirsch.tech.txt'
        } else {
          analytics_file = '../../../site-analytics/www.rothirsch.tech.txt'
        }
        if (id != '') {
          $.ajax({
            type: 'POST',
            url: "content/php/analyze-site-visitors.php",
            data: {analyze_file: analytics_file, key: log_line},
            async: false,
            success: function(result) {
              console.log(result);
            }
          });
        } else {
          console.log('[ADMIN ACCESS NOT LOGGED] ' + log_line);
        }
      }
    );
  }
}
function showmap() {
  // Create Leaflet map on map element.
  var mymap = L.map('map').setView([47.38689, 11.77933], 15);
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnRlYy1yOSIsImEiOiJja3lpeW9udGwyaTdzMnhvOG5rOGI1Z2dqIn0.E4UNo_whEBa0cgFpZWCykQ', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox/streets-v11',
      tileSize: 512,
      zoomOffset: -1
  }).addTo(mymap);
  var marker = L.marker([47.38689, 11.77933]).addTo(mymap);
  marker.bindPopup("<b>Rothirsch Tech. GmbH</b><br>A tyrolean company.").openPopup();
}
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
function find_article_name() {
  var filename = window.location.pathname.split('/').pop();
  return filename.split('.html')[0]
}
function change_style_active_article(name) {
  $("[name='" + name + "']").addClass('active_article');
}
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
  // Self developed analyzation disabled, using plausible.io instead
  // analyse_site_visitors();
});
$(document).ready ( function () {
  // Trigger change_color function
  change_color();
});
