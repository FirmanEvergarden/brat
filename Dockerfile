# Gunakan Playwright base image
FROM mcr.microsoft.com/playwright:v1.41.1

# Set working directory
WORKDIR /app

# Copy file package.json dan package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy semua file ke dalam container
COPY . .

# Jalankan aplikasi
CMD ["node", "index.js"]
