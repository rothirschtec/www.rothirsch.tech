#!/bin/bash

cd $(dirname $0)
hdir="$PWD/"
cd ../
rdir="$PWD/"

# Create main.js
cat ${hdir}analyse.js           >  ${rdir}main.js
cat ${hdir}OSM.js              	>> ${rdir}main.js
cat ${hdir}dynamic-styling.js   >> ${rdir}main.js
cat ${hdir}no-cookies.js        >> ${rdir}main.js # depends on dynamic-styling.js
cat ${hdir}articles.js          >> ${rdir}main.js
cat ${hdir}redirects.js         >> ${rdir}main.js
cat ${hdir}blog.js              >> ${rdir}main.js
cat ${hdir}main.js              >> ${rdir}main.js


# Remove comments
sed --in-place '/^\/\//d'       ${rdir}main.js
sed --in-place '/^\s*$/d'       ${rdir}main.js
