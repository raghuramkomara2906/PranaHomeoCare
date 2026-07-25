export interface ContactMessageInput {
  fullName: string;
  email: string;
  phone?: string | null;
  message: string;
}

export interface ContactMessage extends ContactMessageInput {
  id: string;
  isRead: boolean;
  createdAt: string;
}
