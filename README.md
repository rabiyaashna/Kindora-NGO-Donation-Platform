
# Kindora – NGO Donation & Volunteer Platform

A responsive NGO platform designed to connect donors, volunteers, and charitable campaigns in one place.

## Project Information

- Industry: Non-Profit Sector
- Training: Zelvora Industry Labs
- Program: 4-Week Industry Training
- Project: Week 3 – Web Development

## Features

- NGO campaign showcase
- Donation amount selection
- Donation confirmation interface
- Volunteer registration
- Dynamic fundraising progress bars
- Dashboard statistics
- Responsive user interface
- Backend API integration
- JSON-based persistent storage

## Technology Stack

- HTML5
- CSS3
- JavaScript ES6
- Node.js
- Express.js
- JSON file storage

## Installation

1. Clone the repository.

2. Open the project folder in VS Code.

3. Install dependencies:

   npm install

4. Start the development server:

   npm run dev

5. Open your browser:

   http://localhost:3000

## Project Structure

NGO-Donation-Volunteer-Platform/

- public/
  - index.html
  - style.css
  - script.js
- server.js
- package.json
- README.md
- db.json (generated automatically)

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/campaigns | Get campaigns |
| POST | /api/donations | Submit donation pledge |
| POST | /api/volunteers | Register volunteer |
| GET | /api/stats | Get dashboard statistics |

## Mentor Challenge

The fundraising progress updates after a donation is submitted without refreshing the page.

Campaign and dashboard data are also refreshed periodically for other connected browsers.

## Important Note

This is a demonstration project. Donations are recorded as pledges. No real payment gateway is connected.

## Developer

Built as part of the Zelvora Industry Labs 4-Week Industry Training Program.

Web Development – Week 3.
