const HEADER_SIZE = 10
const ENCODERS = ['ascii', 'utf-16', 'utf-16be', 'utf-8']
const LANG_FRAMES = ['USLT','SYLT','COMM','USER']

let currMusic = 0, stateMusic = false, stateShuffle = true, stateVolume = true
let audio = document.getElementById('audio')
let video = document.getElementById('video')
let time = document.getElementById('rangeTime')
let playButton = document.getElementById('play')
let shuffleButton = document.getElementById('shuffle')
let volumeButton = document.getElementById('volume')
// audio.src = "./MUSIQUE/[Relax&StudyVol.1]/track.mp3"

randomTrack()
nextTrack()

audio.addEventListener('loadeddata', readFile)
audio.addEventListener('ended', () => {
    nextTrack()
    audio.play()
})

// Works only on Live Server
// function readFile() {

//     // console.log('readFile', this.files[0])
//     console.log('audio', audio)
//     console.log(this.src)

//     // let fFile = new File([audio.src], "Music", {type: "audio/mpeg", lastModified: Date.now()})
    
//     let fReader = new FileReader()
    
//     fetch(audio.src)
//         .then((e) => {
//             return e.blob()
//         })
//         .then((blob) => {
//             let b = blob
//             b.lastModifiedDate = new Date()
//             b.name = ''
//             return b 
//         })
//         .then((b) => fReader.readAsArrayBuffer(b))
//     // fReader.readAsArrayBuffer(blob)
//     // fReader.readAsArrayBuffer(this.files[0])
//     fReader.onload = readID3

//     // audio.src = URL.createObjectURL(this.files[0])
//     // audio.onend = function(e) { URL.revokeObjectURL(this.src) }
// }

// Works only on Wallpaper Engine
function readFile() {
    const xhr = new XMLHttpRequest()
    let fReader = new FileReader()

    xhr.open('GET', audio.src, true)
    xhr.responseType = 'blob'

    xhr.onload = (e) => {
        // console.log(xhr)
        const blob = new Blob([xhr.response], { type: 'audio/mpeg' })
        fReader.readAsArrayBuffer(blob)
        fReader.onload = readID3
    }
    xhr.send()
}

function readID3() {
    let file = this.result
    let header = new DataView(file, 0, HEADER_SIZE)

    // VERSION

    let version = `ID3v2.${header.getUint8(3)}.${header.getUint8(4)}`
    // console.log(`VERSION: ${version}`)

    // SIZETAG 

    let synch = header.getUint32(6)
    const mask = 0b01111111
    let b1 = synch & mask
    let b2 = (synch >> 8) & mask
    let b3 = (synch >> 16) & mask
    let b4 = (synch >> 24) & mask
    
    let sizeTag = b1 | (b2 << 7) | (b3 << 14) | (b4 << 21)

    // FRAME

    let offset = HEADER_SIZE
    let id3Size = HEADER_SIZE + sizeTag

    let title, artist, album, picture

    while (offset < id3Size) {
        let frame = decodeFrame(file, offset)
        if (!frame) break

        // console.log(`${frame.tagName}: ${frame.value.length > 200 ? '...' : frame.value}`);
        offset += frame.size;

        if (frame.tagName == "TIT" || frame.tagName == "TIT1" || frame.tagName == "TIT2") title = frame.value

        if (frame.tagName == "TPE1") artist = frame.value

        if (frame.tagName == "TALB") album = frame.value

        if (frame.tagName == "APIC") {
            let image = frame.value.slice(frame.value.indexOf(255), frame.size);

            if (image) {
                let format = decode('ascii', frame.value.slice(0, 10))
                let b64 = window.btoa([].reduce.call(image, function(p,c){ return p+String.fromCharCode(c) },''))
                let base64 = "data:" + format + ";base64," + b64
                
                document.getElementById('picture').setAttribute('src', base64);
            } else {
                document.getElementById('picture').style.display = "none";
            }


        }
    }

    document.getElementById('title').innerHTML = title || "Inconnu"
    document.getElementById('artist').innerHTML = artist || "Inconnu"
    document.getElementById('album').innerHTML = album || "Inconnu"
}

function decode(format, string) { return new TextDecoder(format).decode(string) }

function decodeFrame(file, offset) {
    let header = new DataView(file, offset, HEADER_SIZE + 1)
    if (header.getUint8(0) === 0) {return}

    let tagName = decode('ascii', new Uint8Array(file, offset, 4))

    let tagSize = header.getUint32(4)
    let tagContentSize = tagSize - 1
    let encode = header.getUint8(HEADER_SIZE)

    let offsetContent = offset + HEADER_SIZE + 1
    let lang

    if (LANG_FRAMES.includes(tagName)) {
        lang = decode('ascii', new Uint8Array(file, offsetContent, 3))
        offsetContent += 3
        tagContentSize -= 3
    }

    let value = ''
    if (tagName == 'APIC') {value = new Uint8Array(file, offsetContent, tagContentSize)}
    else {value = decode(ENCODERS[encode], new Uint8Array(file, offsetContent, tagContentSize))}

    // let value = decode(ENCODERS[encode], new Uint8Array(file, offsetContent, tagContentSize))

    return { tagName, value, lang, size: tagSize + HEADER_SIZE }
}

//

function playAudio() {
    // audio.paused ? this.style.backgroundColor = 'red' : audio.style.backgroundColor = 'green'
    // audio.paused ? audio.play() : audio.pause()
    if (audio.paused) {
        audio.play()
        playButton.className = "playing"
        stateMusic = true
    } else {
        audio.pause()
        playButton.className = "paused"
        stateMusic = false
    }
}

function randomTrack() {
    let prevMusic = tracklist[currMusic]
    if (stateShuffle) {
        for (let i = tracklist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const temp = tracklist[i]
            tracklist[i] = tracklist[j]
            tracklist[j] = temp
        }
        shuffleButton.className = "shuffled"
        stateShuffle = false
    } else {
        tracklist = tracklist.sort()
        shuffleButton.className = "noshuffled"
        stateShuffle = true
    }
    document.getElementById('list').remove()
    let ul = document.createElement('ul')
    ul.setAttribute('id', 'list')
    document.getElementById('listDiv').appendChild(ul)
    for (let item in tracklist) {
        let list = document.createElement('li')
        list.innerHTML = tracklist[item]
        list.onclick = () => nextTrack(item)
        document.getElementById('list').appendChild(list)
    }
    // console.table(tracklist)
    currMusic = tracklist.indexOf(prevMusic)
    document.getElementsByTagName('li')[currMusic].setAttribute('class', 'currentMusic')
}

function nextTrack(i) {
    document.getElementsByTagName('li')[currMusic].classList.remove('currentMusic')
    if (i != null) {
        // console.log("good")
        currMusic = i
    } else {
        currMusic >= tracklist.length - 1 ? currMusic = 0 : currMusic++
        // console.table(tracklist[currMusic])
    }
    document.getElementsByTagName('li')[currMusic].setAttribute('class', 'currentMusic')
    audio.src = "./assets/Musics/"+tracklist[currMusic]+".mp3"
    video.src = "./assets/Videos/"+tracklist[currMusic]+".webm"
    stateMusic ? audio.play() : 0
}

function prevTrack() {
    document.getElementsByTagName('li')[currMusic].classList.remove('currentMusic')
    // currMusic >= tracklist.length - 1 ? currMusic = 0 : currMusic++
    currMusic <= 0 ? currMusic = tracklist.length - 1 : currMusic--
    // console.table(tracklist[currMusic])

    document.getElementsByTagName('li')[currMusic].setAttribute('class', 'currentMusic')
    audio.src = "./assets/Musics/"+tracklist[currMusic]+".mp3"
    video.src = "./assets/Videos/"+tracklist[currMusic]+".webm"
    stateMusic ? audio.play() : 0
}

function setVolume(volume) {
    audio.volume = volume
    if (volume == 0) { volumeButton.className = "volume-mute" } 
    else if (volume>=1/3*2) { volumeButton.className = "volume-high" } 
    else if (volume<1/3*2 && volume>=1/3) { volumeButton.className = "volume-medium" } 
    else { volumeButton.className = "volume-low" }
}

function muteVolume() {
    if (stateVolume) {
        audio.volume = 0
        volumeButton.className = "volume-mute"
        stateVolume = false
    } else {
        setVolume(document.getElementById("volumeRange").value)
        stateVolume = true
    }
}

audio.addEventListener("timeupdate", function(){
    var duration = this.duration
	var currentTime = this.currentTime
	
	time.value = (currentTime/duration)

	if (isNaN(duration)) time.value = 0
	document.querySelector('#progressTime').textContent = formatTime(currentTime)
	
	var totalDuration = formatTime(duration)
	
	if (totalDuration === "NaN:NaN") totalDuration = "0:00"
	document.querySelector('#durationTime').textContent = totalDuration
})

function formatTime(time) {
	var hours = Math.floor(time / 3600)
	var mins  = Math.floor((time % 3600) / 60)
	var secs  = Math.floor(time % 60)

	if (secs < 10) secs = "0" + secs

	if (hours) {
		if (mins < 10) {
			mins = "0" + mins
		} return hours + ":" + mins + ":" + secs // hh:mm:ss
	} else {
		return mins + ":" + secs // mm:ss
	}
}

function setCurrentTime(value) {
    let duration = audio.duration
    audio.currentTime = value * duration
}

function showPlaylist() {
    let x = document.getElementById('listDiv')
    if (x.style.display === "none" ) {x.style.display = 'block'}
    else { x.style.display = 'none' }
}