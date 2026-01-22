'use strict';

import crypto from 'crypto';

let id = null;

const getId = () => {
    if (!id) {
        id = crypto.randomBytes(20);
        Buffer.from('-CC0001-').copy(id, 0);
    }

    return id;
}

export default getId;
