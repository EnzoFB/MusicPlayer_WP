import os
from os.path import isfile, join

allNamesFiles = sorted([f for f in os.listdir("./assets/Musics") if isfile(join("./assets/Musics", f))])

f = open("tracklist.js", "w")
f.write("let tracklist = [\n")

fileNames = []
for item in allNamesFiles:
    fileNames.append("\t\"" + os.path.splitext(item)[0] + "\"")
f.write(",\n".join(fileNames))
f.write("\n]")
f.close()