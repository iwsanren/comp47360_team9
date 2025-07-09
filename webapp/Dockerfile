# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose default Next.js port
EXPOSE 3000

# Start development server (can change to `npm run build && npm start` for production)
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
