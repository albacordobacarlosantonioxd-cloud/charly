import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  antilink: { type: Boolean, default: false }
});

export default mongoose.models.Group || mongoose.model('Group', groupSchema);
