import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  name: { type: String, default: 'Usuario' },
  money: { type: Number, default: 100 },
  marry: { type: String, default: null },
  marryName: { type: String, default: 'Nadie' },
  streak: { type: Number, default: 0 },
  lastDailyGlobal: { type: Number, default: 0 }
});

// Aseguramos que el modelo User exista
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
