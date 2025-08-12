# Dockerfile
FROM elixir:1.15-alpine

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    git \
    nodejs \
    npm \
    postgresql-client


# Set environment variables
ENV MIX_ENV=dev
ENV PORT=4000

# Create app directory
WORKDIR /app

# Install hex and rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Copy mix files
COPY mix.exs mix.lock ./

# Install elixir dependencies
RUN mix deps.get

# Copy application code
COPY . .

# Update dependencies to resolve any lock file issues
RUN mix deps.get --force

# Copy assets and install node dependencies
COPY assets/package*.json ./assets/
RUN cd assets && npm install

# Compile the application (development mode)
RUN mix compile

# Copy entrypoint script and set permissions
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh


# Expose port
EXPOSE 4000

CMD ["sh", "/app/entrypoint.sh"]

