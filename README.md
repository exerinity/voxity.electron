# Voxity: Electron
This is a basic barebones Electron wrap of [Voxity](https://github.com/exerinity/voxity), a local music player written in vanilla JS. This is a lightweight, straightforward, and intuitive build avoiding the typical clutter and bloat of most Electron apps.

# Why?
## - It can get picked up by [Music Presence for Discord](https://musicpresence.app) and show what you're listening to on Discord

![](https://i.exerinity.com/Discord_20260222_195847.png)
## - It has an application menu, giving you faster (debatably) access to some things
![](https://i.exerinity.com/Voxity_20260222_200013.gif)
## - This build enables better now playing display (like Media Session) on both Windows and Linux\*
![](https://i.exerinity.com/Voxity_20260222_200115.png)

\* Using the app as normal in a browser shows music is playing from that browser, not from Voxity, and using the app as an installed PWA (not this build) shows Voxity, but it's a bit more finicky (at least from my testing)
## - It can give you faster access to Voxity, for example by pinning it to your start menu, dock, or task manager
![](https://i.exerinity.com/explorer_20260222_200343.png)

## And most importantly:
## - It is not a typical RAM-hungry Electron behemoth
![](https://i.exerinity.com/Taskmgr_20260222_200440.png)

In the browser as normal, Voxity uses about 80 to 140 MB of RAM, depending on how many songs are queued. This screenshot depicts the Electron build using 165 MB of RAM, which roughly means the Electron overhead is about 25 to 60 MB RAM.

Also, it doesn't take forever to start! On a fast system, it's next to instant.

Only a .exe, .deb and .AppImage exist, I am not catering for everyone. But, as this is *a shell*, you could probably easily make your own build. 

#
The point of creating this was for it to get picked up by Music Presence for Discord, as it turns out, browsers cannot be detected because they're... browsers. So, I made this super minimal shell for Voxity, identified itself via **com.exerinity.voxity** and requested whitelisting, and it worked! Only on Windows, for now.

# License
This app (and Voxity itself) is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

# Build yourself
```bash
git clone https://github.com/exerinity/voxity.electron.git .
npm i
npm run dist:win # for Windows
npm run dist:linux # for Linux
npm run dist # for both
```
And also do:
```bash
npm run dev # to start locally
```

### This app is rarely updated. It is literally just a shell for Voxity. It just loads https://voxity.dev, so you still get all the updates and features of Voxity, just in an Electron app. 