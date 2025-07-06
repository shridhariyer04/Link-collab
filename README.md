# 🧠 Link Collab

**Link Collab** is a full-stack collaborative link management tool that combines the simplicity of Linktree, the structure of Notion, and the real-time collaboration of Google Docs.

---

## 🌐 Live Demo

[www.linkcollab.sbs](https://www.linkcollab.sbs)

---

## 🚀 Features

- ✅ Auth via Clerk (Sign in / Sign up / User Profile)
- ✅ Create & manage boards
- ✅ Add collections and links inside boards
- ✅ Real-time collaboration with **Socket.IO**
- ✅ Invite members via email (powered by **Resend**)
- ✅ Role-based access: `owner`, `editor`, `viewer`
- ✅ Clean and modern UI using **TailwindCSS**
- ✅ Deployed via **Resend**, **Render**, and **GitHub**

---

## 📁 Tech Stack

| Frontend       | Backend           | Realtime       | Database     | Deployment    |
|----------------|------------------|----------------|--------------|---------------|
| Next.js 14     | Next.js API Routes | Socket.IO       | PostgreSQL + Drizzle ORM | Resend (email)<br>Render (Socket server)<br>Vercel/Resend (Frontend) |

---

## ⚙️ Environment Variables

Create a `.env` file with the following:

```env
# Clerk
CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Database
DATABASE_URL=...

# Resend
RESEND_API_KEY=...
RESEND_FROM_EMAIL="Link Collab <team@linkcollab.in>"

# App
NEXT_PUBLIC_APP_URL=https://www.linkcollab.sbs

# Socket
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
```

---

## 🧠 Project Structure

```bash
.
├── app/                      # Next.js app directory
│   ├── api/                 # API routes (boards, links, etc.)
│   ├── (routes)/onboard/    # Onboarding after invite
│   └── page.tsx             # Home page (Boards list)
├── lib/                     # DB, utils, email helpers
│   ├── db.ts                # Drizzle + schema
│   ├── permission.ts        # Role check logic
│   └── email.ts             # Resend email logic
├── socket-server/           # Standalone Socket.IO server
│   └── index.ts             # Express + Socket.IO setup
└── public/
```

---

## 📨 Email Invite Flow

- Board owners can invite via email
- Email sent via Resend with link like:

  ```
  https://www.linkcollab.sbs/onboard/INVITE_TOKEN
  ```

---

## 💻 Development

### Start Frontend

```bash
npm install
npm run dev
```

### Start Socket Server

```bash
cd socket-server
npm install
npm run dev
```

---

## 📦 Deployment

- **Frontend:** Vercel / Resend (supports Next.js SSR)
- **Socket Server:** Render (Docker-free Node server)
- **DB:** Supabase / Railway (PostgreSQL)

---

## 🙌 Acknowledgements

- [Clerk](https://clerk.dev) for authentication
- [Resend](https://resend.com) for email invites
- [Render](https://render.com) for hosting Socket.IO
- [Drizzle ORM](https://orm.drizzle.team) for database schema

---

## 📌 Future Enhancements

- ⏳ Link previews via Open Graph API
- ⏳ Collection-level permissions
- ⏳ Drag-and-drop for links
- ⏳ Search and filters

---

## 🔒 License

MIT License – Free to use, build on, and extend.

---

## ✨ Author

Made with ❤️ by **Shridhar Iyer**