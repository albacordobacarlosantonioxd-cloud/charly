import { User, db } from "../index.js";

const saveDB = async (jid) => {
  try {
    await User.updateOne(
      { jid },
      {
        $set: {
          money: db.users[jid]?.money || 0,
          lastwork: db.users[jid]?.lastwork || 0,
          afk: db.users[jid]?.afk || null,
          afkReason: db.users[jid]?.afkReason || "Sin especificar"
        }
      },
      { upsert: true }
    );
    return true;
  } catch (e) {
    console.error("Error crítico en saveDB:", e);
    return false;
  }
};

export default saveDB;
