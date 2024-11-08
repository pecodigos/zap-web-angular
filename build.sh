#!/bin/bash
sed -i "s|__SECRET_KEY__|$SECRET_KEY|g" src/environments/environment.ts

# Run the Angular build command
ng build --configuration=production
