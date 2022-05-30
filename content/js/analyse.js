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
