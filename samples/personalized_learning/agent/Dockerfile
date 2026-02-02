FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY *.py ./

# Create learner context directory
RUN mkdir -p /app/learner_context

# Set environment variables
ENV PORT=8080
# GOOGLE_CLOUD_PROJECT must be set at runtime
ENV GOOGLE_CLOUD_LOCATION=global

# Expose port
EXPOSE 8080

# Run the server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
