# NexusStream API

A production-grade backend engine for a hybrid video streaming and social media platform. Built with Node.js, Express, and MongoDB, leveraging advanced aggregation pipelines for handling complex data relationships.

## Architecture Highlights

### Polymorphic Like System
A unified architecture where a single "Likes" collection handles interactions across the entire platform using `targetId` and `targetType` (Video, Comment, or Tweet). This approach reduces code duplication and simplifies database management.

### Advanced MongoDB Aggregation
- **Dynamic Data Injection**: Real-time calculation of `likesCount`, `subscriberCount`, and `isSubscribed` status
- **Complex Joins**: Multi-stage `$lookup` and `$addFields` operations for efficient data merging
- **Performance Optimization**: Minimized memory overhead while delivering rich JSON responses

### Data Integrity
Cascade-style cleanup logic ensures that deleting a video automatically removes all associated comments and likes, maintaining database consistency.

### Authentication & Authorization
- JWT-based authentication with Access and Refresh Token logic
- Strict ownership verification through middleware and controller-level checks
- Users can only modify their own content (Videos, Playlists, Tweets, Comments)

## Core Features

### Video Management
- Upload and streaming via Cloudinary integration
- Regex-based search with case-insensitive filtering
- Automatic watch history tracking

### Social Feed
- Tweet engine for text-based updates with engagement support
- Nested comment system with ownership management and like tracking

### Subscription System
- Self-referencing many-to-many relationships for user subscriptions
- Real-time profile analytics for subscriber counts

### Playlist Management
- Create, update, and delete curated collections
- Atomic updates using `$addToSet` and `$pull` to prevent duplicates

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Media Storage**: Cloudinary
- **Security**: Bcrypt, JWT
- **Documentation**: Postman

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account

### Installation

1. Clone the repository
```bash
git clone https://github.com/somandhir/backend-project.git
cd backend-project
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables

Create a `.env` file in the root directory:

```env
PORT=8000
MONGODB_URI=your_mongodb_uri
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

4. Start the server
```bash
npm run dev
```

## API Documentation

Complete API documentation is available via Postman:

[View API Documentation](https://documenter.getpostman.com/view/39134062/2sBXVo8SpM)

## Data Model

[View Data Model Diagram](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

## Project Structure

```
backend-project/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── utils/
├── public/
│   └── temp/
└── package.json
```

## License

This project is open source and available for educational purposes.