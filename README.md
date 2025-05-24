# Next.js MongoDB Application

This is a Next.js application with MongoDB integration. It provides a simple user management system with a modern UI built using Tailwind CSS.

## Prerequisites

- Node.js 14.x or later
- MongoDB running locally on port 27017

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following content:
   ```
   MONGODB_URI=mongodb://localhost:27017/bidding-bot
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- MongoDB integration with Mongoose
- User management (Create and List)
- Modern UI with Tailwind CSS
- TypeScript support
- API routes for data operations

## Project Structure

- `/app` - Next.js app directory containing pages and API routes
- `/lib` - Utility functions and configurations
- `/models` - MongoDB models
- `/public` - Static assets

## API Endpoints

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

## Technologies Used

- Next.js 13+
- MongoDB
- Mongoose
- TypeScript
- Tailwind CSS

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
