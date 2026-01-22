"use strict";

import fs from 'fs';
import bencode from 'bencode';
import crypto from 'crypto'

import { Buffer } from 'buffer'
import { URL } from 'url'
import dgram from 'dgram'

const getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf8');

    udpSend(socket, buildConnReq(), url);

    socket.on('message', response => {
        if (respType(response) === 'connect') {
            const connResp = parseConnResp(response);
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent)
            udpSend(socket, announceReq, url);
        } else if (respType(response) == 'announce') {
            const announceResp = parseAnnounceResp(response);
            callback(announceResp.peers)
        }
    })
}

function udpSend(socket, message, rawUrl, callback = () => { }) {
    const url = URL.parse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.host, callback);
};

export default getPeers;

function respType(resp) { }
function buildConnReq() {
    const buf = Buffer.alloc(16);

    //connection id
    buf.writeUint32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);
    // action
    buf.writeUInt32BE(0, 8);

    //transaction id
    crypto.randomBytes(4).copy(buf, 12);

    return buf;
}

function parseConnResp(resp) {
    return {
        action: resp.readUInt32BE(0),
        transactionid: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
    }
}

function buildAnnounceReq(connId, torrent, port = 6881) {
    const buf = Buffer.allocUnsafe(98);

    connId.copy(buf, 0);
    buf.writeUInt32BE(1, 8);
    crypto.randomBytes(4).copy(buf, 12);
    torrentParser.infoHash(torrent).copy(buf, 16);
    util.genId().copy(buf, 36);
    Buffer.alloc(8).copy(buf, 56);
    torrentParser.size(torrent).copy(buf, 64);
    Buffer.alloc(8).copy(buf, 72);
    buf.writeUInt32BE(0, 80);
    buf.writeUInt32BE(0, 80);
    crypto.randomBytes(4).copy(buf, 88);
    buf.writeInt32BE(-1, 92);
    buf.writeUInt16BE(port, 96);

    return buf;

}

function parseAnnounceResp(resp) {
    function group(iterable, groupSize) {
        let groups = [];
        for (let i = 0; i < iterable.length; i += groupSize) {
            groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
    }

    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
            return {
                ip: address.slice(0, 4).join('.'),
                port: address.readUInt16BE(4)
            }
        })
    }
}
