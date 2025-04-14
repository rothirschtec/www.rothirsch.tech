import os
import markdown  # pip3 install markdown
import re  # regexp
import json
import glob
import datetime
import requests
import sys
from datetime import datetime
from urllib.parse import urlparse

class Content():
    def replace_language(self, new, template_content):
        # Replace language
        language = new
        old = 'lang="none"'
        new = f'lang="{language}"'
        template_content = template_content.replace(f'{old}', f'{new}')
        return template_content

    def replace_other_language(self, language, template_content):
        # Create menu
        old = '0!otherlanguageX'
        if language == 'en':
            template_content = template_content.replace(f'{old}', 'de')
        else:
            template_content = template_content.replace(f'{old}', 'en')
        return template_content

    def replace_string(self, old, new, template_content):
        # Replace string
        template_content = template_content.replace(f'{old}', f'{new}')
        return template_content

    def replace_string_inside_file(self, search_text, replace_text, filename):
        with open(filename, 'r') as file:
            data = file.read()
            data = data.replace(search_text, replace_text)
        with open(filename, 'w') as file:
            file.write(data)

    def replace_articles_menu(self, language, base, name, template_content):
        # Get right index
        if language == 'de':
            index = Pages.de_articles_index
        else:
            index = Pages.en_articles_index

        whole_menu = "<!-- Menu -->"
        cindex = 0
        path = []
        menuitem = {}
        sorted_index = {}

        # Get index from article
        name = name.rstrip('.md')
        ci = 0
        for key in index.keys():
            if re.search(f'{base}', key):
                if re.search(f'{name}', f'{index[key]}'):
                    cindex = int(key.split('|')[0])
                ci += 1

        # Check if html shall be placed here
        for key in index.keys():
            path = key.split('|')[1]
            if re.search(f'documents', base):
                path = path.replace('/articles/', f'/documents/')
            elif re.search(f'files', base):
                path = path.replace('/articles/', f'/files/')

            ckey = key.split('|')[0]
            line = index[key]
            if base == path:
                menuitem[f'{ckey}'] = index[key]

        # Sort path
        i = 0
        while i < len(menuitem.keys()):
            for key in menuitem.keys():
                ii = key
                if int(ii) == i:
                    sorted_index[f'{ii}'] = menuitem[key]
                    i += 1

        # Create menu from dict
        for key in sorted_index:
            whole_menu += sorted_index[f'{cindex}']
            if cindex < len(sorted_index) - 1:
                cindex += 1
            else:
                cindex = 0

        template_content = template_content.replace('0!pagesX', f'{whole_menu}')
        return template_content

    def replace_documents_menu(self, path, language, template_content):
        # Get right index
        if language == 'de':
            index = Pages.de_documents_index
            ol = 'en'
        else:
            index = Pages.en_documents_index
            ol = 'de'

        index_length = len(index.keys())
        cindex = 0
        whole_menu = "<!-- Menu -->"

        subs = ''
        for sub in range(len(path.split('/')) - 1):
            if sub > 0:
                subs += '/'
            subs += '..'

        for i in range(0, index_length):
            ci = index[f'{cindex}'].replace('0!docmenuX', f'{subs}')
            whole_menu += ci
            if cindex < index_length - 1:
                cindex += 1
            else:
                cindex = 0

        whole_menu += f"<li><a class='special_menu light-color' title='change language' href='{subs}/{ol}/index.html'>{ol}</a></li>"
        template_content = template_content.replace('0!menuX', f'{whole_menu}')
        return template_content

    def save_sitemap_line(self, timestamp, changefreq, priority, page, cwd):
        datetime_object = datetime.strptime(f'{timestamp}', '%Y-%m-%d_%H:%M:%S')
        timestamp = datetime_object.strftime("%Y-%m-%d")
        with open(f'{cwd}/sitemap.xml', 'a') as file:
            file.write('    <url>\n')
            file.write(f'       <loc>{page}</loc>\n')
            file.write(f'       <lastmod>{timestamp}</lastmod>\n')
            file.write(f'       <changefreq>{changefreq}</changefreq>\n')
            file.write(f'       <priority>{priority}</priority>\n')
            file.write('    </url>\n')

    def symlink_rel(self, src, dst):
        rel_path_src = os.path.relpath(src, os.path.dirname(dst))
        os.symlink(rel_path_src, dst)

    def create_html(self, markdowns, tmp_dir, cwd):
        for base, subdirs, files in os.walk(markdowns):
            for file in files:
                with open(f'{base}/{file}', 'r') as f:
                    markdown_file = f.read()
                    html_file = markdown.markdown(markdown_file, extensions=['meta', 'tables', 'fenced_code'])
                    md = markdown.Markdown(extensions=['meta', 'tables', 'fenced_code'], output_format='html5')
                    html_file = md.convert(markdown_file)
                    state = str(f"{md.Meta['state']}").strip("['']")

                    if state == "ready":
                        try:
                            tmp_file = str(f"{md.Meta['template']}").strip("['']")
                        except:
                            tmp_file = 'articles.html'

                        with open(f'{tmp_dir}cleaned_{tmp_file}', 'r') as template_html:
                            template_content = template_html.read()

                            template_content = template_content.replace('0!contentX', f'{html_file}')
                            language = str(f"{md.Meta['language']}").strip("['']")
                            path = str(f"{md.Meta['base_url']}").strip("['']")
                            template_content = self.replace_language(language, template_content)
                            template_content = self.replace_string('0!titleX', str(f"{md.Meta['title']}").strip("['']"), template_content)
                            template_content = self.replace_string('0!keywordsX', str(f"{md.Meta['keywords']}").strip("['']"), template_content)
                            template_content = self.replace_string('0x!#date#!0x', str(f"{md.Meta['timestamp']}").strip("['']"), template_content)
                            dateshort = datetime.strptime(str(f"{md.Meta['timestamp']}").strip("['']"), '%Y-%m-%d_%H:%M:%S')
                            template_content = self.replace_string('0x!#dateshort#!0x', dateshort.strftime("%d.%m.%Y"), template_content)
                            template_content = self.replace_string('0!authorX', str(f"{md.Meta['authors']}").strip("['']"), template_content)
                            template_content = self.replace_string('0!base_urlX', f'{Site.url}/{path}', template_content)

                            try:
                                twitter_author = str(f"{md.Meta['twittera']}").strip("['']")
                            except:
                                twitter_author = 'rothirschtech'
                            template_content = self.replace_string('0!twitterauthorX', f'{twitter_author}', template_content)

                            try:
                                child = str(f"{md.Meta['child']}").strip("['']")
                                template_content = self.replace_string('0!childX', f'{child}', template_content)
                            except:
                                child = 'none'

                            try:
                                parent = str(f"{md.Meta['parent']}").strip("['']")
                            except:
                                parent = 'none'

                            if child != 'none':
                                template_content = self.replace_string('0!nextX', f'<a href="{child}">></a>', template_content)
                            else:
                                template_content = self.replace_string('0!nextX', '', template_content)

                            if parent != 'none':
                                template_content = self.replace_string('0!prevX', f'<a href="{parent}"><</a>', template_content)
                            else:
                                template_content = self.replace_string('0!prevX', '', template_content)

                            template_content = self.replace_string('0!descriptionX', str(f"{md.Meta['summary']}").strip("['']"), template_content)
                            template_content = self.replace_other_language(language, template_content)

                            if not re.search('/posts/', markdowns):
                                template_content = self.replace_articles_menu(language, base, file, template_content)
                            else:
                                gitpath = self.replace_string('.html', f'.md', path)
                                gitpath = self.replace_string('/blog/', f'/', gitpath)
                                template_content = self.replace_string('0!gitLinkX', f'<a class="gitlink" href="https://github.com/rothirschtec/www.rothirsch.tech/blob/main/content/posts/{gitpath}/">You can be an active part of this blog by following this link to the underlying git repo.</a>', template_content)

                            template_content = self.replace_documents_menu(path, language, template_content)
                            self.save_sitemap_line(str(f"{md.Meta['timestamp']}").strip("['']"), str(f"{md.Meta['changefreq']}").strip("['']"), str(f"{md.Meta['priority']}").strip("['']"), f"{Site.url}/" + str(f"{md.Meta['base_url']}").strip("['']"), cwd)

                            if re.search('/posts/', markdowns):
                                with open(f'{cwd}/blog-index.json', 'a') as file:
                                    file.write(' {"dir": "' + str(f"{md.Meta['base_url']}").strip("['']") + '", "title": "' + str(f"{md.Meta['title']}").strip("['']") + '", "summary": "' + str(f"{md.Meta['summary']}").strip("['']") + '", "language": "' + language + '", "image": "' + str(f"{md.Meta['image']}").strip("['']") + '", "alt": "' + str(f"{md.Meta['alt']}").strip("['']") + '" },')

                            template_content = re.sub('\s+(?=<)', '', template_content)
                        filename_out = f"{cwd}/{path}"
                        os.makedirs(os.path.dirname(filename_out), exist_ok=True)
                        with open(filename_out, 'w') as file:
                            file.write(template_content)
                        if not os.path.exists(f'{os.path.dirname(filename_out)}/content'):
                            self.symlink_rel(f'{cwd}/content', f'{os.path.dirname(filename_out)}/content')

class Pages():
    de_articles_index = {}
    en_articles_index = {}
    de_articles = {}
    en_articles = {}
    de_documents_index = {}
    en_documents_index = {}
    sitemap_lines = []

    def count_files_with_os_walk(self, path):
        total = 0
        for base, subdirs, files in os.walk(path):
            for file in files:
                total += 1
        return total

    def index_markdowns(self, markdowns, templates):
        with open(f'{templates}articles.html', 'r') as template_html:
            template_content = template_html.read()
            for base, subdirs, files in os.walk(markdowns):
                for file in files:
                    with open(f'{base}/{file}', 'r') as f:
                        article_markdown = f.read()
                        article_html = markdown.markdown(article_markdown, extensions=['meta', 'tables', 'fenced_code'])
                        md = markdown.Markdown(extensions=['meta', 'tables', 'fenced_code'], output_format='html5')
                        article_html = md.convert(article_markdown)
                        nakedfilename = re.sub('.md', '', file)
                        if 'articles' in markdowns:
                            image = str(f"{md.Meta['image']}").strip("['']")
                            alt = str(f"{md.Meta['alt']}").strip("['']")
                            title = str(f"{md.Meta['title']}").strip("['']")
                            name = str(f"{md.Meta['menuname']}").strip("['']")
                            language = str(f"{md.Meta['language']}").strip("['']")
                            base_url = str(f"{md.Meta['base_url']}").strip("['']")
                            cindex = int(str(f"{md.Meta['index']}").strip("['']"))
                            d = f'<a data-index="{cindex}" id="pages" name="{nakedfilename}" class="single-page" href="{nakedfilename}.html"><div class="pn-image""><img src="{image}" alt="{alt}"></div><div class="pn-name"><p class="lang {language}">{name}</p></div></a>'
                            if language == 'de':
                                self.de_articles_index[f'{cindex}|{base}'] = d
                            else:
                                self.en_articles_index[f'{cindex}|{base}'] = d
                        else:
                            name = str(f"{md.Meta['name']}").strip("['']")
                            language = str(f"{md.Meta['language']}").strip("['']")
                            base_url = str(f"{md.Meta['base_url']}").strip("['']")
                            index = str(f"{md.Meta['index']}").strip("['']")
                            if language == 'en':
                                self.en_documents_index[f'{index}'] = f'<li><a class="special_menu light-color" title="{name}" href="0!docmenuX/{base_url}">{name}</a></li>'
                            else:
                                self.de_documents_index[f'{index}'] = f'<li><a class="special_menu light-color" title="{name}" href="0!docmenuX/{base_url}">{name}</a></li>'

    def delete(files):
        for (dirname, dirs, files) in os.walk(files):
            for file in files:
                if file.endswith('.html'):
                    source_file = os.path.join(dirname, file)
                    os.remove(source_file)

class Files():
    def minify_file(file, type):
        with open(file, 'r') as c:
            tfile = c.read()
        payload = {'input': tfile}
        if type == 'css':
            url = 'https://www.toptal.com/developers/cssminifier/raw'
        if type == 'js':
            url = 'https://www.toptal.com/developers/javascript-minifier/raw'
        r = requests.post(url, payload)
        minified = file.rstrip(f'.{type}')+f'.min.{type}'
        with open(minified, 'w') as m:
            m.write(r.text)

    @staticmethod
    def build_dynamic_js(cwd):
        """
        Dynamically scan all JavaScript files in content/js/,
        concatenate them (in sorted order), remove lines starting with '//'
        and blank lines, then write the result to content/main.js.
        """
        js_dir = os.path.join(cwd, "content", "js")
        output_file = os.path.join(cwd, "content", "main.js")
        js_files = sorted([f for f in os.listdir(js_dir) if f.endswith(".js")])
        concatenated_content = []
        for filename in js_files:
            filepath = os.path.join(js_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                concatenated_content.append(f.read())
        full_content = "\n".join(concatenated_content)
        processed_lines = [line for line in full_content.splitlines() if not line.lstrip().startswith("//") and line.strip() != ""]
        final_content = "\n".join(processed_lines)
        with open(output_file, "w", encoding="utf-8") as out_file:
            out_file.write(final_content)
        print(f"Dynamic JavaScript concatenated into {output_file}")

    @staticmethod
    def build_dynamic_css(cwd):
        """
        Dynamically scan all CSS files in content/stylesheets/,
        concatenate them (in sorted order), remove block comments and blank lines,
        then write the result to content/main.css.
        """
        css_dir = os.path.join(cwd, "content", "stylesheets")
        output_file = os.path.join(cwd, "content", "main.css")
        css_files = sorted([f for f in os.listdir(css_dir) if f.endswith(".css")])
        concatenated_content = []
        for filename in css_files:
            filepath = os.path.join(css_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                concatenated_content.append(f.read())
        full_content = "\n".join(concatenated_content)
        no_comments = re.sub(r'/\*.*?\*/', '', full_content, flags=re.DOTALL)
        processed_lines = [line for line in no_comments.splitlines() if line.strip() != ""]
        final_content = "\n".join(processed_lines)
        with open(output_file, "w", encoding="utf-8") as out_file:
            out_file.write(final_content)
        print(f"Dynamic CSS concatenated into {output_file}")

class Site():
    url = 'https://www.rothirsch.tech'

class Templates():
    def clean_template(path):
        for base, subdirs, files in os.walk(path):
            for file in files:
                newfile = ''
                if not re.search(f'cleaned', file):
                    print(file)
                    with open(f'{base}{file}','r') as f:
                        for line in f:
                            if not line.isspace():
                                if not re.search(f'<!--', line):
                                    newfile += line
                    with open(f'{base}cleaned_{file}', 'w') as file:
                        file.write(newfile)

def main():
    cwd = f'{os.path.dirname(__file__)}'
    path_articles = f"{cwd}/content/articles/"
    path_posts = f"{cwd}/content/posts/"
    path_templates = f"{cwd}/content/templates/"
    path_documents = f"{cwd}/content/documents/"
    path_files = f"{cwd}/content/files/"

    # Create sitemap.xml
    with open(f'{cwd}/sitemap.xml', 'w') as file:
        file.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        file.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')

    # Create blog-index.json
    with open(f'{cwd}/blog-index.json', 'w') as file:
        file.write('{')
        file.write('"posts": [')

    print('Prepare html templates')
    Templates.clean_template(path_templates)

    print('Delete old files')
    Pages.delete(f"{cwd}/de/")
    Pages.delete(f"{cwd}/en/")

    print('Create menu index')
    Pages.index_markdowns(Pages(), path_articles, path_templates)
    Pages.index_markdowns(Pages(), path_documents, path_templates)

    print('Create html files')
    Content.create_html(Content(), path_files, f'{path_templates}', cwd)
    Content.create_html(Content(), path_articles, f'{path_templates}', cwd)
    Content.create_html(Content(), path_posts, f'{path_templates}', cwd)
    Content.create_html(Content(), path_documents, f'{path_templates}', cwd)

    # Finalize sitemap.xml and blog-index.json
    with open(f'{cwd}/sitemap.xml', 'a') as file:
        file.write('</urlset>')
    with open(f'{cwd}/blog-index.json', 'a') as file:
        file.write(' ]')
        file.write('}')
    Content.replace_string_inside_file(Content(), ", ]", " ]", f'{cwd}/blog-index.json')

    # Dynamically build the aggregated JavaScript and CSS files
    print('Building dynamic JavaScript and CSS...')
    Files.build_dynamic_js(cwd)
    Files.build_dynamic_css(cwd)

    # Optionally, you can still minify the generated files:
    # print('Minify css & js')
    # Files.minify_file(f'{cwd}/content/main.js', 'js')
    # Files.minify_file(f'{cwd}/content/main.css', 'css')

    print('Build complete.')

if __name__ == "__main__":
    main()
