import os
import re # regexp
import shutil
import datetime
from datetime import datetime

def replaceItem(filename, old, new):

    # Opening our text file in read only
    # mode using the open() function
    with open(f'{filename}', 'r') as file:

        # Reading the content of the file
        # using the read() function and storing
        # them in a new variable
        data = file.read()

        # Searching and replacing the text
        # using the replace() function
        data = data.replace(old, new)

    # Write the file out again
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w') as file:
        file.write(data)

def findindex(filename):

    pathname = os.path.dirname(filename)

    i = 0

    for file in os.listdir(pathname):
        f = os.path.join(pathname,file)
        if os.path.isfile(f):

            with open(f'{f}') as temp_f:
                datafile = temp_f.readlines()
                for line in datafile:
                    if 'Index:' in line:
                        i += 1

    return str(i)

def main():

    knownWriteUps = [f'article', f'post']
    cwd = f'{os.path.dirname(__file__)}'

    path_articles = f"{cwd}/content/articles/"
    path_posts = f"{cwd}/content/posts/"

    writeUp = input("Which kind of write-up you will take? (article/post): ")
    print(writeUp)

    if writeUp not in knownWriteUps:

        print("Unknown write-up. Use on of these: ", knownWriteUps)

    else:

        wuTitle = input("Title: ")
        wuTitleLower = wuTitle.replace(" ", "-").lower()
        wuMenuName = input("Menu name: ")
        wuSummary = input("Summary: ")
        wuLanguage = input("Language: ")
        wuKeywords = input("Keywords: ")
        wuAuthors = input("Authors [Default: René Zingerle, SSCP]: ") or f"René Zingerle, SSCP"
        wuTwitterA = input("Twitter Author [Default: r9_rtec]: ") or f"r9_rtec"
        now = datetime.now()
        wuTimeStamp = now.strftime('%Y-%m-%d_%H:%M:%S')
        wuImage = input("Image path: [Default: content/images/icons/menu/3_Pillars_Rothirsch-Tech-GmbH.png] ") or f"content/images/icons/menu/3_Pillars_Rothirsch-Tech-GmbH.png"
        wuAlt = input("Alternative image text: ")
        wuBaseUrl = f"{wuLanguage}/{wuTitleLower}.md"

        # path where original file is located
        sourcePath = f"{cwd}/content/templates/write-up.md"

        # path were a copy of file is needed
        destinationPath = f"{cwd}/content/{writeUp}s/{wuLanguage}/{wuTitleLower}.md"
        os.makedirs(os.path.dirname(destinationPath), exist_ok=True)

        # call copyfile() method
        shutil.copyfile(sourcePath, destinationPath)

        wuIndex = findindex(destinationPath)

        replaceItem(destinationPath, '!!wuTitle', wuTitle)
        replaceItem(destinationPath, '#', f'# {wuTitle}')
        replaceItem(destinationPath, '!!wuMenuName', wuMenuName)
        replaceItem(destinationPath, '!!wuIndex', wuIndex)
        replaceItem(destinationPath, '!!wuSummary', wuSummary)
        replaceItem(destinationPath, '!!wuLanguage', wuLanguage)
        replaceItem(destinationPath, '!!wuKeywords', wuKeywords)
        replaceItem(destinationPath, '!!wuAuthors', wuAuthors)
        replaceItem(destinationPath, '!!wuTwitterA', wuTwitterA)
        replaceItem(destinationPath, '!!wuTimeStamp', wuTimeStamp)
        replaceItem(destinationPath, '!!wuImage', wuImage)
        replaceItem(destinationPath, '!!wuAlt', wuAlt)
        replaceItem(destinationPath, '!!wuBaseUrl', wuBaseUrl)

if __name__ == "__main__":

    main()
