# Deficit Glow

Deficit Glow is a mobile-first dieting app MVP for tracking calorie deficit from food and exercise, with progress toward a 1 kg fat-loss equivalent using **7,700 kcal per kg**.

## Features

- Onboarding with metric or US units
- Daily calorie target, food calories, exercise calories, and total deficit
- Progress toward the next 7,700 kcal milestone
- Daily nutrient picker for protein, carbs, fat, fiber, sugar, and sodium
- Manual food logging
- Mock branded food search
- Manual barcode lookup placeholder
- Manual exercise logging with future sync source fields
- 10-minute supportive craving mode
- Goal vision board
- Weekly deficit chart and total
- Installable web app metadata through a manifest and service worker

## Publish With GitHub Pages

1. Create a GitHub repository.
2. Upload or push this project.
3. Open the repository settings.
4. Go to Pages.
5. Choose **Deploy from a branch**.
6. Select the `main` branch and `/root` folder.

GitHub Pages will publish the app at:

```text
https://yourusername.github.io/your-repo-name/
```

## Local Preview

Run any static server from this folder, then open the local URL.

```bash
python3 -m http.server 4173
```

Then visit:

```text
http://127.0.0.1:4173/
```

## Future Integrations

- Open Food Facts API
- USDA FoodData Central API
- Nutritionix API
- Apple HealthKit
- Google Fit
- Fitbit API
- AI future-self image generation
- Push notifications
- Subscription paywall
