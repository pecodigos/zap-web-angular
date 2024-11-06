#!/bin/bash

# Replace placeholders in environment.ts with Vercel environment variables
sed -i "s|__API_URL__|$API_URL|g" src/environments/environment.ts
sed -i "s|__WEBSOCKET_URL__|$WEBSOCKET_URL|g" src/environments/environment.ts
sed -i "s|__CHAT_URL__|$CHAT_URL|g" src/environments/environment.ts
sed -i "s|__SECRET_KEY__|$SECRET_KEY|g" src/environments/environment.ts

# Run the Angular build command
ng build --configuration=production
