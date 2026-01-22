"use strict";
import fs from 'fs';
import bencode from 'bencode';
import getPeers from './tracker.js'

const torrent = fs.readFileSync("puppy.torrent");
const decoded_torrent = bencode.decode(torrent);

getPeers(decoded_torrent, peers => {
    console.log('list of peers: ', peers);
})
