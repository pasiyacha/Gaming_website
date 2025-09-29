# SL Gaming Hub Frontend

Frontend application for SL Gaming Hub, a platform for gaming top-ups and digital content.

## Technologies Used

- React + Vite for fast development and optimized builds
- Tailwind CSS for styling
- Axios for API communication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/SlGamingHub-frontend.git
   cd SlGamingHub-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## API Configuration

The application uses a centralized API configuration system that automatically switches between development and production environments:

- Development mode: `http://localhost:5000/api`
- Production mode: `http://16.170.236.106:5000/api`

See the [API Configuration Guide](./docs/api-configuration.md) for more details on how to work with the API utilities.

## Environment Variables

Create a `.env` file in the root directory to customize the configuration:

```
# API URL (optional, overrides default configuration)
VITE_API_URL=https://your-custom-api-url.com/api

# Other environment variables
VITE_APP_NAME=SL Gaming Hub
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
