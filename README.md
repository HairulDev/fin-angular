# Project Documentation

This repository contains documentation and references for both the **backend** (.NET Core 8) and **backend** (Rust Axum for upload/download file) and **frontend** (Vue.js or React.js or Angular.js)

---

## Related Projects

- **.NET Core 8 (Backend)**: [fin-netcore](https://github.com/HairulDev/fin-netcore)
- **Vue.js (Frontend)**: [fin-vuejs](https://github.com/HairulDev/fin-vuejs)
- **Rust (Axum) Version**: [fin-rustaxum](https://github.com/HairulDev/fin-rustaxum)
- **React (TypeScript) Version**: [fin-reactts](https://github.com/HairulDev/fin-reactts)
- **Angular (TypeScript) Version**: [fin-angular](https://github.com/HairulDev/fin-angular)

---

## Prerequisites
- Ensure you have Node.js and npm installed on your system.

## Installation
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Create a `.env` file in the project root directory and add the necessary environment variables:

```env
VITE_API_URL=your_api_net_core_url_here
VITE_API_RUST_URL=your_api_rust_url_here
VITE_API_FMP=https://financialmodelingprep.com
VITE_API_KEY=your_api_key (go to https://financialmodelingprep.com)
```

4. Run `npm install` to install the project dependencies.

## Running the Project
- Use `npm run dev` to start the development server.