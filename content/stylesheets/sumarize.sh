#!/bin/bash

cd $(dirname $0)
hdir="$PWD/"
cd ../
rdir="$PWD/"

cat ${hdir}main.css             >  ${rdir}main.css
cat ${hdir}scrollbar.css        >> ${rdir}main.css
cat ${hdir}content.css          >> ${rdir}main.css
cat ${hdir}menu_articles.css    >> ${rdir}main.css
cat ${hdir}menu_documents.css   >> ${rdir}main.css
cat ${hdir}files.css            >> ${rdir}main.css
cat ${hdir}background.css       >> ${rdir}main.css
cat ${hdir}no-cookies.css       >> ${rdir}main.css
cat ${hdir}colors.css           >> ${rdir}main.css
cat ${hdir}fonts.css            >> ${rdir}main.css
cat ${hdir}OSM.css              >> ${rdir}main.css
