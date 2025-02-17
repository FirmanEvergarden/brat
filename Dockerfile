# Gunakan image Node.js yang mendukung Playwright
FROM mcr.microsoft.com/playwright:focal

# Set environment variable untuk menghindari dialog pada Playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

# Tentukan work directory
WORKDIR /app

# Copy file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy semua file ke container
COPY . .

# Install Playwright dependencies dan browser binaries
RUN npx playwright install --with-deps

# Expose port untuk aplikasi
EXPOSE 7860

# Start aplikasi
CMD ["npm", "start"]
