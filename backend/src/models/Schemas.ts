import { model, Schema, Types } from "mongoose";

export interface User {
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
  creationDate: Date;
  friends: Types.ObjectId[];
  joinedServers: Types.ObjectId[];
  isVerified: boolean;
  verificationCodeHash?: string;
  verificationCodeExpiresAt?: Date;
}

export interface Post {
  author: Types.ObjectId;
  caption?: string;
  timestamp: Date;
  mediaUrls: string[];
  likes: Types.ObjectId[];
  reactions: Reaction[];
  comments: Comment[];
}

export interface Reaction {
  user: Types.ObjectId;
  type: "like" | "love" | "laugh" | "wow";
}

export interface Comment {
  author: Types.ObjectId;
  text: string;
  mentions: string[];
  timestamp: Date;
}

export interface Message {
  sender: Types.ObjectId;
  messageText: string;
  timestamp: Date;
}

export interface ChatMessage {
  roomId: string;
  sender: Types.ObjectId;
  messageText: string;
  timestamp: Date;
}

export interface Channel {
  name: string;
  type: "text" | "voice";
  messages: Message[];
}

export interface Server {
  name: string;
  owner: Types.ObjectId;
  channels: Channel[];
}

const messageSchema = new Schema<Message>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messageText: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

const channelSchema = new Schema<Channel>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["text", "voice"], required: true },
    messages: { type: [messageSchema], default: [] },
  },
  { _id: true },
);

export const UserSchema = new Schema<User>({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  avatarUrl: { type: String },
  creationDate: { type: Date, default: Date.now },
  friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
  joinedServers: [{ type: Schema.Types.ObjectId, ref: "Server" }],
  isVerified: { type: Boolean, default: false },
  verificationCodeHash: { type: String, select: false },
  verificationCodeExpiresAt: { type: Date, select: false },
});

export const PostSchema = new Schema<Post>({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  caption: { type: String },
  timestamp: { type: Date, default: Date.now },
  mediaUrls: { type: [String], default: [] },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  reactions: {
    type: [{
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      type: { type: String, enum: ["like", "love", "laugh", "wow"], required: true },
    }],
    default: [],
  },
  comments: {
    type: [{
      author: { type: Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true, maxlength: 500 },
      mentions: { type: [String], default: [] },
      timestamp: { type: Date, default: Date.now },
    }],
    default: [],
  },
});

PostSchema.index({ author: 1, timestamp: -1 });
PostSchema.index({ timestamp: -1, _id: -1 });

export const ServerSchema = new Schema<Server>({
  name: { type: String, required: true, trim: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  channels: { type: [channelSchema], default: [] },
});

export const ChatMessageSchema = new Schema<ChatMessage>({
  roomId: { type: String, required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  messageText: { type: String, required: true, maxlength: 2000 },
  timestamp: { type: Date, default: Date.now, index: true },
});

ChatMessageSchema.index({ roomId: 1, timestamp: -1 });

export const UserModel = model<User>("User", UserSchema);
export const PostModel = model<Post>("Post", PostSchema);
export const ServerModel = model<Server>("Server", ServerSchema);
export const ChatMessageModel = model<ChatMessage>("ChatMessage", ChatMessageSchema);