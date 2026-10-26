export type DevOutboxEmailEntry = {
  id: string;
  createdAt: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export type DevOutboxPushEntry = {
  id: string;
  createdAt: string;
  userId: string;
  title: string;
  body: string;
  url?: string;
};

export type DevOutboxSnapshot = {
  emails: DevOutboxEmailEntry[];
  pushes: DevOutboxPushEntry[];
};
