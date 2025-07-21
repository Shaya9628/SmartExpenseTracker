# SmartExpenseTracker

A modern, user-friendly expense tracking application built with React Native. Track your expenses, view spending patterns, and manage your finances on the go.

## 📱 Features

- 💰 Track expenses with categories
- 📊 Visualize spending with charts and graphs
- 📱 SMS transaction import (Android)
- 🎨 Clean, intuitive UI with dark/light theme support
- 🔄 Data persistence with SQLite
- 📱 Cross-platform (iOS & Android)

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm 
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SmartExpenseTracker.git
   cd SmartExpenseTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup (macOS only)**
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the App

#### Android
```bash
# Start Metro bundler
npx react-native start

# In a new terminal
npx react-native run-android
```

# Run the app
npx react-native run-ios
```

## 📱 Usage

1. **Onboarding**
   - Complete the quick onboarding to get started
   - Grant necessary permissions for SMS access (for automatic transaction imports)

2. **Adding Expenses**
   - Tap the + button to add a new expense
   - Select a category, add amount, and any notes
   - Save to track your expense

3. **Viewing Expenses**
   - Dashboard shows your spending overview
   - History tab lists all your transactions
   - Filter and search through your expenses

4. **SMS Import (Android)**
   - Enable SMS permissions when prompted
   - The app will automatically detect and import transactions from your SMS

## 🛠️ Troubleshooting

### Common Issues

- **Metro Bundler not starting**: Try `npx react-native start --reset-cache`
- **Android build failures**: Ensure you have the correct Android SDK installed
- **iOS build failures**: Make sure you've run `pod install` in the `ios` directory

### Debugging

- Enable React Native Debugger: `adb shell input keyevent 82` (Android)
- Check logs: `react-native log-android` or `react-native log-ios`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 🙏 Acknowledgments

- React Native community
- React Navigation for routing
- React Native Paper for UI components
- And all other open-source libraries used in this project



Project Link: https://github.com/Shaya9628/SmartExpenseTracker