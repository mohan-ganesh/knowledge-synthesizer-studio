FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY . .

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Run the server
CMD ["python", "server.py"]
