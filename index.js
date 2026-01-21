"use strict";

const fs = require("fs");
const bencode = require("bencode");

const torrent = fs.readFileSync("puppy.torrent");
const decoded_torrent = bencode.decode(torrent);

console.log(decoded_torrent.announce.toString("utf8"));
