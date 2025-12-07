#!/bin/bash
# MAEPLE LXC Deployment Script for Proxmox
# Run this inside a fresh Alpine or Debian LXC container

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MAEPLE Deployment Script for Proxmox LXC           ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# Detect OS
if [ -f /etc/alpine-release ]; then
    OS="alpine"
    echo "→ Detected Alpine Linux"
elif [ -f /etc/debian_version ]; then
    OS="debian"
    echo "→ Detected Debian/Ubuntu"
else
    echo "✗ Unsupported OS. Please use Alpine or Debian."
    exit 1
fi

# Configuration
MAEPLE_DIR="/var/www/maeple"
MAEPLE_USER="maeple"
REPO_URL="https://github.com/genpozi/pozimind.git"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_info() { echo -e "${YELLOW}→${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# Install dependencies based on OS
install_deps() {
    log_info "Installing dependencies..."
    
    if [ "$OS" = "alpine" ]; then
        apk update
        apk add --no-cache nginx nodejs npm git curl
    else
        apt-get update
        apt-get install -y nginx nodejs npm git curl
    fi
    
    log_success "Dependencies installed"
}

# Setup nginx
setup_nginx() {
    log_info "Configuring nginx..."
    
    # Create nginx config for MAEPLE
    cat > /etc/nginx/http.d/maeple.conf << 'NGINX_CONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/maeple;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
NGINX_CONF

    # For Debian, config path is different
    if [ "$OS" = "debian" ]; then
        mv /etc/nginx/http.d/maeple.conf /etc/nginx/sites-available/maeple.conf 2>/dev/null || true
        mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
        cat > /etc/nginx/sites-available/maeple << 'NGINX_CONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/maeple;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
NGINX_CONF
        rm -f /etc/nginx/sites-enabled/default
        ln -sf /etc/nginx/sites-available/maeple /etc/nginx/sites-enabled/
    fi
    
    log_success "Nginx configured"
}

# Clone and build MAEPLE
build_maeple() {
    log_info "Building MAEPLE..."
    
    # Create temp build directory
    BUILD_DIR=$(mktemp -d)
    cd "$BUILD_DIR"
    
    # Clone repository
    git clone --depth 1 "$REPO_URL" .
    
    # Install dependencies and build
    npm ci
    npm run build || {
        log_error "Build failed. Check if all dependencies are met."
        exit 1
    }
    
    # Copy built files
    mkdir -p "$MAEPLE_DIR"
    cp -r dist/* "$MAEPLE_DIR/"
    
    # Cleanup
    cd /
    rm -rf "$BUILD_DIR"
    
    log_success "MAEPLE built and deployed to $MAEPLE_DIR"
}

# Deploy from pre-built dist (alternative)
deploy_prebuilt() {
    log_info "Deploying pre-built MAEPLE..."
    
    mkdir -p "$MAEPLE_DIR"
    
    # If dist folder exists in current directory, use it
    if [ -d "./dist" ]; then
        cp -r ./dist/* "$MAEPLE_DIR/"
        log_success "Deployed from local dist folder"
    else
        log_error "No dist folder found. Run 'npm run build' first or use --build flag."
        exit 1
    fi
}

# Start services
start_services() {
    log_info "Starting services..."
    
    if [ "$OS" = "alpine" ]; then
        rc-update add nginx default 2>/dev/null || true
        rc-service nginx restart || nginx
    else
        systemctl enable nginx
        systemctl restart nginx
    fi
    
    log_success "Services started"
}

# Create systemd service for auto-updates (optional)
create_update_service() {
    if [ "$OS" = "debian" ]; then
        cat > /etc/systemd/system/maeple-update.service << 'SERVICE'
[Unit]
Description=MAEPLE Auto Update
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/maeple-update.sh
SERVICE

        cat > /etc/systemd/system/maeple-update.timer << 'TIMER'
[Unit]
Description=Run MAEPLE update daily

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
TIMER

        cat > /usr/local/bin/maeple-update.sh << 'SCRIPT'
#!/bin/bash
cd /tmp
git clone --depth 1 https://github.com/genpozi/pozimind.git maeple-update
cd maeple-update
npm ci && npm run build
cp -r dist/* /var/www/maeple/
cd / && rm -rf /tmp/maeple-update
SCRIPT
        chmod +x /usr/local/bin/maeple-update.sh
        
        log_success "Auto-update service created (disabled by default)"
    fi
}

# Print summary
print_summary() {
    IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Deployment Complete!                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  MAEPLE is now running at:"
    echo ""
    echo "    → http://$IP/"
    echo "    → http://localhost/"
    echo ""
    echo "  Health check: http://$IP/health"
    echo ""
    echo "  Files location: $MAEPLE_DIR"
    echo ""
    echo "  To update MAEPLE:"
    echo "    1. Build locally: npm run build"
    echo "    2. Copy dist/* to $MAEPLE_DIR/"
    echo "    3. Restart nginx: systemctl restart nginx"
    echo ""
}

# Main
main() {
    case "${1:-}" in
        --prebuilt)
            install_deps
            setup_nginx
            deploy_prebuilt
            start_services
            ;;
        --build)
            install_deps
            setup_nginx
            build_maeple
            start_services
            ;;
        *)
            echo "Usage: $0 [--build|--prebuilt]"
            echo ""
            echo "  --build     Clone repo and build from source"
            echo "  --prebuilt  Deploy from existing dist/ folder"
            echo ""
            exit 0
            ;;
    esac
    
    create_update_service
    print_summary
}

main "$@"
