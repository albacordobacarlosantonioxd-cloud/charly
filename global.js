module.exports.daily = async (sender, from, m, sock, db, saveDB) => {
    await handleDaily(sender, from, m, sock, db, saveDB);
};

module.exports.marry = async (sender, from, m, sock) => {
    await handleMarry(sender, from, m, sock);
};

module.exports.divorce = async (sender, from, m, sock) => {
    await handleDivorce(sender, from, m, sock);
};

module.exports.acept = async (sender, from, m, sock) => {
    await handleAcept(sender, from, m, sock);
};