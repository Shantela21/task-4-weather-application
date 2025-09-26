# Weather Application

A simple React application built with Vite, featuring routing, a shared header, and two main pages: Home and Settings. Styled using TailwindCSS.

## Table of Contents

- [Features](#features)  
- [Technologies Used](#technologies-used)  
- [Getting Started](#getting-started)  
- [Project Structure](#project-structure)  
- [Available Scripts](#available-scripts)  
- [Contributing](#contributing)  
- [License](#license)  

## Features

- Modern React setup with Vite  
- Client-side routing using `react-router-dom`  
- Reusable `Header` component  
- Home and Settings pages  
- TailwindCSS styling  
- Redirect unknown routes to Home  

## Technologies Used

- React 18  
- Vite  
- TailwindCSS 3  
- TypeScript  
- PostCSS & Autoprefixer  

## Getting Started

### Prerequisites

- Node.js v18+  
- npm or yarn  

## Installation

### 1.  Clone the repository:

```bash
git clone <your-repo-url>
```

###  2. Navigate to the project folder:
```bash
cd weather-application
```

###  3. Install dependencies:

```bash
npm install
```
## Running the App
```bash
npm run dev
```

# or
```
yarn dev
```
 Open http://localhost:5173
 to view the app in your browser.

 ## Preview the production build:
 ```bash
npm run preview
```
# or
```
yarn preview
```

## Building for Production
```bash
npm run build
```
## or
```
yarn build
```
## Project Structure
```
weather-application/
├─ public/
├─ src/
│  ├─ components/
│  │  └─ Header.tsx
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  └─ Settings.tsx
│  ├─ App.tsx
│  └─ main.tsx
├─ index.html
├─ package.json
├─ tailwind.config.js
└─ postcss.config.js
```
## Available Scripts

npm run dev — Start development server

npm run build — Build production files

npm run preview — Preview production build

## Contributing
Feel free to submit issues or pull requests. Please follow the code style and conventions used in the project.

## Author
Shantela Noyila