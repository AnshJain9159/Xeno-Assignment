# Xeno-CRM (SDE Internship Assignment)

A full-stack, AI-powered Customer Relationship Management (CRM) platform built with Next.js 14 (App Router), MongoDB, NextAuth, shadcn/ui, and OpenAI.  
This project demonstrates customer segmentation, campaign management, order ingestion, and vendor integration with webhooks.

---

## Features

- **Authentication:** Secure sign-up/sign-in with NextAuth (Google & credentials)
- **Customer Management:** Add, view, and segment customers
- **Audience Segmentation:** Create dynamic segments using rule builder or AI
- **Campaigns:** Create, preview, and deliver personalized campaigns
- **Order Management:** Bulk upload orders via CSV
- **Vendor Simulation:** Dummy vendor API with delivery receipts via webhook
- **AI Integration:** Generate audience rules and message templates with OpenAI
- **Dashboard:** View campaign logs, statuses, and analytics
- **Modern UI:** Built with shadcn/ui and Tailwind CSS

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AnshJain9159/Xeno-Assignment.git
cd Xeno-Assignment
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the `web` directory:

```
NEXTAUTH_SECRET="" # Added by `npx auth`.
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
MONGODB_URI="mongodb://localhost:27017/Xeno"
CALLBACK_URL="http://localhost:3000/api/auth/callback/google"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY=
```

### 4. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Endpoints

- `/api/customers` - Manage customers
- `/api/orders` - Manage orders (supports bulk upload)
- `/api/audiences` - Audience segment CRUD
- `/api/campaigns` - Campaign CRUD and delivery
- `/api/dummy-vendor/send` - Simulated vendor API
- `/api/webhooks/delivery-receipts` - Webhook for vendor delivery receipts

---

## Bulk Upload

- **Customers:** Upload a CSV with headers: `name,email,phone,...`
- **Orders:** Upload a CSV with headers: `orderId,customerEmail,orderAmount,orderDate`

---

## Authentication

- Sign up/sign in with email/password or Google
- Protected routes and API endpoints

---

## AI Features

- Generate audience rules from natural language
- Generate campaign message templates

---
## Technologies Used
- **Frontend:** Next.js 14, shadcn/ui, Tailwind CSS, V0.dev
- **Backend:** Next.js API routes, MongoDB, NextAuth.js
- **Database:** MongoDB
- **Authentication:** NextAuth.js
- **AI Integration:** GROQ AI Inference
- **Deployment:** Vercel


## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/feature-name`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

MIT

---

## Credits

- [Next.js](https://nextjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [NextAuth.js](https://next-auth.js.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [OpenAI](https://openai.com/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

---

## Contact

Made with ❤️ by Ansh Jain  
[GitHub](https://github.com/AnshJain9159/Xeno-Assignment)