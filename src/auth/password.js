const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

async function hashPass(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPass(password, hash) {
    return bcrypt.compare(password, hash);
}

module.exports = {
    hashPass,
    verifyPass,
};