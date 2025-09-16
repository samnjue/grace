# Grace
Grace by Ivory is a dynamic mobile application built with React Native (Expo) that integrates Supabase for backend services and supports M-Pesa STK Push functionality. The app is designed for church communities, offering features like digital sermons, Sunday guides, community news, payments, and scripture readings in both English and Kiswahili.

## Features
🌐 Multi-Screen Navigation

- Utilizes React Navigation with stack and tab navigators for smooth transitions.

- Organized navigation architecture split into MainTabNavigator, HomeNavigator, PesaNavigator, ProfileNavigator, and more.

🔒 Authentication

- User authentication and session management via Supabase.

- Church and district selection screens with onboarding logic.

👥 Community Engagement

- Post and view District News.

- Share sermons and weekly highlights with text and image support.

✝️ Digital Bible & Songs

- Built-in Bible (bilingual) and Hymnal reader.

- Support for Tenzi za Rohoni.

💵 GracePesa (M-Pesa Integration)

- Seamless M-Pesa STK Push implementation.

- View receipts, stats, and payment options.

- STK Push and callback functions hosted via Supabase Edge Functions.

📹 Media & Audio Services

- Audio playback support for sermons or music.

- Offline capabilities and persistent storage.

## Tech Stack
React Native (Expo)

Supabase (Auth, Database, Edge Functions, Notifications)

Redux for state management

React Navigation for Tabs and Stack screens

M-Pesa Daraja API via Supabase Edge Functions

## Screenshots

<div style="display: flex; flex-wrap: wrap; gap: 12px; padding: 16px 0;">

  <img src="https://github.com/user-attachments/assets/4bddef36-cb98-4b72-9a6c-2fa219ace729" width="200" alt="HomeScreen"/>
  <img src="https://github.com/user-attachments/assets/b2c12669-b1f3-44d9-9d4a-0716888176dc" width="200" alt="ChapterScreen"/>
  <img src="https://github.com/user-attachments/assets/b3e848e4-b394-4d5b-867a-df63a803978b" width="200" alt="GracePesaScreen"/>
  <img src="https://github.com/user-attachments/assets/2dd147da-9a24-4231-9546-b34f7c9cf7b5" width="200" alt="PayDetailsScreen"/>
  <img src="https://github.com/user-attachments/assets/5d358082-22c4-4e3e-852b-fcdf8d5cb2f2" width="200" alt="NewGuideScreen"/>

</div>





