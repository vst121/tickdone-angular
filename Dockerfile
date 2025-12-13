# Stage 1: Build
FROM node:20 AS build
WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy dependencies
COPY package*.json ./
RUN npm install

# Copy all files
COPY . .

# Build Angular app
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist/tickdone-angular/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
