# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies with retry and timeout settings
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --no-audit --no-fund

# Copy the rest of the code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_MAPBOX_API_KEY
ARG GOOGLE_MAPS_API_KEY
ARG OPENWEATHER_API_KEY

# Set environment variables for build
ENV NEXT_PUBLIC_MAPBOX_API_KEY=$NEXT_PUBLIC_MAPBOX_API_KEY
ENV GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY
ENV OPENWEATHER_API_KEY=$OPENWEATHER_API_KEY
ENV JWT_SECRET=$JWT_SECRET

# Build the Next.js app
RUN npm run build

# Expose default Next.js port
EXPOSE 3000

# Start production server
CMD ["npm", "run", "start"]
